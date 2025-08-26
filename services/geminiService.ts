
import { GoogleGenAI } from "@google/genai";

// Create a function that accepts an API key parameter
export const generateText = async (prompt: string, apiKey?: string): Promise<string> => {
  // First try to use the provided API key, then fall back to environment variable
  const API_KEY = apiKey || process.env.API_KEY;
  
  if (!API_KEY) {
    // Mock implementation for development without an API key
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`This is a mock AI response for the prompt: "${prompt.substring(0, 50)}...". Set your API_KEY to get real responses.`);
      }, 1500);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    // Using the recommended '.text' accessor
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini API:", error);
    return "AI 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.";
  }
};
