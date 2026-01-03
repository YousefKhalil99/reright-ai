# <img src="extension-local/icons/icon48.png" width="32" height="32" style="vertical-align: middle;"> Reright.AI - Chrome Extension

Enjoy **ZERO cost**, **jargon-free** AI paraphrasing with this Chrome extension. **Reright.AI** is a local-first Chrome Extension that uses Chrome's built-in AI (Gemini Nano) to rewrite text. It transforms corporate-speak or weak phrasing into clear, direct, and intellectually honest language that emphasizes logic over jargon.

## ⚡️ How It Works
Reright.AI intercepts your text and processes it entirely on-device using Chrome's **Prompt API**.
1.  **Selection Mode**: Highlight any text on a webpage -> Click the floating **"RR"** button -> Copy the best alternative.
2.  **Popup Mode**: Click the extension icon -> Paste a draft -> Get 3 instant, punchy variations.

## 🚀 Getting Started (Installation)

Since this extension uses experimental browser APIs, it must be installed as an "unpacked" extension and requires several Chrome flags to be enabled.

### 1. Enable Chrome AI Flags
1.  Open `chrome://flags` in your browser.
2.  Enable **Prompt API for Gemini Nano** (`#prompt-api-for-gemini-nano`).
3.  Enable **Enables optimization guide on device** (`#optimization-guide-on-device-model`). Set it to **Enabled BypassPerfRequirement** if available.
4.  **Relaunch Chrome**.

### 2. Verify AI Model Download
1.  Open `chrome://components`.
2.  Find **Optimization Guide On Device Model**.
3.  Verify it shows a version number (not 0.0.0.0). If not, click **Check for update**.
    *   *Note*: The model is ~1.5GB and may take a few minutes to download.

### 3. Load the Extension
1.  Download or clone this repository.
2.  Open `chrome://extensions`.
3.  Turn on **Developer mode** (top right switch).
4.  Click **Load unpacked** and select the `extension-local` folder.

## 🛠 Features
*   **100% Local Privacy**: Uses `window.ai` (Gemini Nano). No data ever leaves your browser.
*   **Stoic Editing Engine**: Automatically removes fluff ("leverage", "utilize") and enforces active voice.
*   **Instant Context**: Floating UI allows for rapid rewrites without context switching.
*   **Smart Fallback**: Prioritizes the high-quality **Prompt API**, falling back to the **Rewriter API** only if needed.

## ⚖️ Licensing
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer
This is an experimental project using the nascent Chrome Built-in AI APIs (primarily the **Prompt API**). These APIs are subject to change and may break in future Chrome updates.

## 🏗 Technical Architecture

Reright.AI is built on the **Chrome Extension Manifest V3** platform and strictly adheres to the "Local First" philosophy.

*   **Prompt API (Gemini Nano)**: usage via `window.ai.languageModel`. This is the core engine for rewriting text.
*   **Offscreen Document**: Used to handle clipboard operations or other DOM-related tasks that Service Workers cannot perform directly (though currently primarily reserved for future clipboard DOM parsing if needed).
*   **Shadow DOM**: The floating button ("RR") and the overlay UI are injected into webpages using Shadow DOM. This ensures that the extension's styles do not bleed into the target website, and vice-versa.

## 📂 File Structure

```text
extension-local/
├── manifest.json       # Config: Permissions, scripts, resources
├── background.js       # Service Worker: Central message bus
├── content.js          # Logic: Interacts with web pages (DOM, Selection)
├── content.css         # Styles: Floating button and Overlay UI
├── popup.html          # UI: The main extension popup window
├── popup.js            # Logic: Handles manual input in the popup
├── offscreen.html      # Helper: Offscreen document for DOM capabilities
├── offscreen.js        # Logic: Offscreen script
└── icons/              # Assets: App icons (16, 48, 128)
```
