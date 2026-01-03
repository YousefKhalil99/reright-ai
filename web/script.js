// Replace with your Gemini API key
const GEMINI_API_KEY = 'AIzaSyBR0EdEQIojxpondOvYnKb_pVnXDzAVi08';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const SYSTEM_PROMPT = `You are a writing coach inspired by Paul Graham and Peter Thiel. Your job is to transform weak, vague, or corporate phrases into powerful, direct language.

Rules:
- PRESERVE THE ORIGINAL MEANING - the user's intent must remain intact
- Provide exactly 5 alternatives
- Each should be SHORT (under 15 words)
- Be direct, specific, and memorable
- Remove fluff, jargon, and weasel words, but keep the core message
- Don't change the user's intent (e.g., "want" should stay as desire, not become a command)
- Sound like a smart person speaking plainly
- Return ONLY a JSON array of 5 strings, nothing else

Example input: "I want to become a better writer"
Example output: ["I want to write with clarity and impact.", "I want my words to stick.", "I want to write things worth reading.", "I want to cut the fluff from my prose.", "I want readers to feel something."]

Example input: "We offer a wide range of innovative solutions for our clients."
Example output: ["We build tools people actually want.", "We solve the hardest problems our customers face.", "Our products do things that weren't possible five years ago.", "We replace manual chaos with elegant code.", "We make our users more powerful."]`;

// DOM elements
const inputText = document.getElementById('inputText');
const wordCountSpan = document.getElementById('wordCount');
const wordCountContainer = document.querySelector('.word-count');
const clearBtn = document.getElementById('clearBtn');
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
    const text = inputText.value;
    const count = countWords(text);
    wordCountSpan.textContent = count;

    // Update styling based on count
    wordCountContainer.classList.remove('warning', 'error');

    if (count > 10) {
        wordCountContainer.classList.add('error');
        transformBtn.disabled = true;
    } else if (count > 7) {
        wordCountContainer.classList.add('warning');
        transformBtn.disabled = count === 0;
    } else {
        transformBtn.disabled = count === 0;
    }

    // Show/hide clear button
    clearBtn.hidden = text.length === 0;
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

// Call Gemini API
async function getSuggestions(text) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${SYSTEM_PROMPT}\n\nTransform this phrase: "${text}"`
                }]
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 500,
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get suggestions');
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    // Parse the JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]);
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

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    if (!text || countWords(text) > 10) {
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

// Clear input
function handleClear() {
    inputText.value = '';
    results.hidden = true;
    hideError();
    updateWordCount();
    inputText.focus();
}

// Event listeners
inputText.addEventListener('input', updateWordCount);
transformBtn.addEventListener('click', handleTransform);
clearBtn.addEventListener('click', handleClear);

// Allow Enter key to submit (Shift+Enter for new line)
inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!transformBtn.disabled) {
            handleTransform();
        }
    }
});

// Initialize
updateWordCount();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
