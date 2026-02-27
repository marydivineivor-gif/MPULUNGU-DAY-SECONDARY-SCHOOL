
import { GoogleGenAI } from "@google/genai";

// AI Insights for enrollment trends
export const getEnrollmentInsights = async (studentData: any) => {
  if (!process.env.API_KEY) return "AI Insights unavailable: API Key not configured.";
  
  try {
    // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following student data and provide a short executive summary of enrollment trends and student distribution: ${JSON.stringify(studentData)}`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Error fetching insights from AI.";
  }
};

// Strategic academic performance analysis
export const getExamPerformanceAnalysis = async (examData: any) => {
  if (!process.env.API_KEY) return "AI Analysis unavailable: API Key not configured.";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are an academic analyst. Analyze these school exam results and provide a strategic summary with strengths, weaknesses, and 3 actionable recommendations for improvement: ${JSON.stringify(examData)}`,
      config: {
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Exam Analysis Error:", error);
    return "Failed to generate AI performance analysis.";
  }
};

// Generates a formal transfer letter
export const generateTransferLetter = async (studentName: string, studentClass: string) => {
  if (!process.env.API_KEY) return "AI Letter Generation unavailable: API Key not configured.";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a formal School Transfer Certificate for a student named ${studentName} from class ${studentClass}. Include placeholders for principal signature and school seal.`,
    });
    return response.text;
  } catch (error) {
    console.error("Transfer Letter Generation Error:", error);
    return "Error generating letter.";
  }
};
