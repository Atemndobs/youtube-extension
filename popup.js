document.addEventListener("DOMContentLoaded", () => {
  // Initialize the popup and user info
  initializePopup();
  updateUserInfo();



  // Event listeners
  document
    .getElementById("toggleModeButton")
    .addEventListener("click", toggleTheme);
  document
    .getElementById("addToWatchlistButton")
    .addEventListener("click", handleAddToWatchlist);
  document
    .getElementById("viewWatchlistButton")
    .addEventListener("click", handleViewWatchlist);
  document
    .getElementById("collectYouTubeVideosButton")
    .addEventListener("click", handleCollectYouTubeVideos);
  document
    .getElementById("sharePlaylistButton")
    .addEventListener("click", handleSharePlaylist);
});

// Event handler for adding to the watchlist
function handleAddToWatchlist() {
  const url = document.getElementById("youtubeUrl").value;
  if (url) {
    sendUrlToApi(url);
  } else {
    console.error("No URL provided.");
  }
}

// Event handler for viewing the watchlist
async function handleViewWatchlist() {
  const deviceId = await getDeviceIdPromise();
  if (!deviceId) {
    console.error("No device ID available.");
    return;
  }
  const url = document.getElementById("youtubeUrl").value;
  const isValidUrl =
    /^https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?$/.test(
      url
    );

  console.log({
    view: "VIEWING ======",
    url: url,
    deviceId: deviceId,
    isValidUrl: isValidUrl,
  });

  if (deviceId) {
    if (!isValidUrl) {
      console.error("No valid URL provided.");
    }

    // const webAppUrl = `https://viewer.atemkeng.de/?deviceId=${deviceId}`;
    webAppUrl = `http://192.168.178.67:3000/?deviceId=${deviceId}`;

    if (isValidUrl) {
      console.log("VALID URL ");
      sendUrlToApi(url);
    }

    // Set a timeout before closing the page (or doing an action)
    setTimeout(() => {
      window.open(webAppUrl, "_blank");
    }, 500); // 2000ms = 2 seconds
  } else {
    console.error("No device ID available.");
  }
}

// Function to toggle the theme
function toggleTheme() {
  const theme = document.body;
  const isDarkMode = theme.classList.toggle("dark-mode");
  theme.classList.toggle("light-mode", !isDarkMode);
  updateToggleButtonIcon(isDarkMode);
  chrome.storage.local.set({ theme: isDarkMode ? "dark" : "light" }); // Save the theme preference
}

// Function to update the toggle button icon
function updateToggleButtonIcon(isDarkMode) {
  const icon = document.getElementById("toggleModeButton").querySelector("i");
  icon.className = isDarkMode ? "fas fa-moon" : "fa-regular fa-moon";
}

// Function to initialize the popup and load the current tab's URL
function initializePopup() {
  getCurrentTabUrl((url) => {
    if (url) {
      document.getElementById("youtubeUrl").value = url;
    }
  });

  // Load user's theme preference
  chrome.storage.local.get("theme", (result) => {
    const isDarkMode = result.theme === "dark";
    document.body.classList.toggle("dark-mode", isDarkMode);
    updateToggleButtonIcon(isDarkMode);
  });
}

// Function to get the current tab's URL
function getCurrentTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      callback(tabs[0].url);
    }
  });
}

