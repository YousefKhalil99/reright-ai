console.log('Reright.AI background script loaded');

// Secure API endpoint (your Cloudflare Worker)
const API_URL = 'https://reright-api.writebetterai.workers.dev';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    // Clear any existing menus first
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'reright',
            title: 'Reright.AI',
            contexts: ['selection']
        });
    });
});

// Shared function to call API and get suggestions
async function getBetterWaySuggestions(selectedText, tabId) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: selectedText })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        // Send suggestions to content script
        chrome.tabs.sendMessage(tabId, {
            type: 'showSuggestions',
            suggestions: data.suggestions,
            originalText: selectedText
        });

    } catch (err) {
        chrome.tabs.sendMessage(tabId, {
            type: 'showError',
            message: err.message || 'Failed to get suggestions'
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

    // Store the selected text for the popup to read
    await chrome.storage.local.set({ pendingText: selectedText });

    // Open the popup
    chrome.action.openPopup();
});

// Handle messages from content script (floating icon clicks)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'triggerReright' && message.text) {
        const tabId = sender.tab.id;
        getBetterWaySuggestions(message.text, tabId);
    }
    return true; // Keep message channel open for async response
});
