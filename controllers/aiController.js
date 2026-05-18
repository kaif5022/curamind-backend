import { GoogleGenerativeAI } from '@google/generative-ai';

export const analyzeSymptoms = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || symptoms.trim().length === 0) {
      res.status(400);
      throw new Error('Symptoms cannot be empty');
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500);
      throw new Error('AI Service is not configured on the server');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a highly advanced medical AI assistant for doctors and patients.
A user has provided the following symptoms: "${symptoms}"

Please provide a highly structured, professional response returning ONLY a strict JSON object with no markdown wrappers or extra text.

The JSON object must have exactly these keys:
- "possibleConditions" (array of strings, briefly naming the possible conditions)
- "recommendedPrecautions" (array of strings)
- "urgencyLevel" (string: "Low", "Medium", "High", or "Critical")
- "suggestedNextSteps" (array of strings)
- "disclaimer" (string, stating this is not medical advice and a doctor must be consulted)

Generate the JSON object based on the symptoms:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse JSON
    let parsedResponse;
    try {
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      res.status(500);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    res.json(parsedResponse);
  } catch (error) {
    next(error);
  }
};
