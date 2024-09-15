// Function to get the current tab's URL
function getCurrentTabUrl(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const tab = tabs[0];
            callback(tab.url);
        }
    });
}

// Function to initialize the popup
function initializePopup() {
    getCurrentTabUrl((url) => {
        if (url) {
            document.getElementById('youtubeUrl').value = url;
        }
    });

    // Load the user's theme preference
    chrome.storage.local.get('theme', (result) => {
        const isDarkMode = result.theme === 'dark';
        document.body.classList.toggle('dark-mode', isDarkMode);
        updateToggleButtonIcon(isDarkMode);
    });
}

// Function to get the deviceId (either from local storage or server)
function getDeviceId(callback) {
    chrome.storage.local.get('deviceId', (result) => {
        let deviceId = result.deviceId;
        if (!deviceId) {
            console.log('Device ID not found in local storage. Generating a new one...');
            // Generate a new deviceId if none exists
            deviceId = generateDeviceId();
            chrome.storage.local.set({ 'deviceId': deviceId }, () => {
                console.log('New device ID saved:', deviceId);
                callback(deviceId);
            });
        } else {
            console.log('Device ID retrieved from local storage:', deviceId);
            callback(deviceId);
        }
    });
}

// Function to generate a new deviceId
function generateDeviceId() {
    const deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    return deviceId;
}

// Function to send the YouTube URL to the provided API endpoint with deviceId
function sendUrlToApi(url) {
    getDeviceId(deviceId => {
        if (!deviceId) {
            console.error('No device ID available.');
            return;
        }

        fetch('https://viewer.atemkeng.de/api/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, deviceId: deviceId, action: 'add' })  // Sending the YouTube URL and deviceId as the body
        })
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data);  // Logging the API response
            // Show a success message if the URL was added successfully
            if (data.success) {
                const message = document.getElementById('successMessage');
                const addButton = document.getElementById('addToWatchlistButton');
                const icon = addButton.querySelector('i');

                // Change button icon and text
                icon.classList.remove('anticon-plus');
                icon.classList.add('anticon-check');
                addButton.textContent = 'Added to Watchlist';
                
                // Show success message
                message.classList.remove('hidden');
                setTimeout(() => {
                    message.classList.add('hidden');
                }, 2000);
            }
            window.close();
        })
        .catch(error => {
            console.error('Error:', error);
            // Close the popup even if there's an error
            window.close();
        });
    });
}

// Function to update the toggle button icon
function updateToggleButtonIcon(isDarkMode) {
    const toggleButton = document.getElementById('toggleModeButton');
    const icon = toggleButton.querySelector('i');
    if (isDarkMode) {
        icon.classList.remove('anticon-sun');
        icon.classList.add('anticon-moon');
    } else {
        icon.classList.remove('anticon-moon');
        icon.classList.add('anticon-sun');
    }
}

// Event listener for the "Add to Watchlist" button
document.getElementById('addToWatchlistButton').addEventListener('click', function () {
    const url = document.getElementById('youtubeUrl').value;
    if (url) {
        sendUrlToApi(url);  // Send the URL to the new API endpoint
    } else {
        console.error('No URL provided.');
    }
});

// Event listener for the "View Watchlist" button
document.getElementById('viewWatchlistButton').addEventListener('click', function () {
    chrome.storage.local.get('deviceId', (result) => {
        const deviceId = result.deviceId;
        if (deviceId) {
            const url = document.getElementById('youtubeUrl').value;
            // check if url is a valid youtube url
            const youtubeRegex = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?$/;
            if (!youtubeRegex.test(url)) {
                console.error('No URL provided.');
                const webAppUrl = `https://viewer.atemkeng.de/?deviceId=${deviceId}`;
                window.open(webAppUrl, '_blank');
            } else {
                sendUrlToApi(url);  // Send the URL to the new API endpoint
                const webAppUrl = `https://viewer.atemkeng.de/?deviceId=${deviceId}`;
                window.open(webAppUrl, '_blank');
            }
        } else {
            console.error('No device ID available.');
        }
    });
});

// Event listener for the theme toggle button
document.getElementById('toggleModeButton').addEventListener('click', () => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const newMode = isDarkMode ? 'light' : 'dark';
    document.body.classList.toggle('dark-mode', !isDarkMode);
    updateToggleButtonIcon(!isDarkMode);
    chrome.storage.local.set({ 'theme': newMode });
});

// Initialize the popup
initializePopup();
