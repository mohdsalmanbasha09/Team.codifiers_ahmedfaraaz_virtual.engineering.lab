import { GoogleGenAI, Type } from "@google/genai";
import { PlanetEngineeringInfo } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Cache to prevent redundant API calls during a session
const planetCache: Record<string, PlanetEngineeringInfo> = {};

export const getPlanetEngineeringData = async (planetName: string): Promise<PlanetEngineeringInfo> => {
  if (planetCache[planetName]) {
    return planetCache[planetName];
  }

  // Fallback data in case API key is missing or fails
  const fallback: PlanetEngineeringInfo = {
    gravity: "Unknown",
    temperature: "Unknown",
    atmosphere: "Analyzing...",
    engineeringChallenge: "Data link interrupted. Please check API configuration.",
  };

  if (!apiKey) {
    console.warn("No API Key found for Gemini.");
    return fallback;
  }

  try {
    const prompt = `
      Provide a brief engineering summary for the planet ${planetName}.
      Return ONLY a JSON object with the following keys:
      - gravity: string (e.g., "3.7 m/s²")
      - temperature: string (e.g., "-63°C avg")
      - atmosphere: string (brief composition)
      - engineeringChallenge: string (one major challenge for landing or operating machinery there, max 20 words)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gravity: { type: Type.STRING },
            temperature: { type: Type.STRING },
            atmosphere: { type: Type.STRING },
            engineeringChallenge: { type: Type.STRING },
          },
          required: ["gravity", "temperature", "atmosphere", "engineeringChallenge"]
        }
      }
    });

    let text = response.text;
    if (text) {
      // Sanitize output: Remove markdown code block delimiters if present
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      
      try {
        const data = JSON.parse(text) as PlanetEngineeringInfo;
        planetCache[planetName] = data;
        return data;
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", text);
        return fallback;
      }
    }
    return fallback;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return fallback;
  }
};