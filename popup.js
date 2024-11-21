// Prefill the input field with the current tab's URL
function prefillCurrentTabUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTabUrl = tabs[0].url;
    document.getElementById("appartUrl").value = currentTabUrl;
  });
}
// Prefill the current tab URL on load
document.addEventListener("DOMContentLoaded", prefillCurrentTabUrl);

function extractDetailsFromUrl(input) {
  try {
    let platform = "unknown";
    let address = "";
    let id = "";

    // Check if input is a valid URL
    if (input.startsWith("http://") || input.startsWith("https://")) {
      const urlObj = new URL(input); // Check if valid URL
      platform = urlObj.hostname.replace("www.", ""); // Platform name from domain

      console.log({
        platform,
      });

      // Extract details based on platform
      if (platform === "homegate.ch") {
        ({ address, id } = extractHomegateDetails(urlObj));
      } else if (platform === "flatfox.ch") {
        ({ address, id } = extractFlatfoxDetails(urlObj));
      }
      // If platform is unrecognized
      else {
        document.getElementById("errorMessage").style.display = "block";
        return { error: "Platform not supported" };
      }
    } else {
      // Treat it as a manually entered address
      address = input;
    }

    // Hide error message on successful extraction
    document.getElementById("errorMessage").style.display = "none";
    console.log({
      platform,
      address,
      id,
    });
    return { platform, address, id };
  } catch (error) {
    // Handle invalid input
    document.getElementById("errorMessage").style.display = "block";
    return { error: "Invalid input" };
  }
}

// Method to extract address and ID from Homegate URL
function extractHomegateDetails(urlObj) {
  const pathSegments = urlObj.pathname.split("/").filter(Boolean);
  let address = "";
  let id = "";

  if (pathSegments.length >= 2) {
    address = pathSegments.slice(1, -1).join("/"); // Extract address if possible
    id = pathSegments[pathSegments.length - 1]; // Extract ID
  }

  return { address, id };
}

// Method to extract address and ID from Flatfox URL
function extractFlatfoxDetails(urlObj) {
  const pathSegments = urlObj.pathname.split("/").filter(Boolean);
  let address = "";
  let id = "";

  if (pathSegments.length >= 3) {
    address = pathSegments.slice(1, -1).join("/"); // Assuming structure 'flat/<address>/<id>'
    id = pathSegments[pathSegments.length - 1]; // Extract ID
  }

  return { address, id };
}

// Function to get Font Awesome icon class based on vehicle type
function getVehicleIconClass(vehicleType) {
  // Normalize the vehicle type to lowercase for consistent matching
  const normalizedType = vehicleType.toLowerCase();

  console.log(`Extracting icon class for vehicle type "${vehicleType}"`);

  // Define the mapping of specific vehicle types to Font Awesome icons
  const vehicleIcons = {
    bus: "fa-bus",
    tram: "fa-solid fa-train-tram",
    subway: "fa-solid fa-train-subway",
    bicycle: "fa-bicycle",
    walking: "fa-walking",
    // Add more mappings as needed
  };

  // Check if "train" is part of the vehicle type to apply a general train icon
  if (normalizedType.includes("train")) {
    return "fa-solid fa-train";
  }

  // Return the specific icon if found, or a default icon if the type is unknown
  return vehicleIcons[normalizedType] || "fa-question-circle";
}

