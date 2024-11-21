// Check if dark mode was previously enabled
const darkMode = localStorage.getItem("darkMode") === "enabled";

// Apply dark mode if previously enabled
if (darkMode) {
  document.body.classList.add("dark-mode");
}

const convertButton = document.getElementById("convertButton");
const textInput = document.getElementById("textInput");
const closeButton = document.getElementById("closeButton");
const voiceSelect = document.getElementById("voiceSelect"); // Dropdown for voice selection

// Function to check if the input is empty and toggle the button state
function toggleConvertButton() {
  if (textInput.value.trim() === "") {
    convertButton.disabled = true;
  } else {
    convertButton.disabled = false;
  }
}

// Initially check the input value to set the button state
toggleConvertButton();

// Listen for input changes to update the button state
textInput.addEventListener("input", toggleConvertButton);

// Keep track of currently playing audio
let currentlyPlayingAudio = null;

// Function to stop all audio except the one provided
function stopOtherAudio(exceptAudio) {
  // Get all audio elements
  const audioElements = document.querySelectorAll('audio');
  
  // Stop all audio except the one provided
  audioElements.forEach(audio => {
    if (audio !== exceptAudio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

// Function to create an audio entry
async function createAudioEntry(text, audioUrl, timestamp = Date.now(), voiceModel = voiceSelect.value, modelName = modelSelect.value, autoPlay = true) {
  const audioDiv = document.getElementById("audioContainer");
  
  // Create container for the audio entry
  const audioContainer = document.createElement("div");
  audioContainer.classList.add("audio-item");
  
  // Create text preview
  const textPreview = document.createElement("div");
  textPreview.classList.add("text-preview");
  textPreview.textContent = text.slice(0, 50) + (text.length > 50 ? "..." : "");
  
  // Create timestamp
  const timeDisplay = document.createElement("div");
  timeDisplay.classList.add("timestamp");
  timeDisplay.textContent = new Date(timestamp).toLocaleTimeString();
  
  // Create audio element with combined restore functionality
  const audioElement = document.createElement("audio");
  audioElement.controls = true;
  audioElement.src = audioUrl;
  
  // Store the text and settings with the audio element
  audioElement.dataset.text = text;
  audioElement.dataset.voice = voiceModel;
  audioElement.dataset.model = modelName;
  
  // Add play event listener to restore text and settings
  audioElement.addEventListener("play", () => {
    // Stop other audio before playing this one
    stopOtherAudio(audioElement);
    currentlyPlayingAudio = audioElement;
    
    // Restore text
    textInput.value = text;
    toggleConvertButton();
    
    // Restore voice and model settings
    if (modelSelect.value !== modelName) {
      modelSelect.value = modelName;
      // Trigger the change event to update voices
      modelSelect.dispatchEvent(new Event("change"));
    }
    
    // Set the voice after voices are populated
    setTimeout(() => {
      if (voiceSelect.value !== voiceModel) {
        voiceSelect.value = voiceModel;
      }
    }, 100);
  });
  
  // Add ended event listener to clear currently playing audio
  audioElement.addEventListener("ended", () => {
    if (currentlyPlayingAudio === audioElement) {
      currentlyPlayingAudio = null;
    }
  });
  
  // Add pause event listener to clear currently playing audio
  audioElement.addEventListener("pause", () => {
    if (currentlyPlayingAudio === audioElement) {
      currentlyPlayingAudio = null;
    }
  });
  
  // Create delete button
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
  deleteButton.classList.add("delete-button");
  deleteButton.addEventListener("click", () => {
    // If this audio is playing, stop it before removing
    if (currentlyPlayingAudio === audioElement) {
      audioElement.pause();
      currentlyPlayingAudio = null;
    }
    audioDiv.removeChild(audioContainer);
  });
  
  // Assemble the audio entry
  audioContainer.appendChild(textPreview);
  audioContainer.appendChild(timeDisplay);
  audioContainer.appendChild(audioElement);
  audioContainer.appendChild(deleteButton);
  
  // Add to container
  audioDiv.insertBefore(audioContainer, audioDiv.firstChild);
  
  // Start playing automatically if requested
  if (autoPlay) {
    // Stop any currently playing audio before auto-playing
    stopOtherAudio(audioElement);
    currentlyPlayingAudio = audioElement;
    audioElement.play();
  }
  
  return audioElement;
}

// Function to convert text to speech
async function convertTextToSpeech(text, autoPlay = true) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = "";
  
  if (!text) {
    messageDiv.textContent = "Please enter text to convert.";
    return;
  }
  
  const selectedVoice = voiceSelect.value;
  const selectedModel = modelSelect.value;
  convertButton.disabled = true;
  convertButton.textContent = "Converting...";
  
  try {
    const response = await fetch("https://voice.cloud.atemkeng.de/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedVoice,
        input: text,
        voice: selectedVoice
      })
    });
    
    if (!response.ok) {
      throw new Error("Error fetching audio data.");
    }
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio entry with current settings
    const timestamp = Date.now();
    const audioElement = await createAudioEntry(text, audioUrl, timestamp, selectedVoice, selectedModel, autoPlay);
  } catch (error) {
    messageDiv.textContent = "Error converting text to speech.";
    console.error("Error:", error);
  } finally {
    convertButton.disabled = false;
    convertButton.textContent = "Convert to Speech";
  }
}

