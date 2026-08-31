(() => {
  const STYLE_ID = "workbuddy-custom-skin-style";
  const STAGE_ID = "wb-skin-stage";
  const PORTRAIT_ID = "wb-skin-portraits";
  const SNAP_KEY = "__wbThemeSnapshot";
  const incoming = window.__WB_SKIN_PAYLOAD;
  if (!incoming) return;

  const html = document.documentElement;

  function currentPayload() {
    return window.__wbSkinRuntime && window.__wbSkinRuntime.payload;
  }

  function swapDark(cls) {
    return String(cls || "")
      .replace(/\bvscode-light\b/g, "vscode-dark")
      .replace(/\bcb-light\b/g, "cb-dark")
      .replace(/\blight\b/g, "dark");
  }

  function swapLight(cls) {
    return String(cls || "")
      .replace(/\bvscode-dark\b/g, "vscode-light")
      .replace(/\bcb-dark\b/g, "cb-light")
      .replace(/\bdark\b/g, "light");
  }

  function snapshotTheme() {
    if (window[SNAP_KEY]) return;
    window[SNAP_KEY] = {
      htmlClass: html.className,
      htmlTheme: html.getAttribute("data-theme"),
      htmlStyle: html.getAttribute("style"),
      bodyClass: document.body ? document.body.className : "",
    };
  }

  function restoreThemeSnapshot() {
    const snap = window[SNAP_KEY];
    if (!snap) return;
    html.className = snap.htmlClass || "";
    if (snap.htmlTheme) html.setAttribute("data-theme", snap.htmlTheme);
    else html.removeAttribute("data-theme");
    if (snap.htmlStyle) html.setAttribute("style", snap.htmlStyle);
    else html.removeAttribute("style");
    if (document.body) document.body.className = snap.bodyClass || "";
    window[SNAP_KEY] = null;
  }

  function nativeIsLight() {
    const cls = `${html.className} ${document.body ? document.body.className : ""}`;
    const theme = html.getAttribute("data-theme") || "";
    if (/\b(cb-dark|vscode-dark)\b/.test(cls) || theme === "dark") return false;
    if (/\b(cb-light|vscode-light)\b/.test(cls) || theme === "light") return true;
    return matchMedia && matchMedia("(prefers-color-scheme: light)").matches;
  }

  function syncNativeTheme() {
    html.setAttribute("data-wb-native-theme", nativeIsLight() ? "light" : "dark");
  }

  function applyThemeClass() {
    const payload = currentPayload();
    if (!payload) return;
    if (payload.skinId === "jingtian-starlight") {
      syncNativeTheme();
      html.style.colorScheme = nativeIsLight() ? "light" : "dark";
      return;
    }
    if (!payload.forceDark) {
      if (window[SNAP_KEY]) restoreThemeSnapshot();
      syncNativeTheme();
      html.style.colorScheme = nativeIsLight() ? "light" : "dark";
      return;
    }
    const alreadyDark =
      /\bvscode-dark\b/.test(html.className) && html.getAttribute("data-theme") === "dark";
    if (alreadyDark) {
      html.setAttribute("data-wb-native-theme", "dark");
      return;
    }
    snapshotTheme();
    html.className = swapDark(html.className);
    html.setAttribute("data-theme", "dark");
    html.style.colorScheme = "dark";
    if (document.body) document.body.className = swapDark(document.body.className);
    html.setAttribute("data-wb-native-theme", "dark");
  }

  function ensureStyle() {
    const payload = currentPayload();
    if (!payload) return;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || html).appendChild(el);
    }
    el.textContent = payload.css || "";
  }

  function mountLayer(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      const mount = document.body || html;
      mount.appendChild(el);
    }
    el.innerHTML = "";
    return el;
  }

  function ensureStage() {
    const payload = currentPayload();
    if (!payload) return;
    const cfg = payload.stage;
    const existingStage = document.getElementById(STAGE_ID);
    const existingPortraits = document.getElementById(PORTRAIT_ID);
    if (!cfg || (!cfg.wallpaper && !cfg.portraitHome && !cfg.portraitChat)) {
      if (existingStage) existingStage.remove();
      if (existingPortraits) existingPortraits.remove();
      html.removeAttribute("data-wb-stage");
      return;
    }
    html.setAttribute("data-wb-stage", "1");

    if (cfg.wallpaper) {
      const stage = mountLayer(STAGE_ID);
      const wall = document.createElement("img");
      wall.className = "wb-wall";
      wall.alt = "";
      wall.src = cfg.wallpaper;
      stage.appendChild(wall);
    } else if (existingStage) {
      existingStage.remove();
    }

    if (cfg.portraitHome || cfg.portraitChat) {
      const layer = mountLayer(PORTRAIT_ID);
      if (cfg.portraitHome) {
        const img = document.createElement("img");
        img.className = "wb-portrait wb-portrait-home";
        img.alt = "";
        img.src = cfg.portraitHome;
        layer.appendChild(img);
      }
      if (cfg.portraitChat) {
        const img = document.createElement("img");
        img.className = "wb-portrait wb-portrait-chat";
        img.alt = "";
        img.src = cfg.portraitChat;
        layer.appendChild(img);
      }
    } else if (existingPortraits) {
      existingPortraits.remove();
    }
  }

  function restyleOfficialSlots() {
    const payload = currentPayload();
    if (!payload || payload.skinId !== "jingtian-starlight") return;
    const dark = !nativeIsLight();
    const css = dark
      ? `
      :host {
        --fuel-bg: transparent !important;
        --fuel-text: rgba(244, 241, 255, 0.92);
        --fuel-subtle: rgba(198, 192, 228, 0.72);
        --fuel-card-border: transparent !important;
        --fuel-card-shadow: none !important;
        --fuel-close-color: rgba(244, 241, 255, 0.42);
        --fuel-primary-disabled-bg: rgba(196, 178, 255, 0.16);
        --fuel-primary-disabled-text: #c6c0e4;
      }
      .fuel-station,
      .fuel-card,
      .fuel-compact {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
    `
      : `
      :host {
        --fuel-bg: transparent !important;
        --fuel-card-border: transparent !important;
        --fuel-card-shadow: none !important;
        --fuel-close-color: rgba(43, 36, 88, 0.35);
        --fuel-primary-disabled-bg: rgba(112, 70, 232, 0.12);
        --fuel-primary-disabled-text: #6E6694;
      }
      .fuel-station,
      .fuel-card,
      .fuel-compact {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
    `;
    document.querySelectorAll(".wb-slot, .wb-slot--avatar-top, .daily-checkin").forEach((host) => {
      const root = host.shadowRoot;
      if (!root) return;
      let el = root.getElementById("wb-jingtian-slot");
      if (!el) {
        el = document.createElement("style");
        el.id = "wb-jingtian-slot";
        root.appendChild(el);
      }
      if (el.textContent !== css) el.textContent = css;
    });
  }

  const HERO_TITLE = "好的，妈妈知道了";
  const HERO_KEY = "__wbHeroTitleObserver";

  function applyHeroTitle() {
    const payload = currentPayload();
    if (!payload || payload.skinId !== "jingtian-starlight") return;
    const el = document.querySelector(".wb-home-header__title");
    if (!el) return;
    const current = (el.textContent || "").trim();
    if (!el.dataset.wbOrigTitle && current && current !== HERO_TITLE) {
      el.dataset.wbOrigTitle = current;
    }
    if (current !== HERO_TITLE) el.textContent = HERO_TITLE;
    if (!el[HERO_KEY]) {
      el[HERO_KEY] = new MutationObserver(applyHeroTitle);
      el[HERO_KEY].observe(el, { characterData: true, childList: true, subtree: true });
    }
  }

  function restoreHeroTitle() {
    document.querySelectorAll(".wb-home-header__title[data-wb-orig-title]").forEach((el) => {
      if (el[HERO_KEY]) {
        el[HERO_KEY].disconnect();
        el[HERO_KEY] = null;
      }
      el.textContent = el.dataset.wbOrigTitle;
      delete el.dataset.wbOrigTitle;
    });
  }

  function isShown(el) {
    if (!el) return false;
    if (el.closest(".route-keep-alive-slot--hidden")) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  function anyShown(sel) {
    return [...document.querySelectorAll(sel)].some(isShown);
  }

  function detectScene() {
    const isHome = anyShown(
      ".wb-home-page, .wb-home-page-pc, .main-content--welcome, .chat-container--welcome"
    );
    const isChat = anyShown(
      ".conversation-page-chrome, .conversation-shell, .cr-message-list, .main-content--chat, [class*=\"userMessageBubble\"], [class*=\"assistantMessage\"]"
    );
    html.setAttribute("data-wb-scene", !isHome && isChat ? "chat" : "home");
    applyHeroTitle();
  }

  function removeSlotStyles() {
    document.querySelectorAll(".wb-slot, .wb-slot--avatar-top, .daily-checkin").forEach((host) => {
      const root = host.shadowRoot;
      if (!root) return;
      const el = root.getElementById("wb-jingtian-slot");
      if (el) el.remove();
    });
  }

  function removeOwnedLayers() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    const stage = document.getElementById(STAGE_ID);
    if (stage) stage.remove();
    const portraits = document.getElementById(PORTRAIT_ID);
    if (portraits) portraits.remove();
    html.removeAttribute("data-wb-skin");
    html.removeAttribute("data-wb-scene");
    html.removeAttribute("data-wb-stage");
    html.removeAttribute("data-wb-native-theme");
  }

  function dispose(options) {
    const restoreTheme = !!(options && options.restoreTheme);
    const runtime = window.__wbSkinRuntime;
    if (runtime && runtime.frame) {
      cancelAnimationFrame(runtime.frame);
      runtime.frame = 0;
    }
    if (runtime && runtime.observer) {
      runtime.observer.disconnect();
      runtime.observer = null;
    }
    if (window.__wbSceneObserver) {
      window.__wbSceneObserver.disconnect();
      window.__wbSceneObserver = null;
    }
    restoreHeroTitle();
    removeSlotStyles();
    removeOwnedLayers();
    if (restoreTheme) {
      restoreThemeSnapshot();
      try {
        localStorage.removeItem("wb-skin-payload");
      } catch (e) {}
    }
    window.__wbSkinRuntime = null;
  }

  function watch() {
    const runtime = window.__wbSkinRuntime;
    if (!runtime || runtime.observer) return;
    runtime.frame = 0;
    runtime.observer = new MutationObserver(() => {
      const active = window.__wbSkinRuntime;
      if (!active) return;
      if (active.frame) cancelAnimationFrame(active.frame);
      active.frame = requestAnimationFrame(() => {
        active.frame = 0;
        const payload = currentPayload();
        if (!payload) return;
        detectScene();
        restyleOfficialSlots();
        if (payload.skinId === "jingtian-starlight") applyThemeClass();
        else if (payload.forceDark) applyThemeClass();
        else syncNativeTheme();
        if (
          payload.stage &&
          document.body &&
          ((payload.stage.wallpaper && !document.getElementById(STAGE_ID)) ||
            ((payload.stage.portraitHome || payload.stage.portraitChat) &&
              !document.getElementById(PORTRAIT_ID)))
        ) {
          ensureStage();
        }
        if (!document.getElementById(STYLE_ID)) ensureStyle();
      });
    });
    runtime.observer.observe(html, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
  }

  function boot() {
    const payload = currentPayload();
    if (!payload) return;
    html.setAttribute("data-wb-skin", payload.skinId || "custom");
    applyThemeClass();
    ensureStyle();
    ensureStage();
    detectScene();
    restyleOfficialSlots();
    watch();
  }

  if (incoming.reset) {
    if (window.__wbSkinRuntime && typeof window.__wbSkinRuntime.dispose === "function") {
      window.__wbSkinRuntime.dispose({ restoreTheme: true });
    } else {
      dispose({ restoreTheme: true });
    }
    return "reset";
  }

  if (window.__wbSkinRuntime && typeof window.__wbSkinRuntime.dispose === "function") {
    window.__wbSkinRuntime.dispose({ restoreTheme: false });
  }

  window.__wbSkinRuntime = {
    payload: incoming,
    observer: null,
    frame: 0,
    dispose,
  };

  try {
    localStorage.setItem("wb-skin-payload", JSON.stringify(incoming));
  } catch (e) {}

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
  return "applied:" + (incoming.skinId || "custom");
})();
