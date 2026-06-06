// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Native application menu, ported from `app/lib/menu/menu-builder.js`.
//!
//! The renderer drives the menu over IPC:
//!   - `menu:register(providerId, { helpMenu, newFileMenu })` registers a
//!     per-tab-type provider (first registration per id wins);
//!   - `menu:update(state)` sends the full editor state.
//!
//! Both trigger a rebuild. Clicking a menu item emits `menu:action(action,
//! options)` back to the renderer (delivered as the array `[action, options]`,
//! which the preload shim spreads into the `(event, action, options)`
//! callback).
//!
//! Items that map to an action are given a generated id (`mN`, monotonic across
//! rebuilds so a stale click can never resolve to a different action) and
//! recorded in an action registry consulted by the global `on_menu_event`
//! handler. Native items (URLs, fullscreen, devtools) are handled in-process.
//!
//! Quit is intentionally *not* a hard exit: it emits `menu:action('quit')` so
//! the renderer can run its unsaved-changes flow and reply `app:quit-allowed`
//! (wired in `ipc.rs` to actually exit), mirroring Electron.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use serde_json::{json, Value};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_opener::OpenerExt;

/// Monotonic id source. Never reset, so ids from a replaced menu never collide
/// with a different action in the current registry.
static NEXT_ID: AtomicU64 = AtomicU64::new(0);

/// Serializes the whole snapshot -> build -> store-actions -> set_menu path so
/// two concurrent rebuilds (e.g. a `menu:register` racing a `menu:update`) can
/// never install one menu while the registry holds another menu's ids.
static REBUILD_LOCK: Mutex<()> = Mutex::new(());

/// What a clicked menu item does.
#[derive(Debug, Clone)]
enum ActionSpec {
    /// Forward `menu:action(action, options)` to the renderer.
    Emit { action: String, options: Value },

    /// Open a URL in the default browser.
    OpenUrl(String),

    /// Toggle the webview devtools (debug builds only).
    ToggleDevtools,

    /// Toggle window fullscreen.
    Fullscreen,
}

#[derive(Debug, Clone, Default)]
struct Provider {
    new_file_menu: Vec<Value>,
    help_menu: Vec<Value>,
}

/// Backing model for the application menu, kept in Tauri-managed state.
pub struct MenuModel {
    /// Providers in registration order (insertion-ordered, deduped by id).
    providers: Vec<(String, Provider)>,
    state: Value,
    version: String,
    allow_remote: bool,
    actions: HashMap<String, ActionSpec>,
}

impl MenuModel {
    pub fn new(version: String, allow_remote: bool) -> Self {
        MenuModel {
            providers: Vec::new(),
            state: json!({}),
            version,
            allow_remote,
            actions: HashMap::new(),
        }
    }
}

/// Register (or ignore, if already present) a menu provider and rebuild.
pub fn register<R: Runtime>(app: &AppHandle<R>, provider_id: &str, options: &Value) {
    if provider_id.is_empty() {
        return;
    }

    {
        let model = app.state::<Mutex<MenuModel>>();
        let mut model = model.lock().expect("menu model poisoned");

        if model.providers.iter().any(|(id, _)| id == provider_id) {
            return;
        }

        model.providers.push((
            provider_id.to_string(),
            Provider {
                new_file_menu: array_field(options, "newFileMenu"),
                help_menu: array_field(options, "helpMenu"),
            },
        ));
    }

    rebuild(app);
}

/// Replace the editor state and rebuild.
pub fn update<R: Runtime>(app: &AppHandle<R>, state: Value) {
    {
        let model = app.state::<Mutex<MenuModel>>();
        let mut model = model.lock().expect("menu model poisoned");
        model.state = state;
    }

    rebuild(app);
}

