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
    // Upgraded to Gemini 2.5 Flash for 2026 support
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timed Out')), 15000))
    ]);

    const responseText = result.response.text();
    
    // Attempt to parse JSON safely
    let parsedResponse;
    try {
      let cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback object to prevent frontend crash
      parsedResponse = {
        possibleConditions: ["Unable to definitively analyze symptoms"],
        recommendedPrecautions: ["Please consult a healthcare professional", "Rest and monitor symptoms"],
        urgencyLevel: "Medium",
        suggestedNextSteps: ["Seek immediate medical attention if symptoms worsen", "Contact your primary care physician"],
        disclaimer: "AI analysis failed. This is a fallback response. Always consult a doctor for medical advice."
      };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('AI Controller Error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to process AI request' });
  }
};

export const generatePrescription = async (req, res, next) => {
  try {
    const { symptoms, diagnosis, age, gender } = req.body;

    if (!symptoms || !diagnosis) {
      res.status(400);
      throw new Error('Symptoms and diagnosis are required');
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500);
      throw new Error('AI Service is not configured on the server');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert AI clinical assistant supporting a medical doctor. 
The doctor has diagnosed a patient and needs a draft prescription.
Patient Details: Age ${age || 'Unknown'}, Gender ${gender || 'Unknown'}
Symptoms: ${symptoms}
Diagnosis: ${diagnosis}

Please draft a safe, professional, and standard medical prescription.
Return ONLY a strict JSON object with no markdown wrappers or extra text.

The JSON object must have exactly these keys:
- "medicines" (array of objects, each with: "name", "dosage", "frequency", "duration", "instructions")
- "precautions" (array of strings)
- "dietaryAdvice" (array of strings)
- "followUp" (string, recommendation for next visit)
- "generalCare" (array of strings)

Generate the JSON object based on the clinical data:`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timed Out')), 15000))
    ]);

    const responseText = result.response.text();
    
    // Attempt to parse JSON safely
    let parsedResponse;
    try {
      let cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini prescription response:', responseText);
      // Fallback object to prevent frontend crash
      parsedResponse = {
        medicines: [{ name: "Pending AI Analysis", dosage: "-", frequency: "-", duration: "-", instructions: "Please manually input medicines." }],
        precautions: ["Please consult the doctor directly."],
        dietaryAdvice: ["Maintain a healthy diet."],
        followUp: "As advised by doctor.",
        generalCare: ["Rest and monitor symptoms."]
      };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('AI Prescription Error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to generate prescription' });
  }
};
