use crate::db::get_db_conn;
use anyhow::Result;
use byteorder::{LittleEndian, ReadBytesExt, WriteBytesExt};
use futures_util::StreamExt;
use reqwest::Client;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::Cursor;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Window};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct KnowledgeBase {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub kb_id: String,
    pub filename: String,
    pub content: String,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
// TODO: dead code, remove it
#[allow(dead_code)]
pub struct Chunk {
    pub id: String,
    pub doc_id: String,
    pub kb_id: String,
    pub content: String,
    pub embedding: Vec<f32>,
    pub chunk_index: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RetrievedDocument {
    pub filename: String,
    pub content: String,
    pub similarity: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ThinkingProcess {
    pub retrieved_docs: Vec<RetrievedDocument>,
}

#[tauri::command]
pub async fn create_knowledge_base(
    app: AppHandle,
    name: String,
) -> std::result::Result<KnowledgeBase, String> {
    let conn = get_db_conn(&app).map_err(|e: anyhow::Error| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "INSERT INTO knowledge_bases (id, name, created_at) VALUES (?1, ?2, ?3)",
        params![id, name, created_at],
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(KnowledgeBase {
        id,
        name,
        created_at,
    })
}

#[tauri::command]
pub async fn list_knowledge_bases(
    app: AppHandle,
) -> std::result::Result<Vec<KnowledgeBase>, String> {
    let conn = get_db_conn(&app).map_err(|e: anyhow::Error| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, created_at FROM knowledge_bases ORDER BY created_at DESC")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let kb_iter = stmt
        .query_map([], |row| {
            Ok(KnowledgeBase {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let mut kbs = Vec::new();
    for kb in kb_iter {
        kbs.push(kb.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(kbs)
}

#[tauri::command]
pub async fn add_document(
    app: AppHandle,
    kb_id: String,
    filename: String,
    content: String,
    api_key: String,
) -> std::result::Result<Document, String> {
    let conn = get_db_conn(&app).map_err(|e: anyhow::Error| e.to_string())?;
    let doc_id = Uuid::new_v4().to_string();
    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // 1. 切片
    let chunks = split_content(&content, 400, 50);

    // 2. 生成向量
    let embeddings = get_embeddings(&chunks, &api_key)
        .await
        .map_err(|e: anyhow::Error| e.to_string())?;

    if chunks.len() != embeddings.len() {
        return Err("Embedding count mismatch".to_string());
    }

    // 3. 存入数据库
    let mut conn = conn;
    let tx = conn
        .transaction()
        .map_err(|e: rusqlite::Error| e.to_string())?;

    tx.execute(
    "INSERT INTO documents (id, kb_id, filename, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
    params![doc_id, kb_id, filename, content, created_at],
  )
  .map_err(|e: rusqlite::Error| e.to_string())?;

    for (i, (chunk_content, embedding)) in chunks.iter().zip(embeddings.iter()).enumerate() {
        let chunk_id = Uuid::new_v4().to_string();
        let embedding_blob = f32_vec_to_blob(embedding);
        tx.execute(
            "INSERT INTO chunks (id, doc_id, kb_id, content, embedding, chunk_index) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![chunk_id, doc_id, kb_id, chunk_content, embedding_blob, i as i32],
        ).map_err(|e: rusqlite::Error| e.to_string())?;
    }

    tx.commit().map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(Document {
        id: doc_id,
        kb_id,
        filename,
        content,
        created_at,
    })
}

#[tauri::command]
pub async fn list_documents(
    app: AppHandle,
    kb_id: String,
) -> std::result::Result<Vec<Document>, String> {
    let conn = get_db_conn(&app).map_err(|e: anyhow::Error| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, kb_id, filename, content, created_at FROM documents WHERE kb_id = ?1 ORDER BY created_at DESC")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let doc_iter = stmt
        .query_map(params![kb_id], |row| {
            Ok(Document {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                filename: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let mut docs = Vec::new();
    for doc in doc_iter {
        docs.push(doc.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(docs)
}

#[tauri::command]
pub async fn delete_document(app: AppHandle, doc_id: String) -> std::result::Result<(), String> {
    let conn = get_db_conn(&app).map_err(|e: anyhow::Error| e.to_string())?;
    conn.execute("DELETE FROM documents WHERE id = ?1", params![doc_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn chat(
    app: AppHandle,
    kb_id: String,
    question: String,
    api_key: String,
    window: Window,
) -> std::result::Result<(), String> {
    // 1. 生成问题的 Embedding
    let question_embeddings = get_embeddings(&vec![question.clone()], &api_key)
        .await
        .map_err(|e: anyhow::Error| e.to_string())?;

    let question_embedding = question_embeddings
        .get(0)
        .ok_or("Failed to get question embedding")?
        .clone();

    // 2. 检索 Top-K (这里在 await 之前完成数据库操作并释放连接)
    let (context, retrieved_docs) = {
        let conn = get_db_conn(&app).map_err(|e: anyhow::Error| e.to_string())?;
        let mut stmt = conn.prepare("SELECT chunks.content, chunks.embedding, documents.filename FROM chunks JOIN documents ON chunks.doc_id = documents.id WHERE chunks.kb_id = ?1")
            .map_err(|e: rusqlite::Error| e.to_string())?;

        let chunk_iter = stmt
            .query_map(params![kb_id], |row| {
                let content: String = row.get(0)?;
                let blob: Vec<u8> = row.get(1)?;
                let filename: String = row.get(2)?;
                let embedding = blob_to_f32_vec(&blob);
                Ok((content, embedding, filename))
            })
            .map_err(|e: rusqlite::Error| e.to_string())?;

        let mut similarities = Vec::new();
        for chunk in chunk_iter {
            let (content, embedding, filename) =
                chunk.map_err(|e: rusqlite::Error| e.to_string())?;
            let sim = cosine_similarity(&question_embedding, &embedding);
            similarities.push((content, sim, filename));
        }

        // 相似度排序 相似度大的优先
        similarities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // 按文件名去重，每个文件只保留最相关的片段
        let mut seen_filenames = std::collections::HashSet::new();
        let mut unique_similarities = Vec::new();
        for (content, similarity, filename) in similarities {
            if !seen_filenames.contains(&filename) {
                seen_filenames.insert(filename.clone());
                unique_similarities.push((content, similarity, filename));
            }
        }

        // 设置相似度阈值，过滤掉不相关的文档（比如相似度低于 50%）
        let similarity_threshold = 0.5;
        let filtered_similarities: Vec<_> = unique_similarities
            .into_iter()
            .filter(|(_, similarity, _)| *similarity >= similarity_threshold)
            .collect();

        let top_chunks: Vec<String> = filtered_similarities
            .iter()
            .take(5)
            .map(|(c, _, _)| c.clone())
            .collect();
        let retrieved_docs: Vec<RetrievedDocument> = filtered_similarities
            .into_iter()
            .take(5)
            .map(|(c, s, f)| RetrievedDocument {
                filename: f,
                content: c,
                similarity: s,
            })
            .collect();
        (top_chunks.join("\n\n"), retrieved_docs)
    };

    // 3. 发送思考过程事件（包含检索到的文档），只有当有文档时才发送
    if !retrieved_docs.is_empty() {
        let thinking_process = ThinkingProcess { retrieved_docs };
        window
            .emit("chat-thinking", thinking_process)
            .map_err(|e: tauri::Error| e.to_string())?;
    }

    // 3. 调用 Chat API
    let client = Client::new();
    let prompt = format!(
        "你是一个知识库问答助手。请根据以下参考内容回答用户的问题。\n如果参考内容中没有相关信息，请如实说明。\n\n参考内容：\n{}\n\n用户问题：{}",
        context, question
    );

    let response = client
        .post("https://api.siliconflow.cn/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&json!({
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "messages": [{"role": "user", "content": prompt}],
            "stream": true
        }))
        .send()
        .await
        .map_err(|e: reqwest::Error| e.to_string())?;

    let mut stream = response.bytes_stream();
    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e: reqwest::Error| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    window
                        .emit("chat-done", "")
                        .map_err(|e: tauri::Error| e.to_string())?;
                    break;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        window
                            .emit("chat-stream", content)
                            .map_err(|e: tauri::Error| e.to_string())?;
                    }
                }
            }
        }
    }

    Ok(())
}

// 辅助函数
fn split_content(content: &str, chunk_size: usize, overlap: usize) -> Vec<String> {
    let mut chunks = Vec::new();
    let chars: Vec<char> = content.chars().collect();
    let mut start = 0;

    while start < chars.len() {
        let end = (start + chunk_size).min(chars.len());
        let chunk: String = chars[start..end].iter().collect();
        chunks.push(chunk);
        if end == chars.len() {
            break;
        }
        start += chunk_size - overlap;
    }
    chunks
}

async fn get_embeddings(texts: &Vec<String>, api_key: &str) -> Result<Vec<Vec<f32>>> {
    let client = Client::new();
    let response = client
        .post("https://api.siliconflow.cn/v1/embeddings")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&json!({
            "model": "BAAI/bge-m3",
            "input": texts
        }))
        .send()
        .await?;

    let json: serde_json::Value = response.json().await?;
    let mut embeddings = Vec::new();
    if let Some(data) = json["data"].as_array() {
        for item in data {
            if let Some(embedding_arr) = item["embedding"].as_array() {
                let vec: Vec<f32> = embedding_arr
                    .iter()
                    .map(|v| v.as_f64().unwrap_or(0.0) as f32)
                    .collect();
                embeddings.push(vec);
            }
        }
    }
    Ok(embeddings)
}

fn f32_vec_to_blob(vec: &[f32]) -> Vec<u8> {
    let mut buf = Vec::with_capacity(vec.len() * 4);
    for &f in vec {
        let _ = buf.write_f32::<LittleEndian>(f);
    }
    buf
}

fn blob_to_f32_vec(blob: &[u8]) -> Vec<f32> {
    let mut rdr = Cursor::new(blob);
    let mut vec = Vec::with_capacity(blob.len() / 4);
    while let Ok(f) = rdr.read_f32::<LittleEndian>() {
        vec.push(f);
    }
    vec
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    dot_product / (norm_a * norm_b)
}
