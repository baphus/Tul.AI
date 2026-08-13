import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/labor/Documents/GitHub/Tul.AI/.env' });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

try {
  const models = await ai.models.list();
  console.log("Available models:");
  for await (const m of models) {
    console.log("-", m.name, m.supportedGenerationMethods);
  }
} catch (err) {
  console.error("Error listing models:", err);
}
