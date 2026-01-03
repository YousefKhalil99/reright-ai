console.log('Reright.AI background script loaded');

// Shared function to ensure offscreen and get suggestions
async function getSuggestionsFromOffscreen(text) {
    // Create offscreen document if it doesn't exist
    const hasOffscreen = await chrome.offscreen.hasDocument();
    if (!hasOffscreen) {
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['LOCAL_STORAGE'], // Using LOCAL_STORAGE as a generic reason
            justification: 'To use the window.ai API which is not available in service workers.'
        });
    }

    // Send message to offscreen document
    // Note: sending to runtime sends to all, including offscreen
    const response = await chrome.runtime.sendMessage({
        type: 'getSuggestions',
        text: text
    });

    if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to get suggestions from Local AI');
    }

    return response.suggestions;
}

// Function to handle context menu or content script requests (sends to tab)
async function getBetterWaySuggestions(selectedText, tabId) {
    try {
        const suggestions = await getSuggestionsFromOffscreen(selectedText);

        // Send suggestions to answer in content script
        chrome.tabs.sendMessage(tabId, {
            type: 'showSuggestions',
            suggestions: suggestions,
            originalText: selectedText
        });
    } catch (err) {
        chrome.tabs.sendMessage(tabId, {
            type: 'showError',
            message: err.message || 'Failed to get suggestions from Local AI'
        });
    }
}

// Handle context menu click - store text and open popup
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log('Context menu clicked:', info.menuItemId);
    if (info.menuItemId !== 'reright') return;

    const selectedText = info.selectionText?.trim();
    console.log('Selected text:', selectedText);
    if (!selectedText) return;

    // Trigger the suggestion flow directly for context menu (floating UI)
    // Note: The original requirement was context menu -> Popup? 
    // Checking original code: "Store the selected text for the popup to read" -> "Open the popup"
    // Wait, line 53 says: "Open the popup".
    // BUT getBetterWaySuggestions is used by "message.type === 'triggerReright'" (floating icon).
    // The context menu logic in OLD background.js (line 63) opened popup.
    // The NEW background.js logic I wrote in Step 122 seems to mix them up. 
    // Let's stick to the original behavior for Context Menu: Open Popup.

    // Store the selected text for the popup to read
    await chrome.storage.local.set({ pendingText: selectedText });

    // Open the popup
    chrome.action.openPopup();
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Content script floating icon
    if (message.type === 'triggerReright' && message.text) {
        const tabId = sender.tab.id;
        getBetterWaySuggestions(message.text, tabId);
    }

    // Popup requesting suggestions (Broker to offscreen)
    if (message.type === 'getSuggestionsViaOffscreen' && message.text) {
        getSuggestionsFromOffscreen(message.text)
            .then(suggestions => sendResponse({ success: true, suggestions }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open
    }
});
