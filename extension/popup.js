// Secure API endpoint (your Cloudflare Worker)
const API_URL = 'https://reright-api.writebetterai.workers.dev';

// DOM elements
const inputText = document.getElementById('inputText');
const wordCount = document.getElementById('wordCount');
const transformBtn = document.getElementById('transformBtn');
const results = document.getElementById('results');
const suggestionList = document.getElementById('suggestionList');
const errorDiv = document.getElementById('error');

// Count words in text
function countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Update word count display
function updateWordCount() {
    const count = countWords(inputText.value);
    wordCount.textContent = count;

    const wordCountDiv = document.querySelector('.word-count');
    wordCountDiv.classList.remove('warning', 'error');

    if (count > 100) {
        wordCountDiv.classList.add('error');
        transformBtn.disabled = true;
    } else if (count > 80) {
        wordCountDiv.classList.add('warning');
        transformBtn.disabled = count === 0;
    } else {
        transformBtn.disabled = count === 0;
    }
}

// Show error message
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.hidden = false;
    results.hidden = true;
}

// Hide error message
function hideError() {
    errorDiv.hidden = true;
}

// Call API
async function getSuggestions(text) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
    }

    return data.suggestions;
}

// Display suggestions
function displaySuggestions(suggestions) {
    suggestionList.innerHTML = '';

    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.addEventListener('click', () => copyToClipboard(li, suggestion));
        suggestionList.appendChild(li);
    });

    results.hidden = false;
}

// Copy text to clipboard
async function copyToClipboard(element, text) {
    try {
        await navigator.clipboard.writeText(text);
        element.classList.add('copied');
        setTimeout(() => element.classList.remove('copied'), 1500);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// Handle transform button click
async function handleTransform() {
    const text = inputText.value.trim();

    if (!text || countWords(text) > 100) {
        return;
    }

    hideError();
    transformBtn.classList.add('loading');
    transformBtn.disabled = true;
    results.hidden = true;

    try {
        const suggestions = await getSuggestions(text);
        displaySuggestions(suggestions);
    } catch (err) {
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        transformBtn.classList.remove('loading');
        updateWordCount();
    }
}

// Event listeners
inputText.addEventListener('input', updateWordCount);
transformBtn.addEventListener('click', handleTransform);

// Allow Enter key to submit (Shift+Enter for new line)
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!transformBtn.disabled) {
            handleTransform();
        }
    }
});

// Initialize - check for pending text from right-click context menu
async function init() {
    updateWordCount();

    // Check if there's pending text from a right-click
    const { pendingText } = await chrome.storage.local.get('pendingText');
    if (pendingText) {
        inputText.value = pendingText;
        updateWordCount();
        // Clear the pending text so it doesn't persist
        await chrome.storage.local.remove('pendingText');
        // Focus the input
        inputText.focus();
    }
}

init();
