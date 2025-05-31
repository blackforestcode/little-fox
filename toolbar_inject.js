(function () {
  // If host already exists, do nothing
  if (document.getElementById("little-fox-toolbar-host")) return;

  // Create host container (fixed at top, full width, visible 40px)
  const host = document.createElement("div");
  host.id = "little-fox-toolbar-host";
  host.setAttribute(
    "style",
    `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 40px !important;
    background: #282c34 !important;
    z-index: 2147483647 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
  `
  );

  // Check if Shadow DOM is supported
  const shadow = host.attachShadow({ mode: "open" });

  // Create style element and add styles
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: #282c34;
      color: white;
      font-family: sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 2147483647;
    }
    .toolbar-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      box-sizing: border-box;
    }
    button {
      all: initial;
      cursor: pointer;
      color: white;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 4px;
      font-size: 20px;
      line-height: 1;
      padding: 4px 8px;
      margin: 0 6px;
      transition: background 0.2s ease-in-out;
    }
    button:hover {
      background: rgba(255,255,255,0.2);
    }
  `;
  shadow.appendChild(style);

  // Create toolbar container
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar-container";

  const titleDiv = document.createElement("div");
  titleDiv.textContent = "Little Fox";
  titleDiv.style.cssText = `
  flex: 1;
  text-align: center;
  font-size: 16px;
  color: white;
  user-select: none;
`;

  // Close button (×)
  const btnClose = document.createElement("button");
  btnClose.textContent = "×";
  btnClose.title = "Schließen";
  btnClose.onclick = () => window.close();

  // Maximize button (↔)
  const btnMax = document.createElement("button");
  btnMax.textContent = "\u2194"; // Unicode for "<->" symbol
  btnMax.title = "Maximieren";
  let isMax = false;
  btnMax.onclick = () => {
    // Message to background to maximize or restore the popup
    browser.runtime.sendMessage({
      action: "maximize-window",
      isCurrentlyMaximized: isMax,
    });
    // Toggle local flag for next click
    isMax = !isMax;
  };

  // Open in new Tab button (⧉)
  const btnNewTab = document.createElement("button");
  btnNewTab.textContent = "\u27A0"; // Unicode for "➡" symbol
  btnNewTab.title = "In neuem Tab öffnen";
  btnNewTab.onclick = () => {
    // Original Url without "littlefox" parameter
    const params = new URLSearchParams(window.location.search);
    params.delete("littlefox");
    const newSearch = params.toString();
    const targetUrl =
      window.location.origin +
      window.location.pathname +
      (newSearch ? "?" + newSearch : "") +
      window.location.hash;

    // Message to background with URL
    browser.runtime.sendMessage({
      action: "open-in-new-tab",
      url: targetUrl,
    });
    // Close popup
    window.close();
  };

  const btnSettings = document.createElement("button");
  btnSettings.textContent = "⚙";
  btnSettings.title = "Einstellungen";
  btnSettings.onclick = () => {
    // Message to background.js
    browser.runtime.sendMessage({ action: "open-options" });
  };

  // Group buttons
  const leftGroup = document.createElement("div");
  const rightGroup = document.createElement("div");
  leftGroup.style.display = "flex";
  rightGroup.style.display = "flex";
  leftGroup.appendChild(btnClose);
  leftGroup.appendChild(btnMax);
  leftGroup.appendChild(btnNewTab);
  rightGroup.appendChild(btnSettings);
  toolbar.appendChild(leftGroup);
  toolbar.appendChild(titleDiv);
  toolbar.appendChild(rightGroup);

  // Add toolbar to shadow DOM
  shadow.appendChild(toolbar);

  // Add host to document
  document.documentElement.prepend(host);

  // Set initial margin-top to prevent content shift
  requestAnimationFrame(() => {
    const height = host.getBoundingClientRect().height;
    document.documentElement.style.setProperty(
      "margin-top",
      `${height}px`,
      "important"
    );
  });
})();
