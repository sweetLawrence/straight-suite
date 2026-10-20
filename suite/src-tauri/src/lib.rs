use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

/// Address of the built-in launcher page, saved when the window first opens
struct Home(String);

fn go_home(app: &tauri::AppHandle) {
    if let (Some(win), Some(home)) = (app.get_webview_window("main"), app.try_state::<Home>()) {
        // Plain navigation of the same window back to the launcher (no browser is opened)
        let js = format!("window.location.href = {};", serde_json::to_string(&home.0).unwrap_or_default());
        let _ = win.eval(&js);
    }
}

/// Newest version available, or nothing when this one is current (called by the launcher page)
#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    let update = updater.check().await.map_err(|e| e.to_string())?;
    Ok(update.map(|u| u.version))
}

/// Download, install and restart. Only the launcher can ask for it, so nobody is cut off mid-work.
#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![check_update, install_update])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let switch = MenuItemBuilder::with_id("switch", "Switch app")
                .accelerator("CmdOrCtrl+Shift+S")
                .build(app)?;
            let reload = MenuItemBuilder::with_id("reload", "Reload")
                .accelerator("CmdOrCtrl+R")
                .build(app)?;
            let exit = PredefinedMenuItem::quit(app, Some("Exit"))?;
            let suite = SubmenuBuilder::new(app, "Straight Suite")
                .item(&switch)
                .item(&reload)
                .separator()
                .item(&exit)
                .build()?;
            let edit = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;
            let menu = MenuBuilder::new(app).items(&[&suite, &edit]).build()?;
            app.set_menu(menu)?;

            // Where the built-in launcher lives (Windows serves it from http://tauri.localhost)
            let home = if cfg!(windows) { "http://tauri.localhost/" } else { "tauri://localhost/" };
            app.manage(Home(home.to_string()));
            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "switch" => go_home(app),
            "reload" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.eval("window.location.reload();");
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
