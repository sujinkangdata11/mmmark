
import { GoogleGenAI } from "@google/genai";

// Create a function that accepts an API key parameter and optional image data
export const generateText = async (prompt: string, imageDataUrl?: string, apiKey?: string): Promise<string> => {
  // First try to use the provided API key, then fall back to environment variable
  const API_KEY = apiKey || process.env.API_KEY;
  
  if (!API_KEY) {
    // Mock implementation for development without an API key
    return new Promise(resolve => {
      setTimeout(() => {
        const imageText = imageDataUrl ? " (이미지 포함)" : "";
        resolve(`This is a mock AI response for the prompt: "${prompt.substring(0, 50)}..."${imageText}. Set your API_KEY to get real responses.`);
      }, 1500);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    if (imageDataUrl) {
      console.log('[GEMINI DEBUG] imageDataUrl 처음 50자:', imageDataUrl.substring(0, 50));
      
      // Extract base64 data and mime type from data URL
      const [mimeTypePart, base64Data] = imageDataUrl.split(',');
      const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || 'image/jpeg';
      
      console.log('[GEMINI DEBUG] mimeTypePart:', mimeTypePart);
      console.log('[GEMINI DEBUG] mimeType:', mimeType);
      console.log('[GEMINI DEBUG] base64Data 길이:', base64Data?.length);
      console.log('[GEMINI DEBUG] base64Data 처음 50자:', base64Data?.substring(0, 50));
      
      const contents = [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ];
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });
      
      return response.text;
    } else {
      // Text-only content
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      return response.text;
    }
  } catch (error) {
    console.error("Error generating text with Gemini API:", error);
    return "AI 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.";
  }
};
