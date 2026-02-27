import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Shared retry utility with exponential backoff for handling rate limits (429)
 * and transient server errors (5xx).
 */
async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 2000
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
      const isRetryable = isRateLimit || errorMsg.includes("500") || errorMsg.includes("503");

      if (i === maxRetries - 1 || !isRetryable) {
        throw error;
      }

      console.warn(`Gemini API busy (Attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential increase
    }
  }
  throw new Error("Maximum retries exceeded for Gemini API.");
}

// AI Insights for enrollment trends
export const getEnrollmentInsights = async (studentData: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Explicitly typed callGeminiWithRetry to expect GenerateContentResponse to fix 'unknown' type error on line 48
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => 
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following student data and provide a short executive summary of enrollment trends and student distribution. Keep it concise (max 3-4 bullet points): ${JSON.stringify(studentData)}`,
        config: {
          temperature: 0.7,
        },
      })
    );
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      return "AI analytics are currently at capacity. Detailed insights will resume shortly. General enrollment metrics are still available above.";
    }
    return "The AI insight engine is temporarily unavailable. Standard reporting is unaffected.";
  }
};

// Strategic academic performance analysis
export const getExamPerformanceAnalysis = async (examData: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Explicitly typed callGeminiWithRetry to expect GenerateContentResponse to fix 'unknown' type error on line 73
    const response = await callGeminiWithRetry<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `You are an academic analyst. Analyze these school exam results and provide a strategic summary with strengths, weaknesses, and 3 actionable recommendations for improvement: ${JSON.stringify(examData)}`,
        config: {
          temperature: 0.8,
        },
      })
    );
    
    return response.text;
  } catch (error: any) {
    console.error("Exam Analysis Error:", error);
    if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      return "Strategic analysis quota exceeded. Please wait a few minutes before requesting a deep dive analysis again. Manual charts are still active.";
    }
    return "Strategic analysis module encountered an error. Please try again in a moment.";
  }
};

// Generates a formal transfer letter
export const generateTransferLetter = async (studentName: string, studentClass: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Explicitly typed callGeminiWithRetry to expect GenerateContentResponse to fix 'unknown' type error on line 95
    const response = await callGeminiWithRetry<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Write a formal School Transfer Certificate for a student named ${studentName} from class ${studentClass}. Include placeholders for principal signature and school seal.`,
      })
    );
    
    return response.text;
  } catch (error: any) {
    console.error("Transfer Letter Generation Error:", error);
    return "Error generating formal letter. Please use the manual document generator below.";
  }
};