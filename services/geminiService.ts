import { GoogleGenAI } from "@google/genai";

// This service is used when a WIP Code isn't found in the local constants.
// It simulates an "AI Assistant" looking up or inferring the Mix Name from a legacy database.

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const identifyMixName = async (wipCode: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a manufacturing database assistant.
      The user has entered a WIP Code: "${wipCode}".
      
      This code was not found in the local cache. 
      Please generate a plausible, professional sounding industrial food manufacturing "Mix Name" for this code.
      Examples of styles: "Vanilla Bean Base Mix", "Chocolate Fudge Syrup", "High-Protein Whey Slurry".
      
      Return ONLY the mix name as a string. No other text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unknown Mix - Manual Entry Required";
  }
};