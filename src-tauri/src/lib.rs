use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpStream};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread::sleep;
use std::time::Duration;

use tauri::{Manager, RunEvent};

const NEXT_SIDE_CAR_PORT: &str = "4120";

fn spawn_sidecar(app: &tauri::AppHandle) -> Result<Child, Box<dyn std::error::Error>> {
    let resource_dir = app.path().resource_dir()?;
    let sidecar_root = resource_dir.join("next");
    let launcher_path = sidecar_root.join("next-launcher.js");
    let app_data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_data_dir)?;
    let db_path = app_data_dir.join("clinic.db");

    if !launcher_path.exists() {
        return Err("missing next launcher resource".into());
    }

    let server_entrypoint = sidecar_root.join("server").join("server.js");
    if !server_entrypoint.exists() {
        return Err("missing bundled next standalone server".into());
    }

    #[cfg(target_os = "windows")]
    let sidecar_binary_name = "next-sidecar.exe";
    #[cfg(not(target_os = "windows"))]
    let sidecar_binary_name = "next-sidecar";

    let app_executable = std::env::current_exe()?;
    let executable_dir = app_executable
        .parent()
        .ok_or("missing executable parent directory")?;
    let sidecar_binary = executable_dir.join(sidecar_binary_name);

    if !sidecar_binary.exists() {
        return Err(format!(
            "next sidecar binary not found at {}",
            sidecar_binary.display()
        )
        .into());
    }

    let child = Command::new(sidecar_binary)
        .arg(launcher_path)
        .current_dir(&sidecar_root)
        .env("NEXT_SERVER_PORT", NEXT_SIDE_CAR_PORT)
        .env("CLINIC_DB_PATH", db_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;

    Ok(child)
}

fn wait_for_sidecar(child: &mut Child) -> Result<(), Box<dyn std::error::Error>> {
    let port = NEXT_SIDE_CAR_PORT.parse::<u16>()?;
    let address = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port);

    for _ in 0..240 {
        if let Some(status) = child.try_wait()? {
            return Err(format!("next sidecar exited before startup (status: {status})").into());
        }

        if TcpStream::connect_timeout(&address, Duration::from_millis(125)).is_ok() {
            return Ok(());
        }
        sleep(Duration::from_millis(125));
    }

    Err("next sidecar server did not become ready in time".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let next_sidecar: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

    let app = tauri::Builder::default()
        .manage(next_sidecar)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            } else {
                let mut child = spawn_sidecar(app.handle())?;
                wait_for_sidecar(&mut child)?;
                if let Ok(mut slot) = app.state::<Arc<Mutex<Option<Child>>>>().lock() {
                    *slot = Some(child);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            if let Ok(mut slot) = app_handle.state::<Arc<Mutex<Option<Child>>>>().lock() {
                if let Some(mut child) = slot.take() {
                    let _ = child.kill();
                }
            }
        }
    });
}
