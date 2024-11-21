// Store the floating window ID and tab ID
let floatingWindowId = null;
let floatingTabId = null;

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Menu item for selected text
  chrome.contextMenus.create({
    id: "convertTextToSpeech",
    title: "readMe - Read this text",
    contexts: ["selection"]
  });
});

// Function to extract readable text from webpage
function extractReadableText() {
  // Get the main content
  const content = document.body.innerText;
  
  // Remove extra whitespace and normalize
  return content.replace(/\s+/g, ' ').trim();
}

// Function to chunk text
function chunkText(text, chunkSize = 1000) {
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  for (const word of words) {
    if (currentSize + word.length > chunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentSize = word.length;
    } else {
      currentChunk.push(word);
      currentSize += word.length + 1; // +1 for space
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "convertTextToSpeech" && info.selectionText) {
    // Store the selected text
    await chrome.storage.local.set({ 
      selectedText: info.selectionText,
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
            text: info.selectionText
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