// Helper function to format duration
function formatDuration(durationInMinutes) {
  if (durationInMinutes < 60) {
    return `${Math.ceil(durationInMinutes)} min`;
  } else if (durationInMinutes < 1440) {
    // Less than 24 hours
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.ceil(durationInMinutes % 60);
    return `${hours} hr ${minutes > 0 ? `${minutes} min` : ""}`;
  } else {
    // 24 hours or more
    const days = Math.floor(durationInMinutes / 1440);
    const hours = Math.floor((durationInMinutes % 1440) / 60);
    const minutes = Math.ceil(durationInMinutes % 60);
    return `${days} day${days > 1 ? "s" : ""} ${hours} hr${
      hours > 0 ? ` ${minutes} min` : ""
    }`;
  }
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
    target_address: targetAddress,
    urls: [apartmentUrl],
    include_raw_html: false,
    bypass_cache: false,
    extract_blocks: true,
    word_count_threshold: 5,
    extraction_strategy: "NoExtractionStrategy",
    extraction_strategy_args: {},
    chunking_strategy: "RegexChunking",
    chunking_strategy_args: {},
    css_selector: "",
    screenshot: false,
    user_agent: "",
    verbose: true,
  };

  // CSS styles for table without borders
  const tableStyles = `
    <style>
        .distance-table {
            width: 100%;
            border-collapse: collapse;
        }
        .distance-table td {
            padding: 8px;
            font-size: 20px;
            vertical-align: middle;
        }
        .distance-table i {
            margin-right: 5px;
        }
    </style>
`;

  // Injecting the CSS styles into the HTML document
  document.head.insertAdjacentHTML("beforeend", tableStyles);

  fetch("https://fastapi.curator.atemkeng.eu/api/v1/apartment/get_distance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => response.json())
    .then((data) => {
      if (
        data &&
        data.driving &&
        data.walking &&
        data.bicycling &&
        data.transit
      ) {
        // Ensuring distances and durations are rounded up to the next minute
        let resultsHtml = `
      <table class="distance-table">
          <tr>
              <td><i class="fa-solid fa-car"></i></td>
              <td>Driving</td>
              <td>${
                data.driving.distance ? data.driving.distance.toFixed(2) : "N/A"
              } km</td>
              <td>${
                data.driving.duration
                  ? formatDuration(data.driving.duration)
                  : "N/A"
              }</td>
          </tr>
          <tr>
              <td><i class="fa-solid fa-person-walking-arrow-right"></i></td>
              <td>Walking</td>
              <td>${
                data.walking.distance ? data.walking.distance.toFixed(2) : "N/A"
              } km</td>
              <td>${
                data.walking.duration
                  ? formatDuration(data.walking.duration)
                  : "N/A"
              }</td>
          </tr>
          <tr>
              <td><i class="fa-solid fa-person-biking"></i></td>
              <td>Bicycling</td>
              <td>${
                data.bicycling.distance
                  ? data.bicycling.distance.toFixed(2)
                  : "N/A"
              } km</td>
              <td>${
                data.bicycling.duration
                  ? formatDuration(data.bicycling.duration)
                  : "N/A"
              }</td>
          </tr>
  `;

        // Add transit details if available
        if (
          data.transit.transit_details &&
          data.transit.transit_details.length > 0
        ) {
          data.transit.transit_details.forEach((detail) => {
            const vehicleIconClass = getVehicleIconClass(detail.vehicle_type);

            resultsHtml += `
          <tr>
            <td><i class="fas ${vehicleIconClass}"></i></td>
            <td>${
              detail.vehicle_type.charAt(0).toUpperCase() +
              detail.vehicle_type.slice(1)
            } ${detail.line_nr}, ${detail.num_stops} Stops</td>
            <td>${
              data.transit.distance ? data.transit.distance.toFixed(2) : "N/A"
            } km</td>
            <td>
              ${
                data.transit.duration
                  ? formatDuration(data.transit.duration)
                  : "N/A"
              }
              <i class="fa-solid fa-circle-info info-icon"></i>
              <span class="tooltip-text" style="display: none;"> check ${detail.vehicle_type} info below.</span>
            </td>
          </tr>
        `;
          });
        }

        resultsHtml += `</table>`;
        // Add the tooltip container HTML to the results
        resultsHtml += `<div id="tooltipContainer" class="tooltip-container">Transit   information is based on current time and may vary.</div>`;
        document.getElementById("distanceResults").innerHTML = resultsHtml;

        // Get the tooltip container after it has been added to the DOM
        const tooltipContainer = document.getElementById("tooltipContainer");

        // Make sure the tooltip container exists before trying to access its style
        if (tooltipContainer) {
          tooltipContainer.style.display = "none"; // Show the tooltip immediately (if needed)
        }

        // Add event listener to toggle tooltip on icon click
        document.querySelectorAll(".info-icon").forEach((icon) => {
          icon.addEventListener("click", function () {
            // Toggle the tooltip's visibility
            if (tooltipContainer) {
              tooltipContainer.style.display =
                tooltipContainer.style.display === "none" ? "block" : "none";
            }
          });
        });

        document.getElementById("successMessage").style.display = "block";
        document.getElementById("errorMessage").style.display = "none";
        document.getElementById("getDistanceButton").style.display = "none";
      } else {
        document.getElementById("errorMessage").textContent =
          "Invalid response from server!";
        document.getElementById("errorMessage").style.display = "block";
      }
    })
    .catch((error) => {
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
    document.getElementById("errorMessage").textContent =
      "Please enter a valid URL.";
    document.getElementById("errorMessage").style.display = "block";
  }
});

