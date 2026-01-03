# Reright.AI - Chrome Extension

**Reright.AI** is a local-first Chrome Extension that uses Chrome's built-in AI (Gemini Nano) to rewrite text. It transforms corporate-speak or weak phrasing into clear, direct, and intellectually honest language that emphasizes logic over jargon.

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
*   **Privacy First**: All rewrites happen locally on your machine. No data is sent to the cloud.
*   **Paul Graham Persona**: Specifically tuned for directness and clarity.

## ⚖️ Licensing
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer
This is an experimental project using the nascent Chrome Built-in AI APIs (primarily the **Prompt API**). These APIs are subject to change and may break in future Chrome updates.
