use rusqlite::{Connection, Result};
use tauri::AppHandle;
use tauri::Manager;

pub fn init_db(app: &AppHandle) -> Result<Connection, anyhow::Error> {
    let app_dir = app.path().app_data_dir()?;
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)?;
    }
    let db_path = app_dir.join("zmark.db");
    let conn = Connection::open(db_path)?;

    // 知识库表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS knowledge_bases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )",
        [],
    )?;

    // 文档表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            kb_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY(kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // 向量块表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            doc_id TEXT NOT NULL,
            kb_id TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding BLOB NOT NULL,
            chunk_index INTEGER NOT NULL,
            FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE,
            FOREIGN KEY(kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(conn)
}

pub fn get_db_conn(app: &AppHandle) -> Result<Connection, anyhow::Error> {
    let app_dir = app.path().app_data_dir()?;
    let db_path = app_dir.join("zmark.db");
    let conn = Connection::open(db_path)?;
    Ok(conn)
}
