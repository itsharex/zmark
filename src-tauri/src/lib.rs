use tauri::{
    menu::{MenuBuilder, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
#[cfg(any(target_os = "linux", all(target_os = "windows", target_env = "msvc")))]
use tauri_plugin_deep_link::DeepLinkExt;

mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        // 允许打开浏览器
        .plugin(tauri_plugin_shell::init())
        // 处理 zmark:// 协议
        .plugin(tauri_plugin_deep_link::init())
        // 单实例插件：处理应用已运行时点击 deep link 的情况
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 查找 zmark:// 开头的参数
            let url_arg = argv.iter().find(|arg| arg.starts_with("zmark://"));
            if let Some(url) = url_arg {
                println!("Deep link received in single-instance: {}", url);
                // 发送 "deep-link-received" 事件给前端
                let _ = app.emit("deep-link-received", url);
            } else if let Some(file_arg) = argv.iter().find(|arg| arg.ends_with(".md") || arg.ends_with(".zmark")) {
                println!("File open received in single-instance: {}", file_arg);
                let _ = app.emit("file-open-received", file_arg);
            } else {
                // 在 macOS 上，开发环境下有时候 url 不会在 argv 中直接传递，
                // 而是通过系统事件触发，这里加个 fallback 日志方便排查
                println!("Single instance triggered. Argv: {:?}", argv);

                // 如果 argv 没有，尝试检查是否通过 AppleEvents 传递 (macOS 特有)
                // 注意：tauri-plugin-deep-link 会尝试在 setup 中处理这个，
                // 但如果是 single-instance 触发，说明已经有了实例。
                // 我们可以尝试广播一个空消息让前端去检查 onOpenUrl
                // 或者，这里确实拿不到 URL，只能依靠前端的 onOpenUrl 监听器（如果是首次启动）
                // 但 single-instance 是针对已运行实例的。

                // 尝试手动发送一个信号给前端，让前端知道有唤起动作
                let _ = app.emit("deep-link-check", ());
            }

            // 显示并聚焦主窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "显示 zmark", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let tray_menu = MenuBuilder::new(app)
                .items(&[
                    &show_item,
                    &PredefinedMenuItem::separator(app)?,
                    &quit_item,
                ])
                .build()?;

            TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // #[cfg(debug_assertions)]
            // {
            //     let window = app.get_webview_window("main").unwrap();
            //     window.open_devtools();
            // }

            // 阻止关闭，改为隐藏到系统托盘，保持协作连接继续运行。
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            db::init_db(app.handle())?;

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Regular);

            // 在 Linux 和 Windows 上可能需要手动注册
            #[cfg(any(target_os = "linux", all(target_os = "windows", target_env = "msvc")))]
            app.deep_link().register_all()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::startup::get_app_startup_args,
            commands::knowledge_base::create_knowledge_base,
            commands::knowledge_base::list_knowledge_bases,
            commands::knowledge_base::add_document,
            commands::knowledge_base::list_documents,
            commands::knowledge_base::delete_document,
            commands::knowledge_base::chat,
            commands::git::git_file_history,
            commands::git::git_file_content,
            commands::runner::run_python,
            commands::ai::ai_copilot,
            commands::tray::minimize_to_tray,
            commands::tray::show_window,
            commands::tray::is_window_visible
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
