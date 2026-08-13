import { generateTulAIJson, generateTulAIResponse } from './lib/logic/ai-config.ts';
import dotenv from 'dotenv';

dotenv.config();

console.log("--- Testing generateTulAIResponse ---");
const resText = await generateTulAIResponse("Confirm in 1 sentence that Gemini 2.0 Flash is online and ready for Tul.AI.");
console.log("ResText Result:", resText);

console.log("\n--- Testing generateTulAIJson for Profile Extraction ---");
const prompt = `The student provided the following natural-language description about themselves:
"My father works overseas in Dubai. I am studying BS Nursing in Cebu City and my GWA is 92.5."

Available Special Category Chips to choose from (pick ONLY exact matching items if mentioned):
["OFW Parent / Overseas Household","First-Generation Student","Solo-Parent Household","4Ps Household / Beneficiary","Person with Disability (PWD)","Indigenous Community / Cultural Group"]

Instructions:
Extract relevant structured profile attributes from the text. Respond strictly with a JSON object matching this schema:
{
  "city": "Cebu City",
  "course": "BS Nursing",
  "stage": "College Student",
  "year": "1st Year",
  "gwa": "92.5",
  "chips": ["OFW Parent / Overseas Household"],
  "summary": "Extracted BS Nursing, Cebu City, GWA 92.5, and OFW Parent dependent status."
}
`;

const resJson = await generateTulAIJson(prompt);
console.log("ResJson Result:", JSON.stringify(resJson, null, 2));
