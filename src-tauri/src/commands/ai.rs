use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Window};

#[tauri::command]
pub async fn ai_copilot(
    app: AppHandle,
    prompt: String,
    content: String,
    api_key: String,
    window: Window,
) -> std::result::Result<(), String> {
    let client = Client::new();
    let messages = vec![
        json!({
            "role": "system",
            "content": "你是一个专业的AI写作助手。请根据用户的指令处理以下文本。只输出处理后的结果，不要包含任何额外的解释或对话。",
        }),
        json!({
            "role": "user",
            "content": format!("指令：{}\n\n文本：\n{}", prompt, content),
        }),
    ];

    let response = client
        .post("https://api.siliconflow.cn/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&json!({
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "messages": messages,
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
                        .emit("ai-copilot-done", "")
                        .map_err(|e: tauri::Error| e.to_string())?;
                    break;
                }
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        window
                            .emit("ai-copilot-stream", content)
                            .map_err(|e: tauri::Error| e.to_string())?;
                    }
                }
            }
        }
    }

    Ok(())
}