/// Rebuild the native menu from the current model and install it.
pub fn rebuild<R: Runtime>(app: &AppHandle<R>) {
    // Serialize the entire build/install so the installed menu and the stored
    // action registry always belong to the same generation.
    let _guard = REBUILD_LOCK.lock().expect("menu rebuild lock poisoned");

    let (providers, state, version, allow_remote) = {
        let model = app.state::<Mutex<MenuModel>>();
        let model = model.lock().expect("menu model poisoned");
        (
            model.providers.clone(),
            model.state.clone(),
            model.version.clone(),
            model.allow_remote,
        )
    };

    let mut actions = HashMap::new();

    let menu = match build_menu(app, &providers, &state, &version, allow_remote, &mut actions) {
        Ok(menu) => menu,
        Err(err) => {
            eprintln!("menu: failed to build: {err}");
            return;
        },
    };

    // Store the registry before installing the menu so a click can always
    // resolve.
    {
        let model = app.state::<Mutex<MenuModel>>();
        model.lock().expect("menu model poisoned").actions = actions;
    }

    if let Err(err) = app.set_menu(menu) {
        eprintln!("menu: failed to set: {err}");
    }
}

/// Dispatch a menu click via the action registry.
pub fn handle_event<R: Runtime>(app: &AppHandle<R>, id: &str) {
    let spec = {
        let model = app.state::<Mutex<MenuModel>>();
        let model = model.lock().expect("menu model poisoned");
        model.actions.get(id).cloned()
    };

    let Some(spec) = spec else {
        return;
    };

    match spec {
        ActionSpec::Emit { action, options } => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu:action", vec![Value::String(action), options]);
            }
        },
        ActionSpec::OpenUrl(url) => {
            let _ = app.opener().open_url(url, None::<&str>);
        },
        ActionSpec::Fullscreen => {
            if let Some(window) = app.get_webview_window("main") {
                let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                let _ = window.set_fullscreen(!is_fullscreen);
            }
        },
        ActionSpec::ToggleDevtools => toggle_devtools(app),
    }
}

#[cfg(any(debug_assertions, feature = "devtools"))]
fn toggle_devtools<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
    }
}

