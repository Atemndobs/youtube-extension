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
        // Set the URL in the input field
        if (url) {
            document.getElementById('youtubeUrl').value = url;
        }
    });
}


// Function to send the YouTube URL to the provided API endpoint
// Function to generate or retrieve a deviceId
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 9); // Generate a simple random deviceId
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Function to send the YouTube URL to the provided API endpoint with deviceId
function sendUrlToApi(url) {
    const deviceId = getDeviceId(); // Retrieve or generate the deviceId

    fetch('https://viewer.atemkeng.de/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, deviceId: deviceId })  // Sending the YouTube URL and deviceId as the body
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data);  // Logging the API response
        // Close the popup after sending the URL successfully
        window.close();
    })
    .catch(error => {
        console.error('Error:', error);
        // Close the popup even if there's an error
        window.close();
    });
}


// Event listener for the "Send Video" button
document.getElementById('playButton').addEventListener('click', function () {
    const url = document.getElementById('youtubeUrl').value;
    if (url) {
        sendUrlToApi(url);  // Send the URL to the new API endpoint
    } else {
        console.error('No URL provided.');
    }
});

// Initialize the popup when it's opened
initializePopup();
