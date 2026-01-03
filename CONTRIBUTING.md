# Contributing to Reright.AI

Thank you for your interest in contributing! Reright.AI is an open-source project dedicated to bringing local, privacy-first AI writing tools to everyone.

## 🛠 Development Setup

Because this extension utilizes experimental Chrome APIs, setting up the development environment requires a few specific steps.

### Prerequisites
1.  **Google Chrome (Canary or Dev channel recommended)**: These channels often have the latest AI features enabled earlier.
2.  **Enable Flags**:
    *   `chrome://flags/#prompt-api-for-gemini-nano`: **Enabled**
    *   `chrome://flags/#optimization-guide-on-device-model`: **Enabled BypassPerfRequirement**

### Installation
1.  Clone the repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer Mode** (toggle in top right).
4.  Click **Load Unpacked**.
5.  Select the `extension-local` directory from this repository.

## 🏗 Architecture Overview

The extension operates via three main components communicating through the Chrome Runtime messaging system:

1.  **Content Script (`content.js`)**:
    *   Detects user text selection.
    *   Injects the "RR" floating button.
    *   Injects the Overlay UI for results.
    *   **Note**: Runs in the context of the web page but isolated.

2.  **Background Worker (`background.js`)**:
    *   Acts as the orchestrator.
    *   Receives `triggerReright` requests from the Content Script.
    *   Initializes the AI session using `window.ai.languageModel.create()`.
    *   Streams the response back to the Content Script.

3.  **Popup (`popup.js`)**:
    *   Handles the manual input flow from the toolbar icon.
    *   Instantiates its own local AI session to process text directly.

## 🐛 Debugging

Since the code runs in different contexts, you need to look in different places for logs:

*   **Popup Logic**: Right-click the extension icon in the toolbar -> **Inspect Popup**. Look at the Console tab.
*   **Background Logic**: Go to `chrome://extensions`, find Reright.AI, and click the blue link that says **service worker**.
*   **Content Script**: Open the Developer Tools (F12) on any web page where you are testing the extension.

## 🧪 Testing

Currently, testing is manual.
*   **Prompt Engineering**: If you edit the system prompt in `background.js` or `popup.js`, test with edge cases like very short text ("hi"), very long text, or nonsense text to ensure the model behaves stoically.

## 📦 Publishing

To package for release:
1.  Zip the `extension-local` folder.
2.  Ensure `manifest.json` version is updated.
3.  Upload to Chrome Web Store Developer Dashboard.
