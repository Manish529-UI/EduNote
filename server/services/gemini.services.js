
const Gemini_URL = 
"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"

const Groq_URL = "https://api.groq.com/openai/v1/chat/completions"

const callGroqAPI = async (prompt) => {
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
            model: "qwen/qwen3.8-27b",
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Groq API HTTP Error:", response.status, err);
        throw new Error(`Groq API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
        throw new Error("No text returned from Groq");
    }

    return text;
}

export const generateGeminiResponse = async (prompt) => {

    try {
         const response = await fetch(`${Gemini_URL}?key=${process.env.GEMINI_API_KEY}`,{
        method:"POST",
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
          ]
        })

    })

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API HTTP Error:", response.status, err);
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json()

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No text returned from Gemini");
    }

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

    // Try to extract JSON object if there's extra text around it
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in Gemini response");
    }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
        console.error("Gemini Fetch Error:", error.message);
        console.log("Falling back to Groq API...");
        try {
            const grokText = await callGroqAPI(prompt);
            const cleanGrokText = grokText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .replace(/<think>[\s\S]*?<\/think>/g, "")
                .trim();
            const groqJsonMatch = cleanGrokText.match(/\{[\s\S]*\}/);
            if (!groqJsonMatch) {
                throw new Error("No valid JSON object found in Groq response");
            }
            return JSON.parse(groqJsonMatch[0]);
        } catch (grokError) {
            console.error("Groq Fetch Error:", grokError.message);
            throw new Error("Both Gemini and Groq AI APIs failed");
        }
    }
   
}