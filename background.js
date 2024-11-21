// Store the floating window ID and tab ID
let floatingWindowId = null;
let floatingTabId = null;

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convertTextToSpeech",
    title: "readMe - Read this text",
    contexts: ["selection"]
  });
});

// Listen for window creation to store floating window ID
chrome.windows.onCreated.addListener(async (window) => {
  if (window.type === "popup" && window.url && window.url.includes("popup.html")) {
    floatingWindowId = window.id;
    // Get the tab ID from the window
    const tabs = await chrome.tabs.query({ windowId: window.id });
    if (tabs.length > 0) {
      floatingTabId = tabs[0].id;
    }
  }
});

// Listen for window removal to clear floating window ID
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === floatingWindowId) {
    floatingWindowId = null;
    floatingTabId = null;
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "convertTextToSpeech") {
    const selectedText = info.selectionText;
    
    // Store the selected text
    await chrome.storage.local.set({ 
      selectedText,
      autoConvert: true,
      timestamp: Date.now()
    });

    if (floatingWindowId) {
      try {
        // Try to focus existing window
        await chrome.windows.update(floatingWindowId, { focused: true });
        // Notify the popup to convert new text
        if (floatingTabId) {
          await chrome.tabs.sendMessage(floatingTabId, {
            action: "newTextSelected",
            text: selectedText
          });
        }
      } catch (error) {
        // If window doesn't exist anymore, create new one
        floatingWindowId = null;
        floatingTabId = null;
        createFloatingWindow();
      }
    } else {
      createFloatingWindow();
    }
  }
});

// Function to create floating window
async function createFloatingWindow() {
  const width = 400;
  const height = 600;
  
  // Get the current window to calculate the center position
  const currentWindow = await chrome.windows.getCurrent();
  const left = Math.round((currentWindow.width - width) / 2);
  const top = Math.round((currentWindow.height - height) / 2);

  const window = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: width,
    height: height,
    left: left + currentWindow.left, // Add the current window's position
    top: top + currentWindow.top
  });
  
  floatingWindowId = window.id;
  const tabs = await chrome.tabs.query({ windowId: window.id });
  if (tabs.length > 0) {
    floatingTabId = tabs[0].id;
  }
}
