import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 leaf image scan uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Gemini Client with correct user-agent headers per skill rules
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI queries will fallback to responsive simulator.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// ============================================
// FULL-STACK SERVER SIDE ENDPOINTS
// ============================================

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "KhetNet National Platform APIs Operational" });
});

// 2. Chat / Ask KhetNet AI Assistant Endpoint
app.post("/api/ask-khetnet", async (req, res) => {
  const { messages, userRole, location, language } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  const ai = getAiClient();
  if (!ai) {
    // Elegant offline fallback for sandbox / demo modes when keys are not set up yet
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    return res.json({
      text: `Hello! KhetNet AI falls back securely in demo mode. You asked about: "${lastUserMsg}". We recommend connecting your official GEMINI_API_KEY in Settings > Secrets to unlock live, multilingual AI advisories of national caliber.`
    });
  }

  try {
    // Map roles & locations to contextualise answers beautifully
    const promptContext = `You are dynamic, brilliant executive KhetNet AI Agri-advisor, part of a Startup India initiative.
Your goal is to assist Indian farmers with actual technical wisdom, solutions, crop metrics, pricing advice, transport logistics, and state subsidies.
Role of User: ${userRole || "Indian Farmer/Buyer"}
Region/District: ${location?.region || "N/A"}, State: ${location?.state || "N/A"}
Selected Language: ${language || "en"}
Instructions: Respond in a high-quality human tone, and explicitly focus ONLY on agriculture, plant safety, market operations, KhetNet options, and farmer welfare. Keep responses crisp, scannable with bullet points, and positive.`;

    // Package conversational history for the model
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Insert context injection at the front of the call
    contents.unshift({
      role: "user",
      parts: [{ text: `${promptContext}. Hello, please acknowledge these constraints and introduce KhetNet's core capabilities in the requested language.` }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
    });

    res.json({ text: response.text || "No response generated." });
  } catch (error: any) {
    console.error("Error in ask-khetnet endpoint:", error);
    res.status(500).json({ error: "AI reasoning failed: " + error.message });
  }
});

// 3. Multilingual Live Translation Endpoint
app.post("/api/translate-message", async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing text or targetLang parameters." });
  }

  const ai = getAiClient();
  if (!ai) {
    return res.json({ text: `[Demo Translation]: ${text}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Translate the following agricultural trader message precisely to ${targetLang}. 
Keep slang, numeric pricing/quantities (like 500kg, ₹40/kg) exactly as-is. Make sure it sounds natural to local Indian farmers who speak this language natively.
Return ONLY the final translated text and absolutely nothing else.
Message: ${text}`
    });

    res.json({ text: (response.text || "").trim() });
  } catch (err: any) {
    console.error("Translation api error:", err);
    res.json({ text: text }); // Fallback to raw text rather than breaking transaction
  }
});

// 4. Multimodal AI Crop Leaf Disease Scanner
app.post("/api/scan-crop", async (req, res) => {
  const { imageBase64, language } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing image data" });
  }

  const ai = getAiClient();
  if (!ai) {
    // Simulated diagnostic results when Gemini API is not yet loaded in sandbox
    return res.json({
      cropStatus: "Wheat Rust (Simulated Report)",
      infectionScore: "Moderate (45%)",
      details: "Simulated crop leaf disease diagnostics for Wheat Rust. To unlock live cloud scanning powered by real-time computer vision, please define your GEMINI_API_KEY in settings.",
      organicCure: "Spray neem oil solution (5ml/L) early in the morning. Dust crop with sulfur powder if spore levels are high.",
      chemicalCure: "Apply Propiconazole 25% EC at 200ml per acre if outbreak spreads across fields.",
      localizedAdvice: "Avoid excess nitrogen fertilizer, and ensure drainage channels in the field are fully cleared before monsoon."
    });
  }

  try {
    // Remove data:image/*;base64 header from the base64 string if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this agricultural crop/leaf image. Produce a comprehensive diagnosis of the plant's health.
Locate any pests, fungal, bacterial, or environmental leaf diseases.
Format the output EXACTLY as a JSON object with the following fields:
{
  "cropStatus": "Short name of Identified Crop + disease status (e.g., Basmati Rice - Leaf Blast, Healthy Cotton)",
  "infectionScore": "Estimated infection percentage (e.g., Healthy, 15% Mild, 60% Critical)",
  "details": "Explanation of the physical symptoms visible and potential causes in simple terms",
  "organicCure": "Bullet point remedies using organic/affordable ingredients accessible to a local farmer",
  "chemicalCure": "Actionable standard fungicide/insecticide recommended as per Indian Agri ministry guidelines with dosage",
  "localizedAdvice": "Best practices for irrigation, state subsidy details if crop crop fails, and safety directions"
}
Provide all description/advisory texts directly in the language "${language || "en"}". Ensure valid JSON structure with double quotes. Do not wrap in markdown \`\`\`json blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64
              }
            }
          ]
        }
      ]
    });

    const responseText = (response.text || "").trim();
    
    // Safety check: parse out JSON markdown block wrapper if Gemini wraps it
    let cleanJson = responseText;
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/```\s*/, "").replace(/\s*```$/, "");
    }

    const parsedResult = JSON.parse(cleanJson);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Disease Scanner failure:", error);
    res.status(500).json({ error: "Failed to scan disease leaf. Error details: " + error.message });
  }
});

// ============================================
// VITE DEV SERVER AND STATIC ASSETS INTEGRATION
// ============================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KhetNet] Server started in ${process.env.NODE_ENV || "development"} mode`);
    console.log(`[KhetNet] Listening live at: http://localhost:${PORT}`);
  });
}

startServer();