// Handle convert button click
convertButton.addEventListener("click", async () => {
  await convertTextToSpeech(textInput.value);
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "newTextSelected" && message.text) {
    textInput.value = message.text;
    toggleConvertButton();
    convertTextToSpeech(message.text);
  }
});

// Dark mode toggle
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Save the dark mode state in localStorage
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
  } else {
    localStorage.setItem("darkMode", "disabled");
  }
});

// Prevent popup from closing when clicking outside
document.body.addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent event from propagating to the window and closing the popup
});

// Close the popup when clicking the close button
closeButton.addEventListener("click", () => {
  window.close(); // Close the popup when the close button is clicked
});

// Open a floating window with the popup content (to avoid it closing when clicking outside)
document.getElementById("openInFloatingWindow").addEventListener("click", () => {
  // Set the dimensions for the floating window
  const width = 480; // Adjusted width to 300px
  const height = 780;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  // Open the floating window
  window.open("popup.html", "PopupWindow", `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
});

document.addEventListener("DOMContentLoaded", async () => {
  // Check for stored selected text and auto-convert flag when popup opens
  chrome.storage.local.get(['selectedText', 'autoConvert', 'timestamp'], async function(result) {
    if (result.selectedText) {
      textInput.value = result.selectedText;
      toggleConvertButton();
      
      if (result.autoConvert) {
        await convertTextToSpeech(result.selectedText);
      }
      
      // Clear the stored data
      chrome.storage.local.remove(['selectedText', 'autoConvert', 'timestamp']);
    }
  });

  const modelSelect = document.getElementById("modelSelect");
  const voiceSelect = document.getElementById("voiceSelect");

  // Ensure modelSelect and voiceSelect elements are available
  if (!modelSelect || !voiceSelect) {
    console.error("Required select elements not found in the DOM.");
    return;
  }

  const modelToVoices = 
  {
    "voice-en-us": [
      "voice-en-us-ryan-low",
      "voice-en-us-kathleen-low"
    ],
    "voice-en-gb": ["voice-en-gb-alan-low"],
    "voice-de": [
      "voice-de-thorsten-low",
      "voice-de-kerstin-low"
    ],
    "voice-es": [
      "voice-es-carlfm-x-low"
    ],
    "voice-fr": [
      "voice-fr-gilles-low",
      "voice-fr-mls_1840-low",
      "voice-fr-siwis-low",
      "voice-fr-siwis-medium"
    ],
    "voice-it": ["voice-it-paola-medium"],
  }

  // Function to populate the voice dropdown based on selected model
  function populateVoices() {
    const selectedModel = modelSelect.value;
    const voices = modelToVoices[selectedModel] || [];

    // Clear previous options
    voiceSelect.innerHTML = "";

    // Populate the voice dropdown with options based on the selected model
    voices.forEach(voice => {
      const option = document.createElement("option");
      option.value = voice;
      option.textContent = voice.replace(/-/g, " ");
      voiceSelect.appendChild(option);
    });
  }

  // Event listener to populate voices when model is selected
  modelSelect.addEventListener("change", populateVoices);

  // Initial population of voices based on the default model selection
  populateVoices();
});
