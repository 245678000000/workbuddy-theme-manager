# WorkBuddy Skin Manager Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the confirmed destructive, CDP lifecycle, packaging, and state-consistency defects so the macOS build can be safely tested against a real WorkBuddy instance and prepared for release.

**Architecture:** Keep the existing Tauri v2 + React structure, but introduce an owned CDP session state in Rust, validated filesystem boundaries, graceful process control, and a disposable JavaScript skin runtime. Bundle built-in skin assets through Tauri resources and make frontend success state depend on backend-confirmed outcomes.

**Tech Stack:** Rust 2021, Tauri v2, Tokio, reqwest, tokio-tungstenite, React 19, TypeScript 5.7, Vite 6, Vitest, Testing Library, jsdom, pnpm.

**Spec:** `README.md`, `docs/SKIN_GUIDE.md`, and the audit baseline recorded below.

## Global Constraints

- Do not modify `/Applications/WorkBuddy.app`, its `app.asar`, signatures, binaries, cookies, tokens, message bodies, or production databases.
- Never attach to a CDP endpoint that this manager did not launch and record in the current process.
- Never terminate a process based only on a substring such as `WorkBuddy` or `editor_sdk`; only act on verified PIDs belonging to the detected WorkBuddy installation.
- Preserve existing user skins under `~/.workbuddy-skins/`; invalid entries may be skipped but must not be deleted automatically.
- API keys, cookies, authentication headers, and WorkBuddy message content must not enter logs or test fixtures.
- macOS is the release gate for this plan. Windows and Linux branches must remain source-compatible, but no cross-platform completion claim is allowed without native-host verification.
- Do not push, publish, sign, notarize, or distribute a build without separate user authorization.
- A green unit-test run does not replace a sanitized real-WorkBuddy CDP validation.

## Audit Baseline

- TypeScript typecheck, Vite production build, and 5 Rust tests passed on 2026-08-31.
- npm production dependency audit reported no known vulnerabilities on 2026-08-31.
- `cargo fmt` and `cargo clippy` were unavailable because the stable toolchain lacked `rustfmt` and `clippy`.
- The project had no Git repository or `.gitignore`; `src-tauri/target/` occupied about 3.5 GB.
- The compiled debug binary contained the developer-machine path `/Users/tiantian/Downloads/workbuddy theme/src-tauri/skins/jingtian-starlight`.
- No real WorkBuddy process was launched or terminated during the audit.

---

### Task 1: Establish a Reproducible Baseline

**Files:**
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm check` as stable verification commands.
- Produces: a Git baseline that excludes dependencies, build outputs, browser artifacts, and local logs.

- [ ] **Step 1: Add repository exclusions before initializing Git**

Create `.gitignore` with exactly:

```gitignore
.DS_Store
*.log
.playwright-cli/
node_modules/
dist/
src-tauri/target/
coverage/
*.wbskin
```

- [ ] **Step 2: Add frontend test dependencies**

Run:

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: `package.json` and `pnpm-lock.yaml` update without changing runtime dependencies.

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add deterministic scripts**

Add these entries under `package.json > scripts`:

```json
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest",
"check": "pnpm typecheck && pnpm test && cargo test --manifest-path src-tauri/Cargo.toml && pnpm build"
```

- [ ] **Step 5: Install Rust quality components and verify the baseline**

Run:

```bash
rustup component add rustfmt clippy
cargo install cargo-audit --locked
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
pnpm check
```

Expected: `cargo audit --version` succeeds and all verification commands exit 0. If formatting currently differs, run `cargo fmt --manifest-path src-tauri/Cargo.toml`, inspect the mechanical diff, and rerun the checks.

- [ ] **Step 6: Initialize version control and create the baseline commit**

Run:

```bash
git init
git add .gitignore README.md docs index.html package.json pnpm-lock.yaml pnpm-workspace.yaml postcss.config.js scripts src src-tauri tailwind.config.js tests tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts
git status --short
git commit -m "chore: establish verified project baseline"
```

Expected: `node_modules/`, `dist/`, `src-tauri/target/`, and `.playwright-cli/` do not appear in `git status --short`.

---

### Task 2: Contain Custom-Skin Filesystem Operations

**Files:**
- Modify: `src-tauri/src/skin/manager.rs:7-36`
- Modify: `src-tauri/src/skin/manager.rs:318-378`

**Interfaces:**
- Produces: `fn validate_custom_skin_id(skin_id: &str) -> Result<(), String>`.
- Produces: `fn custom_skin_dir(skin_id: &str) -> Result<PathBuf, String>`.
- Keeps: `delete_custom_skin_from_disk(skin_id: &str) -> Result<(), String>` for the Tauri command layer.

- [ ] **Step 1: Write failing path-validation tests**

Add to a `#[cfg(test)] mod tests` in `manager.rs`:

