import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not defined or is set to placeholder in .env. Falling back to mock generator.");
    throw new Error("GEMINI_API_KEY env variable is required");
  }

  aiInstance = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return aiInstance;
}

export interface AiListingGenerationInput {
  textileType?: string;
  material?: string;
  condition?: string;
  quantity?: number;
  unit?: string;
  color?: string;
  intendedUse?: string;
  notes?: string;
  imageB64?: string;
  mimeType?: string;
}

export interface AiListingGenerationResult {
  title: string;
  description: string;
  suggestedCategory: string;
  searchKeywords: string[];
  materialType: string;
  condition: string;
  carbonSavingsKg: number;
  recyclabilityScore: number;
  recommendedIndustries: string[];
  upcyclingIdeas: string[];
}

export function generateFallbackListing(input: AiListingGenerationInput): AiListingGenerationResult {
  const textile = input.textileType || input.material || "Cotton Textile Scraps";
  const qty = input.quantity || 100;
  const unit = input.unit || "kg";
  const cond = input.condition || "Sorted Post-Industrial Waste";
  const col = input.color ? `in ${input.color}` : "in assorted shades";

  const title = `${textile} (${qty} ${unit}) - ${cond}`;
  const description = `High quality batch of ${textile.toLowerCase()} ${col}, suitable for circular manufacturing and fiber reprocessing. Carefully sorted with minimal non-textile trims, ensuring maximum yield for shredding, yarn spinning, insulation, or upcycled craft production. Volume available: ${qty} ${unit}. Meets Kenyan circular economy standards.`;

  let category = "Cotton";
  const lower = textile.toLowerCase();
  if (lower.includes("denim")) category = "Denim";
  else if (lower.includes("poly") || lower.includes("fleece") || lower.includes("synthetic")) category = "Synthetic";
  else if (lower.includes("clothing") || lower.includes("mitumba")) category = "Used clothing";
  else if (lower.includes("industrial") || lower.includes("cutting")) category = "Industrial textile waste";
  else if (lower.includes("mixed")) category = "Mixed textile";

  return {
    title,
    description,
    suggestedCategory: category,
    searchKeywords: [
      category.toLowerCase(),
      textile.toLowerCase(),
      "circular economy",
      "kenya textile",
      "textile recycling",
      cond.toLowerCase(),
      "upcycling materials"
    ],
    materialType: input.material || textile,
    condition: cond,
    carbonSavingsKg: Math.round(qty * 2.8),
    recyclabilityScore: 85,
    recommendedIndustries: [
      "Mechanical Fiber Recycling & Garnetting",
      "Industrial Acoustic & Thermal Insulation",
      "Upcycled Apparel & Heavy-duty Canvas Accessories"
    ],
    upcyclingIdeas: [
      "High-durability tote bags and upholstery padding",
      "Textured regenerated yarn for weaving",
      "Eco-friendly building insulation batts"
    ]
  };
}

/**
 * Generate a professional marketplace listing with AI
 * STRICT RULE: The AI must NEVER determine the final selling price. The seller controls the price.
 */
export async function generateAiListing(input: AiListingGenerationInput): Promise<AiListingGenerationResult> {
  try {
    const ai = getGeminiClient();

    const parts: any[] = [];
    if (input.imageB64) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType || "image/jpeg",
          data: input.imageB64,
        },
      });
    }

    const promptText = `
You are an expert circular textile economy specialist and technical copywriter for UziLink in Kenya.
Your task is to generate a professional marketplace listing based on the seller's input.

SELLER INPUT:
- Textile Type / Name: ${input.textileType || "Not specified"}
- Material Composition: ${input.material || "Not specified"}
- Condition: ${input.condition || "Not specified"}
- Quantity: ${input.quantity ? `${input.quantity} ${input.unit || "kg"}` : "Not specified"}
- Color: ${input.color || "Not specified"}
- Intended Use / Potential: ${input.intendedUse || "Not specified"}
- Additional Notes: ${input.notes || "Not specified"}

CRITICAL PRICING RULE:
You MUST NOT generate, estimate, or suggest any price. The seller has total control over pricing. Do not include any price field or currency amounts in the output.

REQUIREMENTS:
1. Title: A concise, descriptive, and professional marketplace title (e.g. "Sorted Indigo Denim Cutoffs (450 kg) - Pre-Consumer").
2. Description: A clear, professional description explaining:
   - What the material is (fibers, weave, purity)
   - Its condition and sorting status
   - The quantity available
   - Possible applications for recyclers and manufacturers
   - Important characteristics (cleanliness, moisture, trims)
3. Suggested Category: Must be exactly one of: "Cotton", "Denim", "Synthetic", "Mixed textile", "Used clothing", "Textile scraps", "Industrial textile waste", "Fleece", "Linen & Canvas", "Other".
4. Search Keywords: 5 to 8 relevant keywords to improve discoverability in the Kenyan B2B textile marketplace.
5. Carbon Savings: Estimated numeric kg CO2 saved by diverting this material from landfill (approx 2.5 - 3.2 kg CO2 per kg textile).
6. Recyclability Score: An integer score from 0 to 100 based on fiber homogeneity and cleanliness.
7. Recommended Industries: 2 to 4 potential industrial recycling / manufacturing sectors.
8. Upcycling Ideas: 2 to 3 creative or commercial upcycling concepts.
`;

    parts.push({ text: promptText });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "title",
            "description",
            "suggestedCategory",
            "searchKeywords",
            "materialType",
            "condition",
            "carbonSavingsKg",
            "recyclabilityScore",
            "recommendedIndustries",
            "upcyclingIdeas"
          ],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            searchKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            materialType: { type: Type.STRING },
            condition: { type: Type.STRING },
            carbonSavingsKg: { type: Type.NUMBER },
            recyclabilityScore: { type: Type.INTEGER },
            recommendedIndustries: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            upcyclingIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(result.text.trim()) as AiListingGenerationResult;
    return parsed;
  } catch (err) {
    console.error("Gemini AI listing generation fallback triggered:", err);
    return generateFallbackListing(input);
  }
}
