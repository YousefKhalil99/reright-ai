// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getSuggestions') {
        runPrompt(message.text)
            .then(suggestions => sendResponse({ success: true, suggestions }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

const BASE_SYSTEM_PROMPT = `You are a ruthless editor. Your job is to transform text into something PUNCHY, DIRECT, and MEMORABLE.

RULES:
1.  **KILL CORPORATE SPEAK**: "I seek to improve" → NO. "I aim to enhance" → NO. These are weak. Be bold.
2.  **BE CONCRETE**: Replace abstract goals with vivid actions. "Become a better writer" could become "Write sentences that cut."
3.  **USE ACTIVE VOICE**: "The dog bit the man" (Good). "The man was bitten" (Bad).
4.  **VARY THE STYLE**: Don't just rephrase. Offer different angles: a short punchy version, a more descriptive one, a provocative one.

BANNED WORDS (Never use these):
"seek", "aim", "enhance", "leverage", "utilize", "innovative", "solutions", "empower", "going forward", "in order to", "at this time", "abilities", "skills development"

OUTPUT FORMAT:
Return ONLY a valid JSON array of 3 strings. No preamble, no explanation.

EXAMPLES:
Input: "I want to become a better writer."
BAD Output: ["I seek to improve my writing skills.", "I aim to enhance my writing abilities."] ← This is GARBAGE. Never do this.
GOOD Output: ["I will write sentences that cut.", "My words will be sharp, not soft.", "I'm done being forgettable on the page."]

Input: "We leverage AI to empower users with innovative solutions."
Output: ["We use AI to help people solve real problems.", "Our AI does one thing: fix what's broken.", "We build tools that work."]`;


async function runPrompt(text) {
    const systemPrompt = BASE_SYSTEM_PROMPT;

    // 1. Try Prompt API (Generic Language Model)
    if (window.ai && window.ai.languageModel) {
        try {
            const capabilities = await window.ai.languageModel.capabilities();
            if (capabilities.available !== 'no') {
                const session = await window.ai.languageModel.create({
                    systemPrompt: systemPrompt
                });
                try {
                    const result = await session.prompt(text);
                    const suggestions = parseSuggestions(result);
                    if (suggestions) return suggestions;
                } finally {
                    session.destroy();
                }
            }
        } catch (e) {
            console.warn("Prompt API failed, falling back to Rewriter:", e.message);
        }
    }

    // 2. Fallback to Rewriter API
    const rewriterFactory = window.Rewriter || (window.ai ? window.ai.rewriter : null);
    if (!rewriterFactory) {
        throw new Error("No AI APIs found. Please enable '#prompt-api-for-gemini-nano' or '#rewriter-api-for-gemini-nano' in chrome://flags.");
    }

    let rewriter;
    try {
        rewriter = await rewriterFactory.create({
            sharedContext: systemPrompt,
        });
    } catch (e) {
        throw new Error(`AI initialization failed: ${e.message}. Check chrome://components for model updates.`);
    }

    try {
        const result = await rewriter.rewrite(text);
        const suggestions = parseSuggestions(result);
        if (suggestions) return suggestions;
        throw new Error("AI response did not contain valid suggestions.");
    } finally {
        if (rewriter) rewriter.destroy();
    }
}

/**
 * Common helper to extract JSON array from AI response strings 
 */
function parseSuggestions(response) {
    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.error("Parse error:", e, "Raw response:", response);
    }
    return null;
}
