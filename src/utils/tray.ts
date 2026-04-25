import { invoke } from "@tauri-apps/api/core";

/**
 * 最小化窗口到系统托盘
 */
export async function minimizeToTray(): Promise<void> {
  try {
    await invoke("minimize_to_tray");
  } catch (error) {
    console.error("最小化到系统托盘失败:", error);
    throw error;
  }
}

/**
 * 从系统托盘显示窗口
 */
export async function showWindow(): Promise<void> {
  try {
    await invoke("show_window");
  } catch (error) {
    console.error("显示窗口失败:", error);
    throw error;
  }
}

/**
 * 检查窗口是否可见
 */
export async function isWindowVisible(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_window_visible");
  } catch (error) {
    console.error("检查窗口可见性失败:", error);
    throw error;
  }
}
