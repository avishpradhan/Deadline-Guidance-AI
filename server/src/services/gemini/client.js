import { GoogleGenAI } from '@google/genai';

let aiClient = null;

export const getGeminiClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
};

export const MODEL = 'gemini-3.1-flash-lite-preview';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
const MAX_RETRIES = 2;
const INITIAL_DELAY = 1000;

/*
  * Wrapper function to handle generateContent calls with retry-with-backoff and model fallbacks
  */
const generateWithRetryAndFallback = async (ai, options) => {
  let attempt = 0;
  let currentModel = options.model || MODEL;
  let fallbackIndex = -1;

  while (true) {
    try {
      return await ai.models.generateContent({
        ...options,
        model: currentModel,
      });
    } catch (err) {
      attempt++;

      const errMessage = err.message || '';
      const isTransient =
        err.status === 'UNAVAILABLE' ||
        err.statusCode === 503 ||
        errMessage.includes('503') ||
        errMessage.toLowerCase().includes('unavailable') ||
        errMessage.toLowerCase().includes('high demand') ||
        err.status === 'RESOURCE_EXHAUSTED' ||
        err.statusCode === 429 ||
        errMessage.includes('429') ||
        errMessage.toLowerCase().includes('quota');

      if (!isTransient) {
        throw err;
      }

      // If we've run out of retries for the current model, try a fallback model
      if (attempt >= MAX_RETRIES) {
        fallbackIndex++;
        // Find the next model from the fallback list that is not the same as the original or current model
        let nextModel = null;
        while (fallbackIndex < FALLBACK_MODELS.length) {
          const candidate = FALLBACK_MODELS[fallbackIndex];
          if (candidate !== options.model) {
            nextModel = candidate;
            break;
          }
          fallbackIndex++;
        }

        if (nextModel) {
          console.warn(`⚠️ Model "${currentModel}" failed with transient error. Falling back to "${nextModel}"...`);
          currentModel = nextModel;
          attempt = 0; // Reset attempts for the new model
          continue;
        } else {
          // No more models to fallback to
          throw err;
        }
      }

      const delay = INITIAL_DELAY * Math.pow(2, attempt) + Math.random() * 300;
      console.warn(`⚠️ Gemini API transient error (${errMessage}). Retrying model "${currentModel}" in ${Math.round(delay)}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Generate content from Gemini with structured JSON output.
 */
export const generateJSON = async (prompt, systemInstruction = '') => {
  const ai = getGeminiClient();
  const response = await generateWithRetryAndFallback(ai, {
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: systemInstruction || undefined,
    },
  });

  try {
    return JSON.parse(response.text);
  } catch {
    // If JSON parsing fails, return the raw text wrapped
    return { raw: response.text };
  }
};

/**
 * Generate plain text content from Gemini.
 */
export const generateText = async (prompt, systemInstruction = '') => {
  const ai = getGeminiClient();
  const response = await generateWithRetryAndFallback(ai, {
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || undefined,
    },
  });
  return response.text;
};
