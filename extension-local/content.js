// Reright.AI Content Script
// Handles overlay display and floating selection icon

let overlay = null;
let selectionIcon = null;

// =====================
// Selection Icon Logic
// =====================

// Remove selection icon
function removeSelectionIcon() {
    if (selectionIcon) {
        selectionIcon.remove();
        selectionIcon = null;
    }
}

// Show selection icon near the selected text
function showSelectionIcon(rect) {
    removeSelectionIcon();

    selectionIcon = document.createElement('button');
    selectionIcon.className = 'better-way-selection-icon';
    const iconUrl = chrome.runtime.getURL('icons/icon48.png');
    selectionIcon.innerHTML = `<img src="${iconUrl}" alt="Reright" style="width: 20px; height: 20px; display: block;">`;
    selectionIcon.title = 'Reright.AI - Transform this text';

    // Position at top-right of selection
    const top = rect.top + window.scrollY - 36;
    const left = rect.right + window.scrollX + 4;

    // Keep within viewport
    const maxLeft = window.innerWidth - 50;
    const finalLeft = Math.min(left, maxLeft);
    const finalTop = Math.max(10, top);

    selectionIcon.style.top = `${finalTop}px`;
    selectionIcon.style.left = `${finalLeft}px`;

    selectionIcon.addEventListener('click', handleIconClick);
    selectionIcon.addEventListener('mousedown', (e) => e.preventDefault()); // Prevent losing selection

    document.body.appendChild(selectionIcon);
}

// Handle icon click - trigger Better Way
async function handleIconClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) {
        removeSelectionIcon();
        return;
    }

    // Check word count
    const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 100) {
        showError('Please select 100 words or fewer');
        removeSelectionIcon();
        return;
    }

    removeSelectionIcon();
    showLoading();

    // Send message to background script
    try {
        chrome.runtime.sendMessage({
            type: 'triggerReright',
            text: selectedText
        });
    } catch (err) {
        showError('Failed to connect to extension');
    }
}

// Check if there's a valid selection
function checkSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Need at least 2 characters
    if (!selectedText || selectedText.length < 2) {
        removeSelectionIcon();
        return;
    }

    // Get selection bounding rect
    if (!selection.rangeCount) {
        removeSelectionIcon();
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Valid selection - show icon
    if (rect.width > 0 && rect.height > 0) {
        showSelectionIcon(rect);
    }
}

// Debounce helper
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Listen for mouseup to detect selection
document.addEventListener('mouseup', (e) => {
    // Ignore clicks on the icon itself or overlay
    if (selectionIcon && selectionIcon.contains(e.target)) return;
    if (overlay && overlay.contains(e.target)) return;

    // Small delay to let selection finalize
    setTimeout(checkSelection, 10);
});

// Hide icon when clicking elsewhere (if not on icon)
document.addEventListener('mousedown', (e) => {
    if (selectionIcon && !selectionIcon.contains(e.target)) {
        // Don't remove immediately - let mouseup handle new selection
        setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            if (!selectedText || selectedText.length < 2) {
                removeSelectionIcon();
            }
        }, 50);
    }
});

// =====================
// Overlay Logic
// =====================

// Remove existing overlay
function removeOverlay() {
    if (overlay) {
        overlay.remove();
        overlay = null;
    }
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleEscape);
}

// Handle clicks outside overlay
function handleOutsideClick(e) {
    if (overlay && !overlay.contains(e.target)) {
        removeOverlay();
    }
}

// Handle escape key
function handleEscape(e) {
    if (e.key === 'Escape') {
        removeOverlay();
        removeSelectionIcon();
    }
}

// Get position near selection
function getOverlayPosition() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return { top: 100, left: 100 };

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
        top: rect.bottom + window.scrollY + 10,
        left: Math.max(10, rect.left + window.scrollX)
    };
}

// Create overlay element
function createOverlay() {
    removeOverlay();
    removeSelectionIcon();

    overlay = document.createElement('div');
    overlay.className = 'better-way-overlay';
    overlay.innerHTML = `
    <div class="better-way-header">
      <div class="better-way-logo-container" style="display: flex; align-items: center; gap: 8px;">
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Logo" style="width: 20px; height: 20px;">
        <span class="better-way-logo">Reright.AI</span>
      </div>
      <button class="better-way-close" aria-label="Close">&times;</button>
    </div>
    <div class="better-way-content"></div>
  `;

    const pos = getOverlayPosition();
    overlay.style.top = `${pos.top}px`;
    overlay.style.left = `${pos.left}px`;

    document.body.appendChild(overlay);

    // Close button handler
    overlay.querySelector('.better-way-close').addEventListener('click', removeOverlay);

    // Outside click and escape handlers
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
    }, 100);

    return overlay.querySelector('.better-way-content');
}

// Show loading state
function showLoading() {
    const content = createOverlay();
    content.innerHTML = `
    <div class="better-way-loading">
      <div class="better-way-spinner"></div>
      <span>Finding better ways...</span>
    </div>
  `;
}

// Show error message
function showError(message) {
    const content = createOverlay();
    content.innerHTML = `
    <div class="better-way-error">
      <span>⚠️ ${message}</span>
    </div>
  `;
}

// Show suggestions
function showSuggestions(suggestions) {
    const content = createOverlay();

    const list = document.createElement('ul');
    list.className = 'better-way-suggestions';

    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        li.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(suggestion);
                li.classList.add('copied');
                li.setAttribute('data-copied', 'true');
                setTimeout(() => {
                    li.classList.remove('copied');
                    li.removeAttribute('data-copied');
                }, 1500);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
        list.appendChild(li);
    });

    content.appendChild(list);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message.type);
    switch (message.type) {
        case 'showLoading':
            showLoading();
            break;
        case 'showError':
            showError(message.message);
            break;
        case 'showSuggestions':
            showSuggestions(message.suggestions);
            break;
    }
    return true; // Indicate async response
});