// Function to set the mode based on saved preference
function loadMode() {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// Event listener for the "toggle mode" button
document.getElementById("toggleModeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  
  // Save the current mode to localStorage
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
  
  const modeIcon = document.getElementById("modeIcon");
  // Optionally, you can change the modeIcon here based on isDarkMode
});

// Load the mode when the extension opens
loadMode();


// Function to open location in Google Maps
function openInGoogleMaps(location) {
  const encodedLocation = encodeURIComponent(location);
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
    "_blank"
  );
}

// Event listener for the apartment location button
document
  .getElementById("locationButtonApartment")
  .addEventListener("click", () => {
    const apartmentUrl = document.getElementById("appartUrl").value.trim();
    if (apartmentUrl) {
      const { address } = extractDetailsFromUrl(apartmentUrl);
      openInGoogleMaps(address);
    } else {
      alert("Please enter a valid apartment URL.");
    }
  });

// Event listener for the target location button
document
  .getElementById("locationButtonTarget")
  .addEventListener("click", () => {
    const targetAddress = document.getElementById("targetAddress").value;
    openInGoogleMaps(targetAddress);
  });


// Event listener for the "Add to List" button
document.getElementById("addToList").addEventListener("click", () => {
  const apartmentUrl = document.getElementById("appartUrl").value.trim();
  if (apartmentUrl) {
    addToListWebhook(apartmentUrl);
  } else {
    document.getElementById("errorMessage").textContent =
      "Please enter a valid URL.";
    document.getElementById("errorMessage").style.display = "block";
  }
});

// Function to send the apartment URL and extracted details to the n8n webhook
function addToListWebhook(apartmentUrl) {
  const { platform, address, id } = extractDetailsFromUrl(apartmentUrl);
  const targetAddress = document.getElementById("targetAddress").value;

  // Prepare the request payload
  const requestBody = {
    appart_url: apartmentUrl,
    platform: platform,
    address: address,
    id: id,
    target_address: targetAddress,
    urls: [apartmentUrl],
    include_raw_html: false,
    bypass_cache: false,
    extract_blocks: true,
    word_count_threshold: 5,
    extraction_strategy: "NoExtractionStrategy",
    extraction_strategy_args: {},
    chunking_strategy: "RegexChunking",
    chunking_strategy_args: {},
    css_selector: "",
    screenshot: false,
    user_agent: "",
    verbose: true,
  };

  // const webhookUrl = "https://n8n.atemkeng.de/webhook/5fb74a0f-a6a9-402d-aa5f-6271e874a769";
  const webhookUrl =
    "https://fastapi.curator.atemkeng.eu/api/v1/apartment/add_to_list";

  // Send the POST request to the n8n webhook
  // Send the POST request to the n8n webhook
  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data sent to webhook:", data);
      document.getElementById("successMessage").textContent = "Added to List!";
      document.getElementById("successMessage").style.display = "block";
      document.getElementById("errorMessage").style.display = "none";
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("errorMessage").textContent =
        "Faild to add to List!";
      document.getElementById("errorMessage").style.display = "block";
      document.getElementById("successMessage").style.display = "none";
    });
}


// Load the setting when the popup is opened
chrome.storage.sync.get('showAddToListButton', (data) => {
  const showAddToListButtonCheckbox = document.getElementById('showAddToListButton');
  if (data.showAddToListButton !== undefined) {
    showAddToListButtonCheckbox.checked = data.showAddToListButton;
  }
});

// Apply the setting to show/hide the "Add to List" button
chrome.storage.sync.get('showAddToListButton', (data) => {
  const addToListButton = document.getElementById('addToList');
  if (data.showAddToListButton) {
    addToListButton.style.display = 'inline-block';
  } else {
    addToListButton.style.display = 'none';
  }
});

// // Event listener for saving settings
// document.getElementById('saveSettingsButton').addEventListener('click', () => {
//   const showAddToListButton = document.getElementById('showAddToListButton').checked;

//   // Save the setting
//   chrome.storage.sync.set({ showAddToListButton }, () => {
//     console.log('Settings saved.');
//   });
//       // Update the add to list button directly after saving
//       const addToListButton = document.getElementById('addToList');
//       addToListButton.style.display = showAddToListButton? 'inline-block' : 'none';


//   // Close the settings modal after saving
//   document.getElementById('settingsModal').style.display = 'none';
// });