```rust
#[test]
fn custom_skin_id_accepts_generated_ids() {
    assert!(validate_custom_skin_id("custom-deadbeef").is_ok());
}

#[test]
fn custom_skin_id_rejects_traversal_and_absolute_paths() {
    for value in ["../outside", "custom-../../outside", "/tmp/outside", ".", "builtin-default"] {
        assert!(validate_custom_skin_id(value).is_err(), "accepted {value}");
    }
}

#[test]
fn custom_skin_id_rejects_separators_and_overlong_values() {
    assert!(validate_custom_skin_id("custom-a/b").is_err());
    assert!(validate_custom_skin_id(&format!("custom-{}", "a".repeat(65))).is_err());
}
```

- [ ] **Step 2: Run the tests and confirm the missing validator fails compilation**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml skin::manager::tests
```

Expected: FAIL because `validate_custom_skin_id` does not exist.

- [ ] **Step 3: Implement strict ID and root-boundary validation**

Implement:

```rust
fn validate_custom_skin_id(skin_id: &str) -> Result<(), String> {
    let suffix = skin_id
        .strip_prefix("custom-")
        .ok_or_else(|| "只能删除自定义皮肤".to_string())?;
    if suffix.is_empty() || suffix.len() > 64 {
        return Err("自定义皮肤 ID 长度无效".into());
    }
    if !suffix
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        return Err("自定义皮肤 ID 含非法字符".into());
    }
    Ok(())
}

fn custom_skin_dir(skin_id: &str) -> Result<PathBuf, String> {
    validate_custom_skin_id(skin_id)?;
    let root = get_user_skins_dir();
    let candidate = root.join(skin_id);
    if candidate.parent() != Some(root.as_path()) {
        return Err("皮肤目录越出本地皮肤库".into());
    }
    Ok(candidate)
}
```

Change deletion to obtain its target only through `custom_skin_dir`. Do not canonicalize a nonexistent target, because deleting a missing valid skin should remain idempotent.

- [ ] **Step 4: Validate manifest IDs when listing user skins**

Before inserting a user manifest into `list_all_skins`, require `validate_custom_skin_id(&manifest.id).is_ok()` and require `path.file_name()` to equal `manifest.id`. Skip invalid entries without deleting them.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml skin::manager::tests
pnpm check
```

Expected: all tests pass, and no test writes outside a temporary test directory.

- [ ] **Step 6: Commit the filesystem boundary**

```bash
git add src-tauri/src/skin/manager.rs
git commit -m "fix: contain custom skin filesystem operations"
```

---

### Task 3: Replace Pattern-Based Process Killing With Verified PID Control

**Files:**
- Modify: `src-tauri/src/process/detector.rs`
- Modify: `src-tauri/src/process/launcher.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `pub struct WorkBuddyProcess { pub pid: u32, pub executable: PathBuf }`.
- Produces: `pub fn list_verified_workbuddy_processes() -> Vec<WorkBuddyProcess>`.
- Produces: `pub fn terminate_verified_workbuddy() -> Result<usize, String>`.
- Consumes: `find_workbuddy_install_path()`.

- [ ] **Step 1: Write failing executable-identity tests**

Extract a pure helper and test it in `detector.rs`:

```rust
#[test]
fn accepts_binary_inside_detected_macos_bundle() {
    let install = Path::new("/Applications/WorkBuddy.app");
    let exe = Path::new("/Applications/WorkBuddy.app/Contents/MacOS/Electron");
    assert!(is_workbuddy_executable(exe, install));
}