// Function to send the YouTube URL to the provided API endpoint with deviceId
async function sendUrlToApi(url) {
  try {
    const deviceId = await getDeviceIdPromise();
    if (!deviceId) {
      console.error("No device ID available.");
      return;
    }

    const response = await fetch("https://viewer.atemkeng.de/api/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, deviceId, action: "add" }),
    });

    const data = await response.json();
    console.log("API Response:", data);
    if (data.playlist) {
      displaySuccessMessage(data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Helper function to get device ID as a promise
function getDeviceIdPromise() {

  return new Promise((resolve) => {

    deviceId = 'dashing-pirate-seeker';
    chrome.storage.local.set({ deviceId }, () => resolve(deviceId));

    chrome.storage.local.get("deviceId", (result) => {
      const deviceId = result.deviceId || generateDeviceId();
      chrome.storage.local.set({ deviceId }, () => resolve(deviceId));
    });
 
  });
}

// Function to generate a new device ID
function generateDeviceId() {
  const uniqueUsername = generateRandomUsername();
  localStorage.setItem("deviceId", uniqueUsername);
  return uniqueUsername;
}

// Function to display success message
function displaySuccessMessage(data) {

  title = data.playlist[0]?.title || "Added to Watchlist"; // Fallback title
  const addButton = document.getElementById("addToWatchlistButton");
  const icon = addButton.querySelector("i");

  // Update button icon and text
  icon.classList.replace("fa-plus", "fa-check");
  addButton.innerHTML = `<i class="${icon.className}"></i> Added to Watchlist`;

  // Update the "View Watchlist" button
  const viewButton = document.getElementById("viewWatchlistButton");
  const viewIcon = viewButton.querySelector("i");
  viewIcon.className = "fa-solid fa-circle-play";
  viewButton.innerHTML = `<i class="${viewIcon.className}"></i> Watch Now!`;

  // Show the success message
  const successMessageElement = document.getElementById("successMessage");
  successMessageElement.innerHTML = title;
  successMessageElement.classList.add("visible"); // Use visibility instead of display

  // Hide the success message after 2 seconds
  setTimeout(() => {
    successMessageElement.classList.remove("visible");
    window.close(); // Close the popup after hiding the message
  }, 2000); // 2000 milliseconds = 2 seconds
}

//   // Arrays of emojis for animal icons and username generation
  const animalIcons = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐨', '🐯', '🦁', 
      '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', 
      '🦃', '🐧', '🐦', '🐤', '🐣', '🐥', '🐺', '🐗', '🐴', '🦄', 
      '🐝', '🐛', '🕷', '🦂', '🦋', '🐙', '🦑', '🦘', '🦦', '🐫'
  ];

const adjectives = [
  "cool",
  "fancy",
  "shiny",
  "brave",
  "wild",
  "mysterious",
  "cosmic",
  "fierce",
  "epic",
  "brilliant",
  "dashing",
  "stellar",
  "vivid",
  "bold",
  "noble",
];

const nouns = [
  "warrior",
  "phoenix",
  "ninja",
  "pirate",
  "tiger",
  "dragon",
  "unicorn",
  "rider",
  "wizard",
  "samurai",
  "knight",
  "guardian",
  "shadow",
  "ranger",
  "vortex",
];

const verbs = [
  "runner",
  "jumper",
  "slasher",
  "fighter",
  "seeker",
  "breaker",
  "crusher",
  "master",
  "defender",
  "blaster",
  "striker",
  "sniper",
  "rider",
  "caster",
  "charger",
];

// Function to generate unique, fancy usernames
function generateRandomUsername() {
  const randomAdjective = getRandomElement(adjectives);
  const randomNoun = getRandomElement(nouns);
  const randomVerb = getRandomElement(verbs);
  const uniqueUsername = `${randomAdjective}-${randomNoun}-${randomVerb}-${Date.now().toString(
    36
  )}`;
  localStorage.setItem("deviceId", uniqueUsername);
  return uniqueUsername;
}

// Helper function to get a random element from an array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function getUserDeviceId() {
    const deviceId = await getDeviceIdPromise();
    // Return the first three parts of the deviceId
    return deviceId.split("-").slice(0, 3).join("-");
  }
  
// Function to get user icon based on username
function getUserIcon(username) {
  const index = username.charCodeAt(0) % animalIcons.length; // Use username's first character to pick icon
  return animalIcons[index];
}

// Function to update the UI with the username and icon
async function updateUserInfo() {
  const username = await getUserDeviceId();
  document.getElementById("user").textContent = username; // Set the username
  // Get current icon index from localStorage or set to default
  const storedIconIndex = localStorage.getItem("iconIndex");
  const iconIndex = storedIconIndex ? parseInt(storedIconIndex, 10) : 0; // Default to 0 if not set
  document.getElementById("userIcon").textContent = animalIcons[iconIndex]; // Set the icon
}

// Initialize user icon click action
const userIcon = document.getElementById("userIcon");
let currentIconIndex = 0; // Initialize current icon index

// Set current icon index based on localStorage
const storedIconIndex = localStorage.getItem("iconIndex");
if (storedIconIndex) {
  currentIconIndex = parseInt(storedIconIndex, 10);
  userIcon.textContent = animalIcons[currentIconIndex]; // Set the initial icon
}

userIcon.addEventListener("click", () => {
  currentIconIndex = (currentIconIndex + 1) % animalIcons.length; // Cycle through the icons
  userIcon.textContent = animalIcons[currentIconIndex]; // Update the icon
  localStorage.setItem("iconIndex", currentIconIndex); // Save the current icon index to localStorage
  console.log("Icon changed to:", animalIcons[currentIconIndex]);
});


// Event handler for collecting YouTube videos from all open tabs
function handleCollectYouTubeVideos() {
  chrome.tabs.query({}, function (tabs) {
    const youtubeVideos = [];

    tabs.forEach(tab => {
      // Check if the URL contains "youtube.com/watch"
      if (tab.url && tab.url.includes('youtube.com/watch')) {
        youtubeVideos.push(tab.url);
      }
    });

    if (youtubeVideos.length > 0) {
      // Send all YouTube URLs to the API
      youtubeVideos.forEach((url, index) => {
        // Introduce a small delay between each request (e.g., 200ms)
        setTimeout(() => {
          sendUrlToApi(url);
        }, index * 200);
      });
    } else {
      console.log('No YouTube videos found in open tabs.');
    }
  });
}


// Function to copy the playlist URL to the clipboard
async function handleSharePlaylist() {
  try {
    const deviceId = await getDeviceIdPromise();
    if (!deviceId) {
      console.error("No device ID available.");
      return;
    }

    // Construct the playlist URL
    const webAppUrl = `https://viewer.atemkeng.de/?deviceId=${deviceId}`;

    // Copy the URL to the clipboard
    await navigator.clipboard.writeText(webAppUrl);
    console.log("Playlist URL copied to clipboard:", webAppUrl);

    // Notify the user that the link has been copied
    showCopyNotification("Playlist link copied to clipboard!");
    // displaySuccessMessage("Playlist link copied to clipboard!");
  } catch (error) {
    console.error("Failed to copy playlist URL:", error);
  }
}

// Function to display a notification when the link is copied
function showCopyNotification(message) {
  const notification = document.createElement("div");
  notification.id = "copyNotification";
  notification.textContent = message;
  notification.classList.add("notification");

  document.body.appendChild(notification);

  // Remove the notification after 2 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2000);
}