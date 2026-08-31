import fs from "fs";
import os from "os";
import path from "path";

async function run() {
  const res = await fetch("http://127.0.0.1:9333/json/list");
  const targets = await res.json();

  const skinAssets = path.join(os.homedir(), ".workbuddy-skins/jingtian-starlight/assets");
  const b64Home = fs.readFileSync(path.join(skinAssets, "jingtian-home.webp")).toString("base64");
  const b64Chat = fs.readFileSync(path.join(skinAssets, "jingtian-chat.webp")).toString("base64");
  const b64Wall = fs.readFileSync("/Users/tiantian/Downloads/景甜/assets/wall.webp").toString("base64");

  const urlHome = "data:image/webp;base64," + b64Home;
  const urlChat = "data:image/webp;base64," + b64Chat;
  const urlWall = "data:image/webp;base64," + b64Wall;

  const css = `
    #wb-jingtian-bg-layer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
      background: 
        linear-gradient(135deg, rgba(21, 19, 54, 0.85) 0%, rgba(35, 32, 75, 0.8) 100%),
        url('${urlWall}') center / cover no-repeat;
      overflow: hidden;
    }

    #wb-jingtian-bg-layer::after {
      content: "";
      position: absolute;
      right: clamp(10px, 2.5vw, 50px);
      bottom: 0;
      width: clamp(320px, 32vw, 520px);
      height: clamp(420px, 75vh, 820px);
      background: url('${urlHome}') right bottom / contain no-repeat;
      filter: drop-shadow(-8px 10px 24px rgba(112, 70, 232, 0.4));
      opacity: 0.95;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    html[data-wb-scene="chat"] #wb-jingtian-bg-layer::after {
      background-image: url('${urlChat}') !important;
      filter: drop-shadow(-10px 12px 28px rgba(225, 108, 202, 0.45)) !important;
    }

    #root, .main-layout-wrapper-pc {
      position: relative !important;
      z-index: 1 !important;
      background: transparent !important;
    }

    .main-layout-wrapper-pc > div,
    [class*="content-wrapper"],
    .simplebar-content {
      background-color: transparent !important;
    }
  `;

  // 保存到 theme.css
  const skinDir = path.join(os.homedir(), ".workbuddy-skins/jingtian-starlight");
  fs.writeFileSync(path.join(skinDir, "theme.css"), css, "utf-8");

  const jsPayload = `
    (() => {
      // 1. 清理已有
      const oldStyle = document.getElementById("workbuddy-custom-skin-style");
      if (oldStyle) oldStyle.remove();

      let bg = document.getElementById("wb-jingtian-bg-layer");
      if (!bg) {
        bg = document.createElement("div");
        bg.id = "wb-jingtian-bg-layer";
        document.body.prepend(bg);
      }

      // 2. 挂载纯净 CSS
      const style = document.createElement("style");
      style.id = "workbuddy-custom-skin-style";
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);

      // 3. 路由与场景检测
      function update() {
        const isChat = location.href.includes("session") || location.href.includes("chat") || document.querySelectorAll("[class*='bubble'], [class*='message']").length > 1;
        document.documentElement.setAttribute("data-wb-scene", isChat ? "chat" : "home");
      }
      update();

      if (!window.__wbObserver) {
        window.__wbObserver = new MutationObserver(update);
        window.__wbObserver.observe(document.body, { childList: true, subtree: true });
        window.addEventListener("popstate", update);
      }

      return "CLEAN_SUCCESS";
    })()
  `;

  for (const t of targets) {
    if (t.type === "iframe" && t.webSocketDebuggerUrl) {
      const ws = new WebSocket(t.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          method: "Runtime.evaluate",
          params: { expression: jsPayload, returnByValue: true }
        }));
      };
      ws.onmessage = (e) => {
        console.log("纯净专属注入成功:", e.data);
        ws.close();
      };
    }
  }
}

run();