// Save the default target address setting
document.getElementById("saveSettingsButton").addEventListener("click", () => {
  const defaultTargetAddress = document.getElementById(
    "defaultTargetAddress"
  ).value;
  chrome.storage.sync.set({ defaultTargetAddress }, () => {
    // Update the target address input field directly after saving
    const targetAddressInput = document.getElementById("targetAddress");
    targetAddressInput.value = defaultTargetAddress;

    // Close the settings modal
    document.getElementById("settingsModal").style.display = "none";
  });
});

// Load the default target address when the extension loads
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get("defaultTargetAddress", (data) => {
    const targetAddressInput = document.getElementById("targetAddress");
    if (data.defaultTargetAddress) {
      targetAddressInput.value = data.defaultTargetAddress;
    }
  });
});









// Retrieve and display the current default target address in the modal
document.getElementById("settings").addEventListener("click", () => {
  // Open the modal
  document.getElementById("settingsModal").style.display = "block";

  // Retrieve the current default target address from localStorage
  const currentDefaultAddress = localStorage.getItem("defaultTargetAddress") || "";

  // Set the value of the input field to the current default target address
  document.getElementById("defaultTargetAddress").value = currentDefaultAddress;
});

// Save the default target address when clicking the save button
document.getElementById("saveSettingsButton").addEventListener("click", () => {
  const newDefaultAddress = document.getElementById("defaultTargetAddress").value;

  // Save the new default target address to localStorage
  localStorage.setItem("defaultTargetAddress", newDefaultAddress);

  // Optionally update the main target address input if you want it to reflect immediately
  document.getElementById("targetAddress").value = newDefaultAddress;

  // Close the modal
  document.getElementById("settingsModal").style.display = "none";
});

// Close the modal when clicking the close button
document.getElementById("closeSettings").addEventListener("click", () => {
  document.getElementById("settingsModal").style.display = "none";
});







// document.addEventListener('DOMContentLoaded', () => {
//   const loadAddressesButton = document.getElementById('load_addresses');
//   const addressModal = document.getElementById('addressModal');
//   const closeAddressModal = document.getElementById('closeAddressModal');
//   const addressList = document.getElementById('addressList');
//   const startAddressInput = document.getElementById('appartUrl');
//   const addressError = document.getElementById('addressError');

//   // Open the modal when the load addresses button is clicked
//   loadAddressesButton.addEventListener('click', async () => {
//       // Clear any previous error message
//       addressError.textContent = "";
//       const currentUrl = startAddressInput.value;

//       if (currentUrl) {
//           const addresses = await fetchAddresses(currentUrl);
//           if (addresses.length > 0) {
//               displayAddresses(addresses);
//           } else {
//               addressError.textContent = "No addresses found.";
//           }
//           addressModal.style.display = 'block';
//       } else {
//           addressError.textContent = "Please enter a URL to load addresses.";
//           addressModal.style.display = 'block';
//       }
//   });

//   // Close the modal
//   closeAddressModal.addEventListener('click', () => {
//       addressModal.style.display = 'none';
//   });

//   // Handle clicking an address item
//   addressList.addEventListener('click', (event) => {
//       if (event.target.classList.contains('address-item')) {
//           const selectedAddress = event.target.getAttribute('data-address');
//           startAddressInput.value = selectedAddress;
//           addressModal.style.display = 'none';
//       }
//   });

//   // Close the modal if clicked outside of the content area
//   window.addEventListener('click', (event) => {
//       if (event.target === addressModal) {
//           addressModal.style.display = 'none';
//       }
//   });

//   // Function to fetch addresses from the API
//   async function fetchAddresses(currentUrl) {
//       try {
//           const response = await fetch("https://fastapi.curator.atemkeng.eu/api/v1/apartment/get_addresses", {
//               method: "POST",
//               headers: {
//                   "Content-Type": "application/json"
//               },
//               body: JSON.stringify({ urls: [currentUrl] })
//           });

//           if (!response.ok) {
//               throw new Error("Failed to fetch addresses.");
//           }

//           const data = await response.json();
//           return data.addresses || []; // Adjust based on the actual structure of API response
//       } catch (error) {
//           console.error("Error fetching addresses:", error);
//           addressError.textContent = "Could not load addresses. Please try again.";
//           return [];
//       }
//   }

//   // Function to display addresses in the modal
//   function displayAddresses(addresses) {
//       addressList.innerHTML = ""; // Clear existing list
//       addresses.forEach((address) => {
//           const listItem = document.createElement("li");
//           listItem.classList.add("address-item");
//           listItem.setAttribute("data-address", address);
//           listItem.innerHTML = `${address} <i class="fa-solid fa-map-pin"></i>`;
//           addressList.appendChild(listItem);
//       });
//   }
// });
