// Keep a console on Windows release builds so sidecar startup failures are visible.
#![cfg_attr(
    all(not(debug_assertions), not(target_os = "windows")),
    windows_subsystem = "windows"
)]

fn main() {
    app_lib::run();
}
