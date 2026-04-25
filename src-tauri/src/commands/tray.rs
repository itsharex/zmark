use tauri::WebviewWindow;

#[tauri::command]
pub async fn minimize_to_tray(window: WebviewWindow) -> Result<(), String> {
    println!("最小化到系统托盘");
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn show_window(window: WebviewWindow) -> Result<(), String> {
    println!("从系统托盘显示窗口");
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn is_window_visible(window: WebviewWindow) -> Result<bool, String> {
    window.is_visible().map_err(|e| e.to_string())
}
