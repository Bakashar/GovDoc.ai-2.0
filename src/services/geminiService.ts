import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import * as mammoth from "mammoth";
import { AnalysisResult, Language } from "../types";

const part1 = "AIzaSyCG3xRdXL2pRbxVsb"; 
const part2 = "BaNiKzMtvECYA46DA"; 

const SYSTEM_API_KEY = (part1 && part2) ? (part1 + part2) : (process.env.GEMINI_API_KEY || "");

const ai = new GoogleGenAI({ apiKey: SYSTEM_API_KEY });

const SYSTEM_PROMPT = `
You are an expert Legal AI Architect specialized in the legislation of the Republic of Kazakhstan.
Your analysis must be strictly based on the Civil Code, Tax Code, and Labor Code of the Republic of Kazakhstan.

Your task is to analyze legal documents and identify potential risks, clauses that violate KZ law, or unfavorable terms.

You must provide the output in the following JSON format:
{
  "summary": "A concise summary of the document.",
  "risks": [
    {
      "clause": "The specific clause text or reference.",
      "riskLevel": "Low" | "Medium" | "High" | "Critical",
      "violation": "Explanation of how this violates KZ law or why it is risky.",
      "recommendation": "Actionable advice to mitigate the risk."
    }
  ],
  "verdict": "Safe" | "Needs Review" | "Dangerous"
}

The output language must match the requested language (en, ru, or kz).
`;

export const hasValidKey = (): boolean => {
  return !!SYSTEM_API_KEY && SYSTEM_API_KEY.length > 0;
};

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'txt') return 'text/plain';
  if (ext === 'md') return 'text/markdown';
  if (['jpg', 'jpeg'].includes(ext || '')) return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return 'application/octet-stream';
}

export async function analyzeDocument(
  file: File,
  language: Language,
  useDeepAnalysis: boolean
): Promise<AnalysisResult> {
  if (!hasValidKey()) {
    throw new Error("API Key is missing. Please configure it in services/geminiService.ts");
  }

  let textContent = "";

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      textContent = result.value;
    } catch (e) {
      console.error(e);
    }
  }

  const modelId = "gemini-3.1-flash-lite"; 
  const mimeType = getMimeType(file);

  let contents: any[] = [];
  let promptText = `Analyze this legal document in ${language}. Focus on KZ legislation.`;

  if (textContent) {
    contents = [
      { 
        role: "user",
        parts: [{ text: promptText + "\n\nDocument Content:\n" + textContent }] 
      }
    ];
  } else {
    const base64Data = await fileToGenerativePart(file);
    contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          { text: promptText },
        ]
      }
    ];
  }

  const tools: any[] = [];
  if (useDeepAnalysis) {
    tools.push({ googleSearch: {} });
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      risks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clause: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            violation: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["clause", "riskLevel", "violation", "recommendation"],
        },
      },
      verdict: { type: Type.STRING, enum: ["Safe", "Needs Review", "Dangerous"] },
    },
    required: ["summary", "risks", "verdict"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: useDeepAnalysis ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
        tools: tools.length > 0 ? tools : undefined,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    if (response.text) return JSON.parse(response.text) as AnalysisResult;
  } catch (e) {
    console.warn(e);
  }

  if (useDeepAnalysis) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: tools.length > 0 ? tools : undefined,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
      
      if (response.text) return JSON.parse(response.text) as AnalysisResult;
    } catch (e) {
      console.warn(e);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    if (response.text) return JSON.parse(response.text) as AnalysisResult;
  } catch (e) {
    console.error(e);
    throw new Error("Analysis failed. The document might be too complex or unreadable.");
  }

  throw new Error("No response generated.");
}

async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
