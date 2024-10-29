// popup.js

// Prefill the input field with the current tab's URL
function prefillCurrentTabUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabUrl = tabs[0].url;
        document.getElementById("appartUrl").value = currentTabUrl;
    });
}

// Extract platform, address, and ID from URL
function extractDetailsFromUrl(url) {
    const urlObj = new URL(url);
    const platform = urlObj.hostname.replace('www.', '');  // Platform name from domain

    // Extract address and ID from the URL path
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const address = pathSegments.slice(2, -1).join('/');  // Assuming 'flat/<address>/<id>'
    const id = pathSegments[pathSegments.length - 1];

    return { platform, address, id };
}

// Function to send the apartment URL and extracted details to the backend webhook
function sendToWebhook(apartmentUrl) {
    const { platform, address, id } = extractDetailsFromUrl(apartmentUrl);
    const targetAddress = document.getElementById("targetAddress").value; // Get the target address

    // Prepare the request payload
    const requestBody = {
        appart_url: apartmentUrl,
        platform: platform,
        address: address,
        id: id,
        target_address: targetAddress // Include the target address in the payload
    };

    // Send the request to the webhook endpoint
    fetch("https://n8n.atemkeng.de/webhook/5fb74a0f-a6a9-402d-aa5f-6271e874a769", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "webhook-sample-test": "true"
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        // Assuming the response contains walking, driving, and public transport distances
        document.getElementById("distanceResults").innerHTML = `
            <p>Walking Distance: ${data.walking_distance}</p>
            <p>Driving Distance: ${data.driving_distance}</p>
            <p>Public Transport Distance: ${data.public_transport_distance}</p> <!-- Add public transport distance -->
        `;
        document.getElementById("successMessage").style.display = "block";
        document.getElementById("errorMessage").style.display = "none";
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("errorMessage").textContent = "Network error!";
        document.getElementById("errorMessage").style.display = "block";
        document.getElementById("successMessage").style.display = "none";
    });
}

// Event listener for the "Get Distance" button
document.getElementById("getDistanceButton").addEventListener("click", () => {
    const apartmentUrl = document.getElementById("appartUrl").value.trim();
    if (apartmentUrl) {
        sendToWebhook(apartmentUrl);
    } else {
        document.getElementById("errorMessage").textContent = "Please enter a valid URL.";
        document.getElementById("errorMessage").style.display = "block";
    }
});

// Event listener for the "toggle mode" button
document.getElementById("toggleModeButton").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const modeIcon = document.getElementById("modeIcon");
    if (document.body.classList.contains("dark-mode")) {
        modeIcon.classList.remove("fa-moon");
        modeIcon.classList.add("fa-sun");
    } else {
        modeIcon.classList.remove("fa-sun");
        modeIcon.classList.add("fa-moon");
    }
});

// Prefill the current tab URL on load
document.addEventListener("DOMContentLoaded", prefillCurrentTabUrl);