#[cfg(not(any(debug_assertions, feature = "devtools")))]
fn toggle_devtools<R: Runtime>(_app: &AppHandle<R>) {
    // devtools APIs are unavailable in release builds without the feature.
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

type Actions = HashMap<String, ActionSpec>;

fn build_menu<R: Runtime>(
    app: &AppHandle<R>,
    providers: &[(String, Provider)],
    state: &Value,
    version: &str,
    allow_remote: bool,
    actions: &mut Actions,
) -> tauri::Result<Menu<R>> {
    let menu = Menu::new(app)?;

    menu.append(&build_file_menu(app, providers, state, actions)?)?;

    if state.get("editMenu").is_some() {
        menu.append(&build_edit_menu(app, state, actions)?)?;
    }

    menu.append(&build_window_menu(app, state, actions)?)?;
    menu.append(&build_help_menu(app, providers, version, allow_remote, actions)?)?;

    Ok(menu)
}

fn build_file_menu<R: Runtime>(
    app: &AppHandle<R>,
    providers: &[(String, Provider)],
    state: &Value,
    actions: &mut Actions,
) -> tauri::Result<Submenu<R>> {
    let file = Submenu::new(app, "File", true)?;

    // New File (provider-driven submenu) + "Open new file options...".
    let new_file = Submenu::new(app, "New File", true)?;
    append_new_file_entries(app, &new_file, providers, actions)?;
    emit_item(
        app,
        &new_file,
        actions,
        "Open new file options...",
        Some("CommandOrControl+N"),
        true,
        "emit-event",
        json!({ "type": "createNewAction.open" }),
    )?;
    file.append(&new_file)?;

    emit_item(
        app,
        &file,
        actions,
        "New Process Application...",
        None,
        true,
        "emit-event",
        json!({ "type": "create-process-application" }),
    )?;

    emit_item(app, &file, actions, "Open File...", Some("CommandOrControl+O"), true, "open-diagram", json!({}))?;

    file.append(&build_open_recent(app, state, actions)?)?;
    file.append(&PredefinedMenuItem::separator(app)?)?;

    file.append(&build_switch_tab(app, state, actions)?)?;
    file.append(&PredefinedMenuItem::separator(app)?)?;

    let can_save = bool_state(state, "save");
    emit_item(app, &file, actions, "Save File", Some("CommandOrControl+S"), can_save, "save", json!({}))?;
    emit_item(app, &file, actions, "Save File As...", Some("CommandOrControl+Shift+S"), can_save, "save-as", json!({}))?;
    emit_item(app, &file, actions, "Save All Files", Some("CommandOrControl+Alt+S"), can_save, "save-all", json!({}))?;
    file.append(&PredefinedMenuItem::separator(app)?)?;

    let export_state = state.get("exportAs").cloned().unwrap_or(Value::Null);
    let can_export = export_state.as_array().map(|a| !a.is_empty()).unwrap_or(false);
    emit_item(
        app,
        &file,
        actions,
        "Export As Image",
        Some("CommandOrControl+Shift+E"),
        can_export,
        "export-as",
        if export_state.is_null() { json!([]) } else { export_state },
    )?;
    file.append(&PredefinedMenuItem::separator(app)?)?;

    let can_close = can_close_tab(state);
    let can_switch = can_switch_tab(state);
    emit_item(app, &file, actions, "Close Tab", Some("CommandOrControl+W"), can_close, "close-active-tab", json!({}))?;
    emit_item(app, &file, actions, "Close All Tabs", None, can_close, "close-all-tabs", json!({}))?;
    emit_item(app, &file, actions, "Close Other Tabs", None, can_switch, "close-other-tabs", json!({}))?;
    file.append(&PredefinedMenuItem::separator(app)?)?;

    emit_item(app, &file, actions, "Settings", Some("CommandOrControl+,"), true, "settings-open", json!({}))?;
    file.append(&PredefinedMenuItem::separator(app)?)?;

    // Quit defers to the renderer's save-prompt flow (see module docs).
    emit_item(app, &file, actions, "Quit", Some("CommandOrControl+Q"), true, "quit", json!({}))?;

    Ok(file)
}

fn append_new_file_entries<R: Runtime>(
    app: &AppHandle<R>,
    parent: &Submenu<R>,
    providers: &[(String, Provider)],
    actions: &mut Actions,
) -> tauri::Result<()> {
    let provided: Vec<&Vec<Value>> = providers
        .iter()
        .map(|(_, p)| &p.new_file_menu)
        .filter(|menu| !menu.is_empty())
        .collect();

    if provided.is_empty() {
        let empty = MenuItem::new(app, "Empty", false, None::<&str>)?;
        parent.append(&empty)?;
        return Ok(());
    }

    // Group by `group`, preserving first-seen order.
    let mut groups: Vec<(String, Vec<&Value>)> = Vec::new();
    for menu in &provided {
        for entry in *menu {
            let group = entry.get("group").and_then(Value::as_str).unwrap_or_default().to_string();
            match groups.iter_mut().find(|(g, _)| *g == group) {
                Some((_, items)) => items.push(entry),
                None => groups.push((group, vec![entry])),
            }
        }
    }

    if groups.len() > 1 {
        for (group, items) in &groups {
            for entry in items {
                let label = format!("{} ({})", entry.get("label").and_then(Value::as_str).unwrap_or_default(), group);
                append_template_entry(app, parent, entry, Some(label), actions)?;
            }
            parent.append(&PredefinedMenuItem::separator(app)?)?;
        }
    } else {
        for menu in &provided {
            for entry in *menu {
                append_template_entry(app, parent, entry, None, actions)?;
            }
        }
    }

    Ok(())
}

fn build_open_recent<R: Runtime>(
    app: &AppHandle<R>,
    state: &Value,
    actions: &mut Actions,
) -> tauri::Result<Submenu<R>> {
    let recent = Submenu::new(app, "Open Recent", true)?;

    emit_item(
        app,
        &recent,
        actions,
        "Reopen Last File",
        Some("CommandOrControl+Shift+T"),
        bool_state(state, "lastTab"),
        "reopen-last-tab",
        json!({}),
    )?;
    recent.append(&PredefinedMenuItem::separator(app)?)?;

    if let Some(closed) = state.get("closedTabs").and_then(Value::as_array) {
        for tab in closed.iter().rev() {
            let label = tab
                .get("file")
                .and_then(|f| f.get("path"))
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();

            emit_item(app, &recent, actions, &label, None, true, "reopen-file", tab.clone())?;
        }
    }

    Ok(recent)
}

fn build_switch_tab<R: Runtime>(
    app: &AppHandle<R>,
    state: &Value,
    actions: &mut Actions,
) -> tauri::Result<Submenu<R>> {
    let switch = Submenu::new(app, "Switch Tab...", true)?;
    let can_switch = can_switch_tab(state);

    emit_item(app, &switch, actions, "Select Next Tab", Some("Control+Tab"), can_switch, "select-tab", json!("next"))?;
    emit_item(app, &switch, actions, "Select Previous Tab", Some("Control+Shift+Tab"), can_switch, "select-tab", json!("previous"))?;

    Ok(switch)
}

fn build_edit_menu<R: Runtime>(
    app: &AppHandle<R>,
    state: &Value,
    actions: &mut Actions,
) -> tauri::Result<Submenu<R>> {
    let edit = Submenu::new(app, "Edit", true)?;

    if let Some(entries) = state.get("editMenu").and_then(Value::as_array) {
        for (index, entry) in entries.iter().enumerate() {
            // An array element is a group; groups are separated by separators.
            if let Some(group) = entry.as_array() {
                if index != 0 {
                    edit.append(&PredefinedMenuItem::separator(app)?)?;
                }
                for item in group {
                    append_template_entry(app, &edit, item, None, actions)?;
                }
            } else {
                append_template_entry(app, &edit, entry, None, actions)?;
            }
        }
    }

    Ok(edit)
}

fn build_window_menu<R: Runtime>(
    app: &AppHandle<R>,
    state: &Value,
    actions: &mut Actions,
) -> tauri::Result<Submenu<R>> {
    let window = Submenu::new(app, "Window", true)?;

    if let Some(entries) = state.get("windowMenu").and_then(Value::as_array) {
        for entry in entries {
            append_template_entry(app, &window, entry, None, actions)?;
        }
        window.append(&PredefinedMenuItem::separator(app)?)?;
    }

    emit_item(app, &window, actions, "Reload", Some("CommandOrControl+R"), true, "reload-modeler", json!({}))?;
    emit_item(app, &window, actions, "Toggle Bottom Panel", Some("CommandOrControl+B"), true, "toggle-panel", json!({}))?;

    let devtools_id = add_action(actions, ActionSpec::ToggleDevtools);
    window.append(&MenuItem::with_id(app, devtools_id, "Toggle DevTools", true, normalize_accel(Some("F12")))?)?;

    let fullscreen_id = add_action(actions, ActionSpec::Fullscreen);
    window.append(&MenuItem::with_id(app, fullscreen_id, "Fullscreen", true, normalize_accel(Some("F11")))?)?;

    Ok(window)
}

fn build_help_menu<R: Runtime>(
    app: &AppHandle<R>,
    providers: &[(String, Provider)],
    version: &str,
    allow_remote: bool,
    actions: &mut Actions,
) -> tauri::Result<Submenu<R>> {
    let help = Submenu::new(app, "Help", true)?;

    url_item(app, &help, actions, "Documentation", "https://docs.camunda.io/docs/components/modeler/desktop-modeler/?utm_source=modeler&utm_medium=referral")?;
    url_item(app, &help, actions, "User Forum", "https://forum.camunda.io/c/bpmn-modeling/?utm_source=modeler&utm_medium=referral")?;
    emit_item(app, &help, actions, "Keyboard Shortcuts", None, true, "show-shortcuts", json!({}))?;
    help.append(&PredefinedMenuItem::separator(app)?)?;

    url_item(app, &help, actions, "Search Feature Requests", "https://github.com/camunda/camunda-modeler/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement")?;
    emit_item(app, &help, actions, "Report Issue", None, true, "emit-event", json!({ "type": "reportFeedback.open" }))?;

    if allow_remote {
        help.append(&PredefinedMenuItem::separator(app)?)?;
        emit_item(app, &help, actions, "Privacy Preferences", None, true, "emit-event", json!({ "type": "show-privacy-preferences" }))?;
        emit_item(app, &help, actions, "Check for Updates", None, true, "emit-event", json!({ "type": "updateChecks.execute" }))?;
    }

    help.append(&PredefinedMenuItem::separator(app)?)?;

    // Provider-supplied help entries (label + action url), deduped by label.
    let mut seen: Vec<String> = Vec::new();
    for (_, provider) in providers {
        if provider.help_menu.is_empty() {
            continue;
        }

        let mut appended = false;
        for entry in &provider.help_menu {
            let label = entry.get("label").and_then(Value::as_str).unwrap_or_default().to_string();
            if label.is_empty() || seen.contains(&label) {
                continue;
            }
            seen.push(label.clone());

            let url = entry.get("action").and_then(Value::as_str).unwrap_or_default().to_string();
            url_item(app, &help, actions, &label, &url)?;
            appended = true;
        }

        if appended {
            help.append(&PredefinedMenuItem::separator(app)?)?;
        }
    }

    url_item(app, &help, actions, "FEEL Reference", "https://docs.camunda.io/docs/components/modeler/feel/what-is-feel/?utm_source=modeler&utm_medium=referral")?;
    help.append(&PredefinedMenuItem::separator(app)?)?;

    help.append(&MenuItem::new(app, format!("Version {version}"), false, None::<&str>)?)?;
    emit_item(app, &help, actions, "What's new", None, true, "emit-event", json!({ "type": "versionInfo.open" }))?;

    Ok(help)
}

/// Append a dynamic template entry (from `editMenu`/`windowMenu`/`newFileMenu`),
/// mirroring `mapMenuEntryTemplate`/`appendMenuItem`.
fn append_template_entry<R: Runtime>(
    app: &AppHandle<R>,
    parent: &Submenu<R>,
    entry: &Value,
    label_override: Option<String>,
    actions: &mut Actions,
) -> tauri::Result<()> {
    if entry.get("type").and_then(Value::as_str) == Some("separator") {
        parent.append(&PredefinedMenuItem::separator(app)?)?;
        return Ok(());
    }

    // Electron hides items flagged `visible: false`.
    if entry.get("visible") == Some(&Value::Bool(false)) {
        return Ok(());
    }

    let label = label_override
        .unwrap_or_else(|| entry.get("label").and_then(Value::as_str).unwrap_or_default().to_string());
    let enabled = entry.get("enabled").and_then(Value::as_bool).unwrap_or(true);

    // Nested submenu.
    if let Some(children) = entry.get("submenu").and_then(Value::as_array) {
        let submenu = Submenu::new(app, &label, enabled)?;
        for child in children {
            append_template_entry(app, &submenu, child, None, actions)?;
        }
        parent.append(&submenu)?;
        return Ok(());
    }

    // Native role (undo/redo/cut/copy/paste/select all).
    if let Some(role) = entry.get("role").and_then(Value::as_str) {
        if let Some(item) = predefined_for_role(app, role, &label, enabled)? {
            parent.append(item.as_ref())?;
            return Ok(());
        }
        // Unknown role with no action: render an inert label.
        if entry.get("action").and_then(Value::as_str).is_none() {
            parent.append(&MenuItem::new(app, &label, enabled, None::<&str>)?)?;
            return Ok(());
        }
    }

    let accel = entry.get("accelerator").and_then(Value::as_str);

    if let Some(action) = entry.get("action").and_then(Value::as_str) {
        let options = entry.get("options").cloned().unwrap_or(json!({}));
        emit_item(app, parent, actions, &label, accel, enabled, action, options)?;
    } else {
        // No action and no role: inert label (e.g. a disabled heading).
        parent.append(&MenuItem::new(app, &label, enabled, normalize_accel(accel))?)?;
    }

    Ok(())
}

fn predefined_for_role<R: Runtime>(
    app: &AppHandle<R>,
    role: &str,
    label: &str,
    enabled: bool,
) -> tauri::Result<Option<Box<dyn tauri::menu::IsMenuItem<R>>>> {
    let text = if label.is_empty() { None } else { Some(label) };

    let recognized = matches!(
        role,
        "undo" | "redo" | "cut" | "copy" | "paste" | "selectAll" | "selectall"
    );

    if !recognized {
        return Ok(None);
    }

    // PredefinedMenuItem cannot be disabled; when the renderer flags the role as
    // disabled (e.g. undo/redo/cut/copy/paste with no active input), render a
    // greyed-out inert item so the disabled state is faithful.
    if !enabled {
        let item = MenuItem::new(app, label, false, None::<&str>)?;
        return Ok(Some(Box::new(item)));
    }

    let item: Box<dyn tauri::menu::IsMenuItem<R>> = match role {
        "undo" => Box::new(PredefinedMenuItem::undo(app, text)?),
        "redo" => Box::new(PredefinedMenuItem::redo(app, text)?),
        "cut" => Box::new(PredefinedMenuItem::cut(app, text)?),
        "copy" => Box::new(PredefinedMenuItem::copy(app, text)?),
        "paste" => Box::new(PredefinedMenuItem::paste(app, text)?),
        _ => Box::new(PredefinedMenuItem::select_all(app, text)?),
    };

    Ok(Some(item))
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

fn add_action(actions: &mut Actions, spec: ActionSpec) -> String {
    let id = format!("m{}", NEXT_ID.fetch_add(1, Ordering::Relaxed));
    actions.insert(id.clone(), spec);
    id
}

#[allow(clippy::too_many_arguments)]
fn emit_item<R: Runtime>(
    app: &AppHandle<R>,
    parent: &Submenu<R>,
    actions: &mut Actions,
    label: &str,
    accelerator: Option<&str>,
    enabled: bool,
    action: &str,
    options: Value,
) -> tauri::Result<()> {
    let id = add_action(actions, ActionSpec::Emit { action: action.to_string(), options });
    let item = MenuItem::with_id(app, id, label, enabled, normalize_accel(accelerator))?;
    parent.append(&item)
}

fn url_item<R: Runtime>(
    app: &AppHandle<R>,
    parent: &Submenu<R>,
    actions: &mut Actions,
    label: &str,
    url: &str,
) -> tauri::Result<()> {
    let id = add_action(actions, ActionSpec::OpenUrl(url.to_string()));
    let item = MenuItem::with_id(app, id, label, true, None::<&str>)?;
    parent.append(&item)
}

/// Normalize an Electron accelerator for muda: trim whitespace around `+`
/// (e.g. `"CommandOrControl + Up"` -> `"CommandOrControl+Up"`). muda silently
/// drops anything it still cannot parse, so this never breaks the build.
fn normalize_accel(accelerator: Option<&str>) -> Option<String> {
    accelerator.map(|accel| {
        accel
            .split('+')
            .map(str::trim)
            .collect::<Vec<_>>()
            .join("+")
    })
}

fn array_field(value: &Value, key: &str) -> Vec<Value> {
    value
        .get(key)
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
}

fn bool_state(state: &Value, key: &str) -> bool {
    state.get(key).and_then(Value::as_bool).unwrap_or(false)
}

fn tab_count(state: &Value) -> usize {
    state.get("tabs").and_then(Value::as_array).map(Vec::len).unwrap_or(0)
}

fn can_switch_tab(state: &Value) -> bool {
    tab_count(state) > 1
}

fn can_close_tab(state: &Value) -> bool {
    tab_count(state) > 0
}
