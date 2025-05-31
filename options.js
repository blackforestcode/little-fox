// Default values for popup size
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 800;

document.addEventListener("DOMContentLoaded", () => {
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");
  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusDiv = document.getElementById("status");

  // Load default values
  browser.storage.local
    .get({
      popupWidth: DEFAULT_WIDTH,
      popupHeight: DEFAULT_HEIGHT,
    })
    .then((items) => {
      widthInput.value = items.popupWidth;
      heightInput.value = items.popupHeight;
    });

  // Save new values
  saveBtn.addEventListener("click", () => {
    const w = parseInt(widthInput.value, 10);
    const h = parseInt(heightInput.value, 10);
    if (isNaN(w) || isNaN(h) || w < 200 || h < 200) {
      statusDiv.textContent = "Werte müssen ≥ 200 sein.";
      statusDiv.style.color = "red";
      return;
    }
    browser.storage.local
      .set({
        popupWidth: w,
        popupHeight: h,
      })
      .then(() => {
        statusDiv.textContent = "Gespeichert!";
        statusDiv.style.color = "green";
        setTimeout(() => (statusDiv.textContent = ""), 1500);
      });
  });

  // Reset to default values
  resetBtn.addEventListener("click", () => {
    // Set to default values
    browser.storage.local
      .set({
        popupWidth: DEFAULT_WIDTH,
        popupHeight: DEFAULT_HEIGHT,
      })
      .then(() => {
        // Update input fields
        widthInput.value = DEFAULT_WIDTH;
        heightInput.value = DEFAULT_HEIGHT;
        statusDiv.textContent = "Auf Standard zurückgesetzt!";
        statusDiv.style.color = "green";
        setTimeout(() => (statusDiv.textContent = ""), 1500);
      });
  });
});