#[test]
fn rejects_similar_names_outside_bundle() {
    let install = Path::new("/Applications/WorkBuddy.app");
    assert!(!is_workbuddy_executable(
        Path::new("/tmp/FakeWorkBuddy.app/Contents/MacOS/Electron"),
        install
    ));
    assert!(!is_workbuddy_executable(Path::new("/usr/local/bin/editor_sdk"), install));
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml process::detector::tests
```

Expected: FAIL because `is_workbuddy_executable` does not exist.

- [ ] **Step 3: Implement verified process enumeration**

Canonicalize the detected installation path when possible. A process is eligible only when its executable path is equal to the Windows/Linux binary path or is a descendant of the macOS `.app` path. Remove name-substring matching from destructive decisions; it may remain display-only.

- [ ] **Step 4: Implement graceful termination**

Use `sysinfo::Process::kill_with(Signal::Term)` for verified PIDs, refresh for up to 2 seconds in 100 ms intervals, and call `Signal::Kill` only for verified PIDs that remain. Return the number of verified processes signaled. Delete both `pkill` calls and the broad Windows `taskkill /IM` call.

- [ ] **Step 5: Prevent implicit destructive restart**

Change `launch_workbuddy_with_cdp` so it returns an error when a verified WorkBuddy process is already running. Keep closing as a separate explicit user action. Change the header label from `重启并接入` to `请先安全关闭后启动`, and disable launch while `status.is_running` is true.

- [ ] **Step 6: Run tests and inspect command usage**

Run:

```bash
rg -n "pkill|taskkill|editor_sdk|-9" src-tauri/src
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck
```

Expected: `rg` returns no process-killing shell commands; all tests and typechecking pass.

- [ ] **Step 7: Commit process safety changes**

```bash
git add src-tauri/src/process src-tauri/src/commands.rs src/App.tsx src/components/Header.tsx
git commit -m "fix: terminate only verified WorkBuddy processes"
```

---

### Task 4: Introduce an Owned, Timeout-Bounded CDP Session

**Files:**
- Create: `src-tauri/src/cdp/session.rs`
- Modify: `src-tauri/src/cdp/mod.rs`
- Modify: `src-tauri/src/cdp/client.rs`
- Modify: `src-tauri/src/cdp/injector.rs`
- Modify: `src-tauri/src/process/launcher.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces: `pub struct CdpSessionState { port: u16, owned: bool, installed_target_ids: HashSet<String> }` managed through `tauri::State<Mutex<CdpSessionState>>`.
- Produces: `pub fn mark_owned(port: u16)`, `pub fn clear()`, `pub fn require_owned(port: u16) -> Result<(), String>`, and per-target install tracking.
- Changes: frontend commands no longer accept arbitrary `port`; the backend uses `WORKBUDDY_DEFAULT_PORT` and an owned-session check.

- [ ] **Step 1: Write failing session-state tests**

In `session.rs`, add:

```rust
#[test]
fn rejects_unowned_endpoint() {
    let state = CdpSessionState::default();
    assert!(state.require_owned(9333).is_err());
}

#[test]
fn tracks_loader_installation_per_target() {
    let mut state = CdpSessionState::default();
    state.mark_owned(9333);
    assert!(!state.is_loader_installed("target-a"));
    state.mark_loader_installed("target-a");
    assert!(state.is_loader_installed("target-a"));
    assert!(!state.is_loader_installed("target-b"));
}
```

- [ ] **Step 2: Run tests and verify failure**

```bash
cargo test --manifest-path src-tauri/Cargo.toml cdp::session::tests
```

Expected: FAIL because the session module is absent.

- [ ] **Step 3: Implement owned-session lifecycle**

Before launching WorkBuddy, require `/json/version` on port 9333 to be unreachable. After spawning the verified WorkBuddy executable, poll for the endpoint for up to 8 seconds; only then call `mark_owned(9333)`. If the port was already serving CDP, return `调试端口已被其他进程占用，拒绝连接` and do not inject.

Clear the session when verified WorkBuddy processes exit, when the endpoint becomes unreachable, or when the user closes WorkBuddy.

- [ ] **Step 4: Remove caller-controlled CDP ports**

Delete `port: Option<u16>` from `get_workbuddy_status`, `launch_workbuddy`, `apply_skin`, `apply_raw_css`, and `reset_skin`. Update `src/utils/ipc.ts` so public API functions do not accept or transmit `port`.

- [ ] **Step 5: Add HTTP and WebSocket status checks and timeouts**

In `get_cdp_targets`, call `error_for_status()` before JSON parsing. Wrap `connect_async` and every response wait in `tokio::time::timeout(Duration::from_secs(3), ...)`. A timeout must return an error containing the CDP method and target URL, without logging page content.

- [ ] **Step 6: Track loader installation per target**

Delete `static LOADER_INSTALLED: Mutex<bool>`. For each `CdpTarget.id`, consult `CdpSessionState.installed_target_ids`. Install `Page.addScriptToEvaluateOnNewDocument` independently for every target, and mark only that target after the command succeeds.

Restrict default injection to `target_type == "page"`; add iframe support later only if a sanitized real-host probe proves it is required.

- [ ] **Step 7: Add target and timeout tests**

Test that page targets are accepted, iframe/devtools/extension targets are rejected, target A never marks target B, and a mock WebSocket that never returns yields a timeout error within 4 seconds.

- [ ] **Step 8: Run the Rust verification suite**

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all commands exit 0; no global loader boolean remains.

- [ ] **Step 9: Commit CDP ownership changes**

```bash
git add src-tauri/src/cdp src-tauri/src/process/launcher.rs src-tauri/src/commands.rs src-tauri/src/lib.rs src/utils/ipc.ts
git commit -m "fix: bind injection to an owned CDP session"
```

---

### Task 5: Make Skin Reinjection and Reset Truthful

**Files:**
- Modify: `src-tauri/src/skin/stage.js`
- Modify: `src-tauri/src/cdp/injector.rs`
- Create: `tests/stage-runtime.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces in the WorkBuddy page: `window.__wbSkinRuntime = { payload, observer, dispose }`.
- Keeps: one current observer and one current payload per document.
- Changes: reset and apply return an error if any target fails; frontend success state changes only after confirmed success.

- [ ] **Step 1: Write a failing reinjection lifecycle test**

In `tests/stage-runtime.test.ts`, read `src-tauri/src/skin/stage.js`, evaluate it once with skin A and again with skin B, mutate the DOM, and assert:

```ts
declare global {
  interface Window {
    __WB_SKIN_PAYLOAD: Record<string, unknown>;
    __wbSkinRuntime: {
      payload: { skinId: string };
      dispose: (options: { restoreTheme: boolean }) => void;
    };
  }
}

expect(document.documentElement.dataset.wbSkin).toBe('skin-b');
expect(document.querySelectorAll('#workbuddy-custom-skin-style')).toHaveLength(1);
expect(document.querySelector('#workbuddy-custom-skin-style')).toHaveTextContent('--skin: b');
expect(window.__wbSkinRuntime.payload.skinId).toBe('skin-b');
```

Then evaluate a reset payload and assert the style, stage, portraits, observer, localStorage payload, and WorkBuddy-specific data attributes are absent.

- [ ] **Step 2: Run the test and confirm the stale-observer failure**

```bash
pnpm test -- tests/stage-runtime.test.ts
```

Expected: FAIL because the existing observer still closes over the first payload and no disposable runtime exists.

- [ ] **Step 3: Implement a disposable runtime**

At the beginning of `stage.js`, call `window.__wbSkinRuntime?.dispose({ restoreTheme: false })`. Store the new payload on the runtime object and make observer callbacks read `window.__wbSkinRuntime.payload`, not an IIFE-captured constant.

`dispose` must disconnect the scene observer and hero-title observers, remove injected shadow-root slot styles, cancel a pending animation frame, and remove only manager-owned layers and attributes. A reset calls `dispose({ restoreTheme: true })` and removes `wb-skin-payload` from localStorage.

- [ ] **Step 4: Make backend reset failures observable**

In `reset_css_on_all_targets`, collect the last error. Return `Err` when `success == 0` and also return `Err` on partial failure so the active skin ID is retained for retry. Apply the same all-target success rule to normal skin injection.

- [ ] **Step 5: Make save-and-apply state truthful**

In `handleSaveCustom`, remove the inner `try/catch` that suppresses `apiApplySkin` errors. Only call `setActiveSkinId` and show `已成功保存并应用` after apply succeeds. If save succeeds but apply fails, refresh the gallery and show `皮肤已保存，但应用失败：...` without marking it active.

- [ ] **Step 6: Run lifecycle and application tests**

```bash
pnpm test -- tests/stage-runtime.test.ts
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck
```

Expected: repeated A → B → reset sequences leave no stale observer or style, and zero/partial CDP success is never reported as complete success.

- [ ] **Step 7: Commit runtime lifecycle changes**

```bash
git add src-tauri/src/skin/stage.js src-tauri/src/cdp/injector.rs src/App.tsx tests/stage-runtime.test.ts
git commit -m "fix: make skin reinjection and reset idempotent"
```

---

### Task 6: Bundle Built-In Skin Resources Correctly

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/skin/manager.rs`
- Modify: `src-tauri/src/skin/compiler.rs`
- Create: `src-tauri/src/skin/paths.rs`

**Interfaces:**
- Produces: `pub struct SkinPaths { pub bundled_root: PathBuf, pub user_root: PathBuf }` managed by Tauri state.
- Produces: `pub fn bundled_skin_dir(&self, skin_id: &str) -> PathBuf`.
- Consumes: `AppHandle::path().resolve("skins", BaseDirectory::Resource)`.

- [ ] **Step 1: Add a failing test that rejects developer absolute paths**

Add a test that builds the built-in skin list from an injected temporary `bundled_root`, compiles `jingtian-starlight`, and asserts all required assets are read from that root. Also assert:

```rust
assert!(!compiled.css.contains(env!("CARGO_MANIFEST_DIR")));
```

- [ ] **Step 2: Run the focused test and verify failure**

```bash
cargo test --manifest-path src-tauri/Cargo.toml skin::paths::tests
```

Expected: FAIL because runtime paths currently derive from `CARGO_MANIFEST_DIR`.

- [ ] **Step 3: Configure Tauri resources**

Add this under `tauri.conf.json > bundle`:

```json
"resources": ["skins/"]
```

Tauri v2 preserves the directory tree under `$RESOURCE/skins/` when a directory is listed.

- [ ] **Step 4: Resolve resources through Tauri**

During `tauri::Builder::setup`, resolve:

```rust
use tauri::path::BaseDirectory;
use tauri::Manager;

let bundled_root = app.path().resolve("skins", BaseDirectory::Resource)?;
app.manage(SkinPaths::new(bundled_root, get_user_skins_dir()));
```

Pass `State<SkinPaths>` through commands into listing, finding, and compiling functions. Remove every runtime `env!("CARGO_MANIFEST_DIR")` fallback from production code; it may remain only in source-tree unit fixtures.

- [ ] **Step 5: Build an actual macOS app bundle**

Run:

```bash
pnpm tauri build -- --bundles app
```

Expected: an `.app` exists under `src-tauri/target/release/bundle/macos/`.

- [ ] **Step 6: Inspect the bundle and binary**

Run:

```bash
find src-tauri/target/release/bundle/macos -path '*Resources*skins*jingtian-starlight*' -type f -print
strings src-tauri/target/release/workbuddy-skin-manager | rg '/Users/|Downloads/workbuddy theme'
```

Expected: `theme.css`, `wall.webp`, `jingtian-home.webp`, and `jingtian-chat.webp` appear inside the bundle; the `strings` search returns no developer path.

- [ ] **Step 7: Commit packaging changes**

```bash
git add src-tauri/tauri.conf.json src-tauri/src/lib.rs src-tauri/src/skin
git commit -m "fix: resolve built-in skins from bundled resources"
```

---

### Task 7: Correct Customizer Semantics and Frontend State

**Files:**
- Create: `src/utils/customSkin.ts`
- Create: `src/utils/customSkin.test.ts`
- Modify: `src/components/Customizer.tsx`
- Modify: `src/components/SkinCard.tsx`
- Modify: `src/utils/ipc.ts`
- Modify: `src-tauri/src/cdp/injector.rs`

**Interfaces:**
- Produces: `buildCustomSkin(input: CustomSkinInput): { cssContent: string; config: SkinConfig; forceDark: boolean }`.
- Produces: `previewCustomSkin(input: CustomSkinInput)` using the selected `themeMode` rather than hard-coded dark mode.
- Rule: user CSS is stored exactly once in `config.custom_css`; generated base CSS is stored in `css_content` without appending user CSS.

- [ ] **Step 1: Write failing pure-function tests**

In `src/utils/customSkin.test.ts`:

```ts
it('preserves zero blur', () => {
  const result = buildCustomSkin({ ...sampleInput, blur: 0 });
  expect(result.config.blur).toBe(0);
  expect(result.cssContent).toContain('blur(0px)');
});

it('stores user css exactly once', () => {
  const result = buildCustomSkin({ ...sampleInput, customCss: '.x { color: red; }' });
  expect(result.config.custom_css).toBe('.x { color: red; }');
  expect(result.cssContent).not.toContain('.x { color: red; }');
});

it('preserves light preview mode', () => {
  const result = buildCustomSkin({ ...sampleInput, themeMode: 'light' });
  expect(result.forceDark).toBe(false);
});
```

- [ ] **Step 2: Run the tests and verify failure**

```bash
pnpm test -- src/utils/customSkin.test.ts
```

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Extract deterministic CSS generation**

Move CSS generation out of the component. Use nullish coalescing when initializing fields:

```ts
setOpacity(initialSkin.config.opacity ?? 0.9);
setBlur(initialSkin.config.blur ?? 16);
```

The generated base CSS must contain tokens and standard live selectors, while `config.custom_css` contains only the advanced editor contents.

- [ ] **Step 4: Pass theme mode through raw preview**

Change the Rust command to `apply_raw_css(css: String, theme_mode: String)` and set `force_dark` to `theme_mode == "dark"`. Validate that `theme_mode` is exactly `dark` or `light`.

Update `apiApplyRawCss(css, themeMode)` and `CustomizerProps.onApplyCustom(css, themeMode)` accordingly.

- [ ] **Step 5: Correct preview and mock metadata**

Use `config.blur ?? 4` and `config.opacity ?? 1` in `SkinCard`. Mark the browser mock `jingtian-starlight` skin as `is_builtin: true` and align its version/config with the Rust built-in definition so browser preview does not expose a false delete action.

- [ ] **Step 6: Run frontend tests and browser smoke checks**

```bash
pnpm test
pnpm typecheck
pnpm exec vite --host 127.0.0.1
```

With Playwright, open the parchment customizer and verify `Blur Filter` displays `0px`; verify the景甜 card has no delete button; verify light preview sends `themeMode: light` in the mocked API call.

- [ ] **Step 7: Commit customizer fixes**

```bash
git add src src-tauri/src/cdp/injector.rs src-tauri/src/commands.rs
git commit -m "fix: preserve custom skin settings and preview mode"
```

---

### Task 8: Align Product Claims, Security Configuration, and Release Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/SKIN_GUIDE.md`
- Create: `docs/SECURITY.md`
- Create: `docs/RELEASE_CHECKLIST.md`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `index.html`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: a release checklist separating automated verification, sanitized real-host verification, and unsupported/unimplemented features.
- Produces: a non-null Tauri CSP limited to bundled application needs.

- [ ] **Step 1: Correct unsupported feature claims**

Remove current claims that `.wbskin` import/share and wallpaper upload are available. Describe them under `Planned features` until commands, validation, size limits, archive traversal protection, and UI flows exist. Remove unused direct dependencies `zip` and `walkdir` from `Cargo.toml` if no implementation task is separately approved.

- [ ] **Step 2: Correct the skin authoring guide**

Change `--wb-bg-primary` to the implemented `--wb-bg`. Replace generic selectors such as `.chat-bubble` with selectors maintained in `kernel.css`, and add a compatibility warning that WorkBuddy DOM selectors are version-specific.

- [ ] **Step 3: Add a restrictive CSP**

Set the Tauri CSP to:

```json
"csp": "default-src 'self'; img-src 'self' data: asset:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ipc: http://ipc.localhost"
```

Run the Tauri dev build and inspect the console. Add a source only if a concrete blocked bundled feature requires it; do not add `https:`, `*`, or `'unsafe-eval'` as a shortcut.

- [ ] **Step 4: Add a favicon and remove the browser 404**

Create `public/favicon.svg` and add `<link rel="icon" href="/favicon.svg" />` to `index.html`. Open the Vite preview and confirm the console has no missing-favicon error.

- [ ] **Step 5: Document the security and release boundaries**

`docs/SECURITY.md` must state that the manager opens a local CDP endpoint, injects CSS/JavaScript only into a manager-owned WorkBuddy session, does not modify WorkBuddy files, stores custom skins locally, and must never log credentials or message content.

`docs/RELEASE_CHECKLIST.md` must contain these gates:

```markdown
- [ ] pnpm check passes
- [ ] cargo fmt -- --check passes
- [ ] cargo clippy --all-targets --all-features -- -D warnings passes
- [ ] pnpm audit --prod --registry=https://registry.npmjs.org reports no known vulnerabilities
- [ ] cargo audit passes
- [ ] macOS app bundle contains all built-in skin resources
- [ ] release binary contains no developer absolute paths
- [ ] clean launch owns port 9333; occupied port is rejected
- [ ] theme A -> theme B -> reset leaves one then zero manager styles
- [ ] reset failure is shown as failure and retains active skin state
- [ ] graceful close preserves an unsent WorkBuddy draft in the sanitized manual test
- [ ] no WorkBuddy application files, cookies, tokens, or databases changed
```

- [ ] **Step 6: Run the full automated gate**

```bash
pnpm check
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
pnpm audit --prod --registry=https://registry.npmjs.org
cargo audit
pnpm tauri build -- --bundles app
```

Expected: all commands exit 0.

- [ ] **Step 7: Perform a sanitized real-WorkBuddy acceptance test**

Use a disposable, non-sensitive conversation with no attachments or private content. Record only version, process identity, port ownership, target count/types, and pass/fail outcomes. Verify launch, apply A, switch to B, open a new window/target, reset, reconnect after restart, and graceful close. Do not record DOM text, message bodies, tokens, cookies, or authentication headers.

- [ ] **Step 8: Commit documentation and release gates**

```bash
git add README.md docs src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock index.html public/favicon.svg
git commit -m "docs: define secure release and compatibility gates"
git status --short
```

Expected: working tree clean; no push or publication performed.

---

## Completion Criteria

The hardening work is complete only when all eight task commits exist, `pnpm check`, `cargo fmt`, `cargo clippy`, npm audit, Cargo audit, and the macOS app build pass; the app bundle contains the built-in resources; the binary contains no developer path; destructive path/process tests pass; repeated theme switching leaves no stale observer; and the sanitized real-WorkBuddy acceptance checklist is signed off with the tested WorkBuddy version and date.

## Deferred Work

The following items require separate designs after this plan: `.wbskin` archive import/export, wallpaper upload and image-size controls, automatic updates/signing/notarization, Windows/Linux native-host validation, and a stable selector-compatibility matrix across WorkBuddy releases.
