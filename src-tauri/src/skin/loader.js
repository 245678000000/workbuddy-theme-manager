(() => {
  try {
    const raw = localStorage.getItem("wb-skin-payload");
    if (!raw) return;
    window.__WB_SKIN_PAYLOAD = JSON.parse(raw);
  } catch (e) {}
})();
