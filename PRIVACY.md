# Privacy Policy for Reright.AI

**Effective Date:** 2024-01-01

## 1. Local Processing
Reright.AI is designed as a **local-first** application. All text transformation and analysis happen directly within your web browser using Google Chrome's built-in AI capabilities (`window.ai` / Gemini Nano).

**We do not:**
*   Transmit your text input to any external or cloud servers.
*   Store your text input in any database.
*   Collect telemetry on what you write.

## 2. Google Chrome AI
This extension utilizes the **Prompt API** (`window.ai.languageModel`) and the **Rewriter API** (`window.ai.rewriter` / `window.Rewriter`) provided by the Google Chrome browser.
*   The execution of the AI model happens on your device.
*   However, the model itself is downloaded from Google servers by the Chrome browser.
*   Usage of these APIs is subject to Google's terms regarding the Chrome browser.

## 3. Data Persistence
The extension may temporarily store your input text in the browser's local memory (`chrome.storage.local`) only for the purpose of passing data between the extension's background process and the popup window (e.g., if you select text and then click the extension icon). This data is not permanently stored.

## 4. Contact
If you have questions about this policy, please open an issue in the GitHub repository.
