// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getSuggestions') {
        runPrompt(message.text)
            .then(suggestions => sendResponse({ success: true, suggestions }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

const BASE_SYSTEM_PROMPT = `You are an expert editor. Your goal is to rewrite text to be STOIC, INTELLECTUALLY HONEST, and CONCRETE.

PRINCIPLES:
1.  **Kill Fluff**: Remove "leverage", "utilize", "empower", "solutions", "innovative". Use "use", "help", "fix", "tools", "new".
2.  **Stoic Tone**: Be objective and unembellished. State facts, not feelings.
3.  **Active Voice**: "The tool fixes X" (Good). "X is fixed by the tool" (Bad).
4.  **No "Translating"**: Don't say "This text says...". Just say the thing itself.

CRITICAL INSTRUCTIONS:
1. DO NOT SUMMARIZE.
2. PROVIDE EXACTLY 3 ALTERNATIVES.
3. Return ONLY a JSON array of 3 strings.

Example:
Input: "We leverage AI to empower users with innovative solutions."
Output: ["We use AI to help users solve problems.", "Our AI tools fix real issues.", "We build software that works."]`;

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
