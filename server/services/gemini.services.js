
const Groq_URL = "https://api.groq.com/openai/v1/chat/completions";

const cleanAndParseJson = (rawText) => {
    if (!rawText || typeof rawText !== "string") {
        throw new Error("Empty response received from AI");
    }

    const cleanText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No valid JSON object found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Safety validation to ensure critical structure exists
    if (!parsed.subTopics && !parsed.notes && !parsed.revisionPoints) {
        throw new Error("Incomplete JSON schema returned by AI");
    }

    if (typeof parsed.notes === "string") {
        // Normalize literal \n escapes into real line breaks and format main priority headings
        let normalized = parsed.notes
            .replace(/\\r\\n/g, "\n")
            .replace(/\\n/g, "\n");
        normalized = normalized.replace(/^([ \t]*)(⭐+ [^\n]+)/gm, "$1## $2");
        parsed.notes = normalized;
    }

    return parsed;
};

const callGroqAPI = async (prompt) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
        const response = await fetch(Groq_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert AI tutor generating exam notes. Always return your response as valid, pure JSON without any markdown formatting or backticks."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "openai/gpt-oss-120b",
                temperature: 0.2,
                response_format: { type: "json_object" }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API error (${response.status}): ${err}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        return cleanAndParseJson(text);
    } finally {
        clearTimeout(timeout);
    }
};

const callGeminiAPI = async (prompt, model = "gemini-3.5-flash-lite") => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error (${response.status}) on ${model}: ${err}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return cleanAndParseJson(text);
    } finally {
        clearTimeout(timeout);
    }
};

export const generateGeminiResponse = async (prompt) => {
    // 1. Try Groq first for ultra-fast generation (~5-7 seconds)
    try {
        console.log("⚡ Generating notes via Groq (high-speed engine)...");
        const groqResult = await callGroqAPI(prompt);
        console.log("✅ Groq generation successful!");
        return groqResult;
    } catch (groqError) {
        console.warn("⚠️ Groq API failed or timed out:", groqError.message);
        console.log("🔄 Seamlessly falling back to Gemini...");
    }

    // 2. Primary fallback: Gemini 3.5 Flash-Lite (Fast, modern)
    try {
        console.log("⚡ Generating notes via Gemini 3.5 Flash-Lite...");
        const geminiResult = await callGeminiAPI(prompt, "gemini-3.5-flash-lite");
        console.log("✅ Gemini 3.5 Flash-Lite generation successful!");
        return geminiResult;
    } catch (geminiError) {
        console.warn("⚠️ Gemini 3.5 Flash-Lite failed:", geminiError.message);
        console.log("🔄 Trying secondary Gemini fallback (gemini-flash-lite-latest)...");
    }

    // 3. Secondary fallback: Gemini Flash-Lite Latest
    try {
        const fallbackResult = await callGeminiAPI(prompt, "gemini-flash-lite-latest");
        console.log("✅ Gemini Flash-Lite Latest generation successful!");
        return fallbackResult;
    } catch (fallbackError) {
        console.error("❌ All AI generation providers failed:", fallbackError.message);
        throw new Error("AI generation services are temporarily busy. Please try again in a moment.");
    }
};