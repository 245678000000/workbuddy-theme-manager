import fs from "fs";
import os from "os";
import path from "path";

async function run() {
  const res = await fetch("http://127.0.0.1:9333/json/list");
  const targets = await res.json();
  const skinDir = path.join(os.homedir(), ".workbuddy-skins/jingtian-starlight");
  const css = fs.readFileSync(path.join(skinDir, "theme.css"), "utf-8");

  const code = `
    (() => {
      const STYLE_ID = 'workbuddy-custom-skin-style';
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(style);
      }
      style.textContent = ${JSON.stringify(css)};

      function updateScene() {
        const url = window.location.href;
        const hasChat = Boolean(
          document.querySelector('.chat-container, .message-list, [class*="chat"], [class*="session"], [class*="conversation"], [class*="message"]')
        );
        const bubbles = document.querySelectorAll('[class*="bubble"], [class*="message"], [class*="chat"]');
        const isChat = url.includes('session') || url.includes('chat') || (hasChat && bubbles.length > 2);

        if (isChat) {
          document.documentElement.setAttribute('data-wb-scene', 'chat');
        } else {
          document.documentElement.setAttribute('data-wb-scene', 'home');
        }
      }

      updateScene();

      if (!window.__wbSceneObserver) {
        window.__wbSceneObserver = new MutationObserver(() => updateScene());
        window.__wbSceneObserver.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true
        });
        window.addEventListener('popstate', updateScene);
        window.addEventListener('hashchange', updateScene);
      }

      return 'SUCCESS_DUAL_SCENE';
    })()
  `;

  for (const t of targets) {
    if (t.webSocketDebuggerUrl) {
      const ws = new WebSocket(t.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          method: "Runtime.evaluate",
          params: {
            expression: code,
            returnByValue: true
          }
        }));
      };
      ws.onmessage = (e) => {
        console.log("注入成功 Target [" + t.type + "]:", e.data);
        ws.close();
      };
    }
  }
}

run();
