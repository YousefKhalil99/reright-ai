// Reright.AI Cloudflare Worker
// This proxy securely calls Gemini API without exposing the API key

const SYSTEM_PROMPT = `You are a writing coach inspired by Paul Graham and Peter Thiel. Your job is to transform weak, vague, or corporate phrases into powerful, direct language.

Determine if the input is a single term (1-3 words) or a phrase/sentence.

IF INPUT IS A TERM:
- Replace it with a stronger, more intellectual, or contrarian term/idiom.
- Example: "unpopular opinion" -> "contrarian take"
- Example: "collaboration" -> "hive mind"
- Example: "complex" -> "nuanced"
- IGNORE the length rule. Output should be concise (1-3 words).

IF INPUT IS A PHRASE/SENTENCE:
- OUTPUT LENGTH: Each alternative must be 80-100% of the input word count.
- Remove fluff, jargon, and weasel words.
- Be direct, specific, and memorable.

GENERAL RULES:
- PRESERVE THE ORIGINAL MEANING - the user's intent must remain intact.
- Provide exactly 5 alternatives.
- Don't change the user's intent (e.g., "want" should stay as desire, not become a command).
- Sound like a smart person speaking plainly.
- Return ONLY a JSON array of 5 strings, nothing else.

Example input: "I want to become a better writer" (6 words)
Example output: ["I want to write with clarity.", "I want my words to stick.", "I want to write things worth reading.", "I want to cut the fluff.", "I want readers to feel something."]

Example input: "We offer a wide range of innovative solutions for our clients." (11 words)
Example output: ["We build tools people actually want to use.", "We solve the hardest problems our customers face.", "Our products do things that weren't possible before.", "We replace manual chaos with elegant, working code.", "We make our users more powerful every day."]`;

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        try {
            const { text } = await request.json();

            if (!text || typeof text !== 'string') {
                return new Response(JSON.stringify({ error: 'Text is required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }

            // Word count check
            const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
            if (wordCount > 100) {
                return new Response(JSON.stringify({ error: 'Please select 100 words or fewer' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }

            // Call Gemini API with secret key
            const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

            const response = await fetch(`${geminiUrl}?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return new Response(JSON.stringify({ error: error.error?.message || 'API request failed' }), {
                    status: response.status,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;

            // Parse JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return new Response(JSON.stringify({ error: 'Invalid response format' }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }

            const suggestions = JSON.parse(jsonMatch[0]);

            return new Response(JSON.stringify({ suggestions }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
    },
};
