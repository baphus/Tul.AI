import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/labor/Documents/GitHub/Tul.AI/.env' });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const candidates = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite'
];

for (const model of candidates) {
  try {
    console.log(`Testing model: ${model}...`);
    const res = await ai.models.generateContent({
      model: model,
      contents: "Hi, answer in 3 words.",
    });
    console.log(` SUCCESS with model '${model}':`, res.text?.trim());
    break;
  } catch (err) {
    console.log(` FAILED for model '${model}':`, err.message || err);
  }
}
