const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 800;

// Set for Popup-Tab-IDs
const trackedPopupTabs = new Set();
const trackedPopupWindows = new Set();

// Get the saved popup size from storage, or return default values
function getPopupSize() {
  return browser.storage.local
    .get({
      popupWidth: DEFAULT_WIDTH,
      popupHeight: DEFAULT_HEIGHT,
    })
    .then((items) => ({
      width: items.popupWidth,
      height: items.popupHeight,
    }));
}

// Open a centered popup with a specific URL and a flag
function openCenteredPopupWithFlag(targetUrl) {
  browser.windows.getCurrent({ windowTypes: ["normal"] }).then((win) => {
    // Read the popup size from storage
    getPopupSize().then(({ width, height }) => {
      const left = win.left + Math.floor((win.width - width) / 2);
      const top = win.top + Math.floor((win.height - height) / 2);

      const sep = targetUrl.includes("?") ? "&" : "?";
      const urlWithParam = targetUrl + sep + "littlefox=1";

      browser.windows
        .create({
          url: urlWithParam,
          type: "popup",
          width: width,
          height: height,
          left: left,
          top: top,
        })
        .then((newWindow) => {
          // Remember the new popup window ID
          const winId = newWindow.id;

          if (typeof winId === "number") {
            trackedPopupWindows.add(winId);
          }

          // Remember the first tab ID of the new popup window
          if (newWindow.tabs && newWindow.tabs.length > 0) {
            const tabId = newWindow.tabs[0].id;
            trackedPopupTabs.add(tabId);
          }
        })
        .catch((err) => {
          console.error("Error while creating the popup window:", err);
        });
    });
  });
}

// 1) Create context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "open-in-little-fox",
    title: "In Little Fox öffnen",
    contexts: ["link"],
  });
});

// Click on context menu item
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-in-little-fox" && info.linkUrl) {
    openCenteredPopupWithFlag(info.linkUrl);
  }
});

// Message listener for content scripts
browser.runtime.onMessage.addListener((msg, sender) => {
  const senderTab = sender.tab;
  const winId = senderTab ? senderTab.windowId : null;

  if (msg.action === "open-popup" && msg.url) {
    openCenteredPopupWithFlag(msg.url);
    return;
  }

  if (msg.action === "maximize-window" && winId !== null) {
    const wasMax = msg.isCurrentlyMaximized === true;
    if (!wasMax) {
      browser.windows.update(winId, {
        left: 0,
        top: 0,
        width: screen.availWidth,
        height: screen.availHeight,
      });
    } else {
      // Restore the window to its previous size
      getPopupSize().then(({ width, height }) => {
        const L = Math.floor((screen.availWidth - width) / 2);
        const T = Math.floor((screen.availHeight - height) / 2);
        browser.windows.update(winId, {
          left: L,
          top: T,
          width: width,
          height: height,
        });
      });
    }
    return;
  }

  if (msg.action === "open-in-new-tab" && msg.url) {
    browser.tabs.create({ url: msg.url });
    return;
  }

  if (msg.action === "open-options") {
    // Open the options page (options_ui in manifest.json)
    browser.runtime.openOptionsPage().catch((err) => {
      console.error("Error opening options page:", err);
    });
  }
});

// Tab update: Inject toolbar when popup is loaded
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!trackedPopupTabs.has(tabId)) return;
  if (changeInfo.status === "complete") {
    browser.tabs
      .executeScript(tabId, { file: "toolbar_inject.js" })
      .catch(() => {});
    browser.tabs
      .insertCSS(tabId, {
        code: `
        #little-fox-toolbar-host { display: block !important; }
        html { margin-top: 40px !important; }
      `,
      })
      .catch(() => {});
  }
});

// Tab removal: Remove from trackedPopupTabs
browser.tabs.onRemoved.addListener((tabId) => {
  if (trackedPopupTabs.has(tabId)) {
    trackedPopupTabs.delete(tabId);
  }
});

// Window removal: Remove from trackedPopupWindows and clean up tabs
browser.windows.onRemoved.addListener((windowId) => {
  if (trackedPopupWindows.has(windowId)) {
    trackedPopupWindows.delete(windowId);
    // If the user closed the popup manually, we should also remove
    // all associated tab IDs (if not already done).
    for (const tabId of Array.from(trackedPopupTabs)) {
      // Check if this tabId still exists (otherwise delete)
      browser.tabs.get(tabId).catch(() => {
        trackedPopupTabs.delete(tabId);
      });
    }
  }
});

// If the user focuses on another window, close all popups
browser.windows.onFocusChanged.addListener((focusedWindowId) => {
  // Focus on a window that does not exist anymore
  if (focusedWindowId === browser.windows.WINDOW_ID_NONE) {
    for (const winId of Array.from(trackedPopupWindows)) {
      browser.windows.remove(winId).catch(() => {});
      trackedPopupWindows.delete(winId);
    }
    trackedPopupTabs.clear();
    return;
  }

  // Focus on another window (not in trackedPopupWindows)
  if (!trackedPopupWindows.has(focusedWindowId)) {
    // Close all popup windows, as the user has focused on another window
    for (const winId of Array.from(trackedPopupWindows)) {
      browser.windows.remove(winId).catch(() => {});
      trackedPopupWindows.delete(winId);
    }
    // And clear all popup tab IDs
    trackedPopupTabs.clear();
  }
  // If focusedWindowId is in trackedPopupWindows, nothing happens – popup remains open
});
