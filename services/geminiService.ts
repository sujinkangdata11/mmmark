
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables.
// In a real application, you would need to set this up in your deployment environment.
// For this example, we'll proceed assuming it's set.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Using mock service. Please set the API_KEY environment variable.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateText = async (prompt: string): Promise<string> => {
  if (!ai) {
    // Mock implementation for development without an API key
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`This is a mock AI response for the prompt: "${prompt.substring(0, 50)}...". Set your API_KEY to get real responses.`);
      }, 1500);
    });
  }

  try {
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
