// Send a message to the background script to open a popup
document.addEventListener("click", (e) => {
  const el = e.target.closest("a");
  if (!el || !el.href) return;
  if (e.shiftKey && e.button === 0) {
    e.preventDefault();
    browser.runtime.sendMessage({
      action: "open-popup",
      url: el.href,
    });
  }
});
