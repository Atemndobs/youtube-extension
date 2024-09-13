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
            // Open the watchlist if a device ID is available
            if (deviceId) {
                const webAppUrl = `https://viewer.atemkeng.de/?deviceId=${deviceId}`;
                window.open(webAppUrl, '_blank');
            }
            // Close the popup after sending the URL successfully
            window.close();
        })
        .catch(error => {
            console.error('Error:', error);
            // Close the popup even if there's an error
            window.close();
        });
    });
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

// Initialize the popup when it's opened
initializePopup();
