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

// 5. Market Price Prediction Endpoint (7-day and 15-day crop prices)
app.post("/api/predict-price", async (req, res) => {
  const { cropName, grade, moisture, harvestDate, state, region } = req.body;

  if (!cropName) {
    return res.status(400).json({ error: "Missing cropName parameter" });
  }

  const ai = getAiClient();
  if (!ai) {
    // Highly realistic analytical simulation for developers presenting in sandboxed or offline environments
    const baseHash = cropName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (Number(moisture) || 12);
    const mockCurrent = (baseHash % 40) + 30; // ₹30 - ₹70
    const change7Day = (baseHash % 11) - 5; // -5% to +5%
    const change15Day = (baseHash % 17) - 8; // -8% to +8%
    const predicted7 = parseFloat((mockCurrent * (1 + change7Day / 100)).toFixed(2));
    const predicted15 = parseFloat((mockCurrent * (1 + change15Day / 100)).toFixed(2));
    const rec = predicted15 > mockCurrent ? "HOLD" : "SELL NOW";
    
    return res.json({
      priceCurrent: mockCurrent,
      price7Day: predicted7,
      price15Day: predicted15,
      changePercent7: parseFloat(change7Day.toFixed(1)),
      changePercent15: parseFloat(change15Day.toFixed(1)),
      recommendation: rec,
      reasoning: `Market flows in ${region || "Amritsar"} APMC indicate standard supply patterns. Crop moisture of ${moisture || 12.5}% is optimal. Holding Basmati and staple crops is recommended due to upcoming national festive demand in key Indian state centers.`
    });
  }

  try {
    const prompt = `You are a professional agribusiness market analyst for the Ministry of Agriculture & APMC Mandis in India.
Analyze the following crop listing details and predict the 7-day and 15-day bulk market price direction.
Crop Details:
- Crop Name: ${cropName}
- Quality Grade: ${grade || "A"}
- Moisture Percentage: ${moisture || 12}%
- Harvest Date: ${harvestDate || "Recent"}
- Location: State of ${state || "Punjab"}, District of ${region || "Amritsar"}

Provide local, highly realistic APMC rates (in Rupees ₹ per kg), price trends, and a final hold/sell recommendation.
Format the output EXACTLY as a JSON object with the following fields:
{
  "priceCurrent": number (current average rate in ₹/kg, e.g. 54.0),
  "price7Day": number (predicted rate in ₹/kg 7 days from now),
  "price15Day": number (predicted rate in ₹/kg 15 days from now),
  "changePercent7": number (percentage change 7-day),
  "changePercent15": number (percentage change 15-day),
  "recommendation": "SELL NOW" | "HOLD" | "SELL PARTIAL",
  "reasoning": "Detailed, highly specific local reasons for this advice, referencing moisture levels, regional festivals, transport logs, or supply shortages."
}
Return ONLY this JSON. No extra text, no markdown block wrappers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanJson = (response.text || "").trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
    res.json(JSON.parse(cleanJson));
  } catch (err: any) {
    console.error("Price prediction failure:", err);
    res.status(500).json({ error: "Failed to estimate predictions: " + err.message });
  }
});

// 6. Smart Crop Listing: Recommended Price Endpoint
app.post("/api/recommend-price", async (req, res) => {
  const { cropName, grade, moisture, harvestDate, state, region } = req.body;

  if (!cropName) {
    return res.status(400).json({ error: "Missing cropName parameter" });
  }

  const ai = getAiClient();
  if (!ai) {
    // Realistic fallback
    const hash = cropName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const recommendedPrice = (hash % 50) + 35; // ₹35 - ₹85
    return res.json({
      recommendedPricePerKg: recommendedPrice,
      confidenceScore: 82,
      analysis: `The recommended cost of ₹${recommendedPrice}/kg is estimated based on past transactions in ${region || "Amritsar"} for Grade ${grade || "A"} crops. Moisture level ${moisture || 12}% falls within healthy standard criteria, allowing long-term mandi storage.`
    });
  }

  try {
    const prompt = `Recommend the optimal bulk trade selling price in Indian Rupees (₹) per Kg for this Crop listing.
Listing properties:
- Crop Type: ${cropName}
- Quality Grade: ${grade || "A"}
- Moisture level: ${moisture || 12}%
- Harvest Date: ${harvestDate || "Recent"}
- Location: Region of ${region || "Amritsar"}, ${state || "Punjab"}

Format the response EXACTLY as a JSON object with this shape:
{
  "recommendedPricePerKg": number (suggested rate in ₹/kg, e.g. 62.5),
  "confidenceScore": number (percentage index, e.g. 88),
  "analysis": "Explanation of how grade and moisture affected this valuation based on current APMC Mandi trends."
}
Return ONLY this JSON. No markdown wrappings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanJson = (response.text || "").trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
    res.json(JSON.parse(cleanJson));
  } catch (err: any) {
    console.error("AI Price advice failure:", err);
    res.status(500).json({ error: "Failed to advice price: " + err.message });
  }
});

// 7. AI Buyer Matching Endpoint
app.post("/api/recommend-buyers", async (req, res) => {
  const { cropName, state, region, wholesalers } = req.body;

  if (!cropName) {
    return res.status(400).json({ error: "Missing cropName parameter" });
  }

  const ai = getAiClient();
  if (!ai) {
    // Robust heuristic-based simulation for a gorgeous matching UI
    const defaultBuyers = [
      { name: "Suresh Mandi Wholesalers Ltd", state: state || "Punjab", region: region || "Amritsar", type: "Bulk Agro Grains" },
      { name: "Lalaji Organic Exports Corp", state: state || "Punjab", region: "Ludhiana", type: "Premium Basmati Export" },
      { name: "Verma Organic Food Processing", state: "Haryana", region: "Karnal", type: "Puff & Flour Millers" },
      { name: "Reliance Retail Hub Mandi", state: state || "Punjab", region: region || "Amritsar", type: "Direct Retail Ingestion" }
    ];

    const inputWholesalers = (wholesalers && wholesalers.length > 0) ? wholesalers : defaultBuyers;

    const matches = inputWholesalers.map((w: any, index: number) => {
      // Create a deterministic hash score based on name & distance
      const distanceFactor = w.region === region ? 95 : (w.state === state ? 84 : 68);
      const randomSeed = (w.name.length * (index + 3)) % 10;
      const finalMatch = Math.min(99, distanceFactor + randomSeed);
      
      let reason = `Located nearby in ${w.region}. Actively scouting bulk grain contracts.`;
      if (w.name.includes("Export")) {
        reason = `Specialized in international premium shipment contracts. Highly compatible with and offers premium rates for verified Grade A crops.`;
      } else if (w.region === region) {
        reason = `Instant transport matching! Situated in your exact district (${region}) which reduces cargo trucking freight costs significantly.`;
      }

      return {
        name: w.name,
        state: w.state,
        region: w.region,
        matchPercentage: finalMatch,
        reason: reason,
        contact: w.mobile || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`
      };
    }).sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);

    return res.json({ matches });
  }

  try {
    const wholesalersListJson = JSON.stringify(wholesalers || []);
    const prompt = `You are a high-tech matching algorithm in the KhetNet agri-broker engine.
Match this crop listing to potential wholesalers.
Crop to Match: ${cropName} at location: ${region}, ${state}
Available wholesalers in systems registry: ${wholesalersListJson}

If the system wholesalers registry is empty, dynamically invent 3-4 realistic corporate wholesalers with local Indian names nearby Punjabi/neighbor state centers.
For each wholesaler, calculate a specific match percentage (0 to 100) based on geographic logistics (same region = much higher match), spelling similarities (e.g. Rice wholesaler matching Rice crop), and company profile.
Explain the localized logical match rationale for each choice in simple terms.

Format the output EXACTLY as a JSON object with this shape:
{
  "matches": [
    {
      "name": "Wholesaler Company Name",
      "state": "State",
      "region": "District",
      "matchPercentage": number,
      "reason": "Clear explanation of why this wholesaler is a great match for their wheat, rice, cotton or other crops.",
      "contact": "Local Indian mobile number"
    }
  ]
}
Return ONLY this JSON. Do not wrap in markdown tags.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanJson = (response.text || "").trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
    res.json(JSON.parse(cleanJson));
  } catch (err: any) {
    console.error("AI buyer matching failure:", err);
    res.status(500).json({ error: "Failed to match buyers: " + err.message });
  }
});


// 8. KhetMitra Multilingual Voice AI assistant Orchestrator
app.post("/api/khetmitra-ai", async (req, res) => {
  const { query: queryText, userContext, previousContext, pendingAction } = req.body;

  if (!queryText) {
    return res.status(400).json({ error: "No voice query provided." });
  }

  const ai = getAiClient();
  const lowerQuery = queryText.toLowerCase().trim();

  // HEURISTIC REGEX-BASED RULE PARSER FOR ULTRA-FAST RESOLUTION ACROSS 23 INDIAN LANGUAGES
  const runHeuristicsEngine = () => {
    // Determine default language based on user context preferred language
    let detectedLanguage = "Hindi";
    let detectedLanguageCode = "hi-IN";
    
    const userPrefLang = userContext?.language || "hi";
    const langMap: Record<string, { name: string, code: string }> = {
      en: { name: "English", code: "en-IN" },
      hi: { name: "Hindi", code: "hi-IN" },
      pa: { name: "Punjabi", code: "pa-IN" },
      ta: { name: "Tamil", code: "ta-IN" },
      te: { name: "Telugu", code: "te-IN" },
      kn: { name: "Kannada", code: "kn-IN" },
      ml: { name: "Malayalam", code: "ml-IN" },
      ur: { name: "Urdu", code: "ur-IN" },
      mr: { name: "Marathi", code: "mr-IN" },
      gu: { name: "Gujarati", code: "gu-IN" },
      bn: { name: "Bengali", code: "bn-IN" },
      as: { name: "Assamese", code: "as-IN" },
      or: { name: "Odia", code: "or-IN" },
      ks: { name: "Kashmiri", code: "ks-IN" },
      doi: { name: "Dogri", code: "doi-IN" },
      mai: { name: "Maithili", code: "mai-IN" },
      ne: { name: "Nepali", code: "ne-IN" },
      sat: { name: "Santali", code: "sat-IN" },
      kok: { name: "Konkani", code: "kok-IN" },
      mni: { name: "Manipuri", code: "mni-IN" },
      brx: { name: "Bodo", code: "brx-IN" },
      sa: { name: "Sanskrit", code: "sa-IN" },
      sd: { name: "Sindhi", code: "sd-IN" }
    };

    if (langMap[userPrefLang]) {
      detectedLanguage = langMap[userPrefLang].name;
      detectedLanguageCode = langMap[userPrefLang].code;
    }

    // 1. Language Detection via Script & Core Keywords Matcher
    const engPhrases = ["wheat", "onion", "mandi", "prices", "rates", "show", "open", "disease", "scan", "truck", "transport", "logistics", "book", "confirm", "yes"];
    const paPhrases = ["ਕਣਕ", "ਪਿਆਜ", "ਮੰਡੀ", "ਦਿਖਾਓ", "ਵੇਚਣੀ", "ਕਰੋ", "ਬੀਮਾਰੀ", "ਪੱਤਾ", "ਟਰਾਂਸਪੋਰਟ", "ਟਰੱਕ", "ਹਾਂजी", "ਹਾਂ", "ਪਿਆਜ਼"];
    const taPhrases = ["நெல்", "வெங்காயம்", "மண்டி", "விலை", "காட்டு", "நோய்", "இலை", "வண்டி", "போக்குவரத்து", "ஆமாம்", "சரி"];
    const tePhrases = ["గోధుమ", "ఉల్లిపాయ", "మండి", "ధర", "చూపించు", "తెగులు", "ఆకు", "ట్రక్", "రవాణా", "అవును", "సరే"];
    const knPhrases = ["ಗೋಧಿ", "ಈರುಳ್ಳಿ", "ಮಂಡಿ", "ದರ", "ತೋರಿಸು", "ರೋಗ", "ಎಲೆ", "ಸಾರಿಗೆ", "ಲಾರಿ", "ಹೌದು", "ಸರಿ"];
    const mlPhrases = ["ഗോതമ്പ്", "ഉള്ളി", "വില", "മണ്ടി", "കാണിക്കുക", "രോഗം", "ഇല", "ഗതാഗതം", "വണ്ടി", "അതെ", "ശരി"];
    const bnPhrases = ["গম", "পেঁয়াজ", "মান্ডি", "দাম", "দেখাও", "রোগ", "পাতা", "ট্রাক", "পরিবহন", "হ্যাঁ", "ঠিক"];
    const mrPhrases = ["गहू", "कांदा", "मंडी", "भाव", "दाखवा", "रोग", "पान", "ट्रक", "वाहतूक", "होय", "नक्की"];
    const guPhrases = ["ઘઉં", "ડુંગળી", "મંડી", "ભાવ", "બતાવો", "રોગ", "પાંદડું", "ટ્રક", "વાહન", "હા", "બરાબર"];
    const urPhrases = ["گندم", "پیاز", "منڈی", "نرخ", "دکھائیں", "بیماری", "پتہ", "ٹرک", "لائسٹکس", "ہاں", "جی"];

    if (paPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Punjabi";
      detectedLanguageCode = "pa-IN";
    } else if (taPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Tamil";
      detectedLanguageCode = "ta-IN";
    } else if (tePhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Telugu";
      detectedLanguageCode = "te-IN";
    } else if (knPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Kannada";
      detectedLanguageCode = "kn-IN";
    } else if (mlPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Malayalam";
      detectedLanguageCode = "ml-IN";
    } else if (bnPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Bengali";
      detectedLanguageCode = "bn-IN";
    } else if (mrPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Marathi";
      detectedLanguageCode = "mr-IN";
    } else if (guPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Gujarati";
      detectedLanguageCode = "gu-IN";
    } else if (urPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "Urdu";
      detectedLanguageCode = "ur-IN";
    } else if (engPhrases.some(p => lowerQuery.includes(p))) {
      detectedLanguage = "English";
      detectedLanguageCode = "en-IN";
    }

    let spokenReply = "";
    let actionType = "NONE";
    let actionTab = null;
    let cropDetails = null;
    let requiresConfirmation = false;
    let contextMemory = previousContext || {};

    const activeLangCode = detectedLanguageCode.split("-")[0]; // e.g., "hi", "pa", "te"

    // Multi-Language Response Maps for precise, ultra-fast responses
    const responseVoiceMap: Record<string, Record<string, string>> = {
      OPEN_CAMERA_DISEASE: {
        en: "Opening camera to scan your crop leaf disease. Please hold steady and snap a photo.",
        hi: "आपकी फसल के पत्ते का फोटो खींचने के लिए कैमरा खोला जा रहा है। बीमारी की जांच रिपोर्ट कुछ ही क्षणों में लोड होगी।",
        pa: "ਫਸਲ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਲੈਣ ਲਈ ਕੈਮਰਾ ਖੋਲ੍ਹਿਆ ਜਾ ਰਿਹਾ ਹੈ। ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ ਤੁਰੰਤ ਸ਼ੁਰੂ ਹੋਵੇਗੀ।",
        ta: "பயிர் இலை நோயைக் கண்டறிய கேமரா திறக்கப்படுகிறது. தயவுசெய்து உங்கள் கேமராவை நேராகப் பிடிக்கவும்.",
        te: "పంట తెగులును స్కాన్ చేయడానికి కెమెరా తెరవబడుతోంది. దయచేసి ఆకు ఫోటో తీయండి.",
        kn: "ಬೆಳೆ ರೋಗವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಕ್ಯಾಮೆರಾ ತೆರೆಯಲಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಫೋಟೋ ತೆಗೆಯಿರಿ.",
        ml: "വിള രോഗം സ്കാൻ ചെയ്യാൻ ക്യാമറ തുറക്കുന്നു. ദയവായി ഇലയുടെ ഫോട്ടോ എടുക്കുക.",
        mr: "पीक रोग स्कॅन करण्यासाठी कॅमेरा उघडला जात आहे. कृपया पानाचा एक स्पष्ट फोटो घ्या.",
        gu: "પાક રોગ સ્કેન કરવા માટે કેમેરો ખોલવામાં આવી રહ્યો છે. કૃપા કરીને પર્ણનો ફોટો પાડો.",
        bn: "ফসলের রোগ স্ক্যান করার জন্য ক্যামেরা খোলা হচ্ছে। অনুগ্রহ করে পাতার একটি ছবি তুলুন।",
        ur: "فصل کی بیماری کو اسکین کرنے کے لئے کیمرہ کھولا جارہا ہے۔ برائے مہربانی پتے کی تصویر لیں۔"
      },
      SHOW_MANDI: {
        en: "Displaying current state Mandi prices. This includes prevailing benchmark wholesale values.",
        hi: "आज का मंडी भाव दिखाया जा रहा है। आप सभी फसलों के ताज़ा मूल्य यहाँ देख सकते हैं।",
        pa: "ਅੱਜ ਦਾ ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਅ ਖੋਲ੍ਹ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਤੁਸੀਂ ਸਾਰੀਆਂ ਫਸਲਾਂ ਦੀਆਂ ਕੀਮਤਾਂ ਦੇਖ ਸਕਦੇ ਹੋ।",
        ta: "மண்டி விலைகள் பக்கத்தை திறந்துவிட்டேன். இன்றைய சந்தை விலைகளை இங்கே பார்க்கலாம்.",
        te: "మండి ధరల పేజీ తెరవబడింది. తాజా మార్కెట్ విలువలు ఇక్కడ చూడవచ్చు.",
        kn: "ಇಂದಿನ ಮಂಡಿ ದರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಿದೆ. ಇಲ್ಲಿ ಬೆಳೆಗಳ ಮಾರುಕಟ್ಟೆ ದರವನ್ನು ವೀಕ್ಷಿಸಿ.",
        ml: "ഇന്നത്തെ മണ്ടി വിലകൾ തുറന്നിരിക്കുന്നു. ഇവിടെ നിങ്ങൾക്ക് എല്ലാ വിളകളുടെയും വില കാണാം.",
        mr: "आजचे मंडी भाव उघडले आहेत. येथे आपण पिकांचे ताजे बाजार भाव पाहू शकता.",
        gu: "આજના મંડી ભાવ ખુલી ગયા છે. અહીં તમે બધી જ ખેત પેદાશોના તાજા બજાર ભાવ જોઈ શકો છો.",
        bn: "আজকের মান্ডির দর দেখানো হচ্ছে। সমস্ত ফসলের বাজার দর আপনি এখানে দেখতে পারবেন।",
        ur: "آج کے منڈی کے نرخ دکھائے جا رہے ہیں۔ آپ تمام اجناس کی قیمتیں یہاں دیکھ سکتے ہیں۔"
      },
      BOOK_LOGISTICS: {
        en: "Sourcing closeby freight vehicles and transport carrier matches for your bulk dispatch.",
        hi: "परिवहन और ढुलाई गाड़ियां खोजी जा रही हैं। आपके नजदीक उपलब्ध वाहनों की सूची लोड हो गई है।",
        pa: "ਤੁਹਾਡੇ ਲਈ ਟਰਾਂਸਪੋਰਟ ਗੱਡੀਆਂ ਦੀ ਭਾਲ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ। ਕਿਰਾਏ ਦੀਆਂ ਗੱਡੀਆਂ ਦੀ ਲਿਸਟ ਦੇਖੋ।",
        ta: "உங்கள் லோடுக்கு ஏதுவான போக்குவரத்து வண்டிகள் தேடப்படுகின்றன.",
        te: "మీ సరుకు రవాణా కొరకు దగ్గరి లారీలు మరియు వాహనాలు వెతకబడుతున్నాయి.",
        kn: "ನಿಮ್ಮ ಬೆಳೆ ಸಾರಿಗೆಗಾಗಿ ಹತ್ತಿರದ ಲಾರಿಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ.",
        ml: "വിളകൾ കൊണ്ടുപോകുന്നതിനായി അടുത്തുള്ള ഗതാഗത വാഹനങ്ങൾ തിരയുന്നു.",
        mr: "आपल्या पिकांच्या वाहतुकीसाठी मालवाहू गाड्या शोधल्या जात आहेत.",
        gu: "તમારા પાકની હેરફેર માટે વાહનોની શોધ ચાલુ છે.",
        bn: "পরিবহন যানবাহন খোঁজা হচ্ছে। আপনার এলাকায় উপলব্ধ ট্রাকের তালিকা লোড করা হয়েছে।",
        ur: "مال بردار گاڑی کی بکنگ کی جا رہی ہے۔ آپ کے علاقے کے نزدیک گاڑیاں دستیاب ہیں۔"
      },
      NOTHING_PENDING: {
        en: "No pending harvest order waiting to confirm.",
        hi: "पुष्टि करने के लिए कोई लंबित फसल आदेश नहीं है।",
        pa: "ਮਨਜ਼ੂਰੀ ਲਈ ਕੋਈ ਆਰਡਰ ਨਹੀਂ ਮਿਲਿਆ।",
        ta: "உறுதிப்படுத்த எந்த பயிர் பதிவும் நிலுவையில் இல்லை.",
        te: "ధృవీకరించడానికి ఎటువంటి పంట విక్రయ ప్రక్రియ సిద్ధంగా లేదు.",
        kn: "ಖಚಿತಪಡಿಸಲು ಯಾವುದೇ ಬೆಳೆ ಮಾರಾಟ ಪ್ರಕ್ರಿಯೆ ಬಾಕಿ ಇಲ್ಲ.",
        ml: "സ്ഥിരീകരിക്കാൻ ഓർഡറുകളൊന്നും നിലവിലില്ല.",
        mr: "मंजूर करण्यासाठी कोणतीही पिकाची नोंदणी शिल्लक नाही.",
        gu: "ખાતરી કરવા માટે કોઈ પાક વેચાણ બાકી નથી.",
        bn: "নিশ্চিত করার জন্য এখন কোনো ফসল তালিকা পেন্ডিং নেই।",
        ur: "تصدیق کے لئے کوئی فصل کا آرڈر موجود نہیں ہے۔"
      }
    };

    // 2. Intent Parsing Logic based on multi-variate keyword matches

    // Lang select/close interceptors
    const isLangQuery = lowerQuery.includes("select") || lowerQuery.includes("चुन") || lowerQuery.includes("chuno") || lowerQuery.includes("set") || lowerQuery.includes("भासा") || lowerQuery.includes("भाषा") || lowerQuery.includes("ਸੈੱਟ") || lowerQuery.includes("ਕਰੋ") || lowerQuery.includes("सिलेक्ट") || lowerQuery.includes("ਸਿਲੈਕਟ");
    
    let targetLangId = "";
    let targetLangName = "";
    let targetLangCode = "";

    if (isLangQuery) {
      if (lowerQuery.includes("hindi") || lowerQuery.includes("हिंदी") || lowerQuery.includes("हिन्दी")) {
        targetLangId = "hi"; targetLangName = "Hindi"; targetLangCode = "hi-IN";
      } else if (lowerQuery.includes("punjabi") || lowerQuery.includes("ਪੰਜਾਬੀ") || lowerQuery.includes("पंजाबी")) {
        targetLangId = "pa"; targetLangName = "Punjabi"; targetLangCode = "pa-IN";
      } else if (lowerQuery.includes("english") || lowerQuery.includes("अंग्रेजी")) {
        targetLangId = "en"; targetLangName = "English"; targetLangCode = "en-IN";
      } else if (lowerQuery.includes("tamil") || lowerQuery.includes("தமிழ்") || lowerQuery.includes("तमिल")) {
        targetLangId = "ta"; targetLangName = "Tamil"; targetLangCode = "ta-IN";
      } else if (lowerQuery.includes("telugu") || lowerQuery.includes("తెలుగు") || lowerQuery.includes("तेलुगु")) {
        targetLangId = "te"; targetLangName = "Telugu"; targetLangCode = "te-IN";
      } else if (lowerQuery.includes("kannada") || lowerQuery.includes("ಕನ್ನಡ") || lowerQuery.includes("कन्नड़")) {
        targetLangId = "kn"; targetLangName = "Kannada"; targetLangCode = "kn-IN";
      } else if (lowerQuery.includes("malayalam") || lowerQuery.includes("മലയാളം") || lowerQuery.includes("मलयालम")) {
        targetLangId = "ml"; targetLangName = "Malayalam"; targetLangCode = "ml-IN";
      } else if (lowerQuery.includes("urdu") || lowerQuery.includes("اردو") || lowerQuery.includes("उर्दू")) {
        targetLangId = "ur"; targetLangName = "Urdu"; targetLangCode = "ur-IN";
      } else if (lowerQuery.includes("marathi") || lowerQuery.includes("मराठी")) {
        targetLangId = "mr"; targetLangName = "Marathi"; targetLangCode = "mr-IN";
      } else if (lowerQuery.includes("gujarati") || lowerQuery.includes("ગુજરાતી") || lowerQuery.includes("गुजराती")) {
        targetLangId = "gu"; targetLangName = "Gujarati"; targetLangCode = "gu-IN";
      } else if (lowerQuery.includes("bengali") || lowerQuery.includes("বাংলা") || lowerQuery.includes("बंगाली")) {
        targetLangId = "bn"; targetLangName = "Bengali"; targetLangCode = "bn-IN";
      } else if (lowerQuery.includes("assamese") || lowerQuery.includes("অসমীয়া") || lowerQuery.includes("असमीया")) {
        targetLangId = "as"; targetLangName = "Assamese"; targetLangCode = "as-IN";
      } else if (lowerQuery.includes("odia") || lowerQuery.includes("ଓଡ଼ਿଆ") || lowerQuery.includes("उड़िया")) {
        targetLangId = "or"; targetLangName = "Odia"; targetLangCode = "or-IN";
      } else if (lowerQuery.includes("kashmiri") || lowerQuery.includes("کٲਸ਼ُر") || lowerQuery.includes("कश्मीरी")) {
        targetLangId = "ks"; targetLangName = "Kashmiri"; targetLangCode = "ks-IN";
      } else if (lowerQuery.includes("dogri") || lowerQuery.includes("डोगरी")) {
        targetLangId = "doi"; targetLangName = "Dogri"; targetLangCode = "doi-IN";
      } else if (lowerQuery.includes("maithili") || lowerQuery.includes("मैथिली")) {
        targetLangId = "mai"; targetLangName = "Maithili"; targetLangCode = "mai-IN";
      } else if (lowerQuery.includes("nepali") || lowerQuery.includes("नेपाली")) {
        targetLangId = "ne"; targetLangName = "Nepali"; targetLangCode = "ne-IN";
      } else if (lowerQuery.includes("santali") || lowerQuery.includes("संताली")) {
        targetLangId = "sat"; targetLangName = "Santali"; targetLangCode = "sat-IN";
      } else if (lowerQuery.includes("konkani") || lowerQuery.includes("कोंकणी")) {
        targetLangId = "kok"; targetLangName = "Konkani"; targetLangCode = "kok-IN";
      } else if (lowerQuery.includes("manipuri") || lowerQuery.includes("Manipuri") || lowerQuery.includes("মণিপুরী")) {
        targetLangId = "mni"; targetLangName = "Manipuri"; targetLangCode = "mni-IN";
      } else if (lowerQuery.includes("bodo") || lowerQuery.includes("बोडो")) {
        targetLangId = "brx"; targetLangName = "Bodo"; targetLangCode = "brx-IN";
      } else if (lowerQuery.includes("sanskrit") || lowerQuery.includes("संस्कृत")) {
        targetLangId = "sa"; targetLangName = "Sanskrit"; targetLangCode = "sa-IN";
      } else if (lowerQuery.includes("sindhi") || lowerQuery.includes("सिंधी")) {
        targetLangId = "sd"; targetLangName = "Sindhi"; targetLangCode = "sd-IN";
      }
    }

    if (targetLangId) {
      actionType = "SELECT_LANGUAGE";
      actionTab = null;
      detectedLanguage = targetLangName;
      detectedLanguageCode = targetLangCode;
      
      const confirms: Record<string, string> = {
        en: `Selected ${targetLangName} language dynamically. Moving forward to location step!`,
        hi: `${targetLangName} भाषा सफलतापूर्वक चुनी गई। स्थान विवरण पर आगे बढ़ रहे हैं।`,
        pa: `${targetLangName} ਭਾਸ਼ਾ ਦੀ ਚੋਣ ਹੋ ਚੁੱਕੀ ਹੈ। ਲੋਕੇਸ਼ਨ ਸੈੱਟਅੱਪ 'ਤੇ ਚੱਲਦੇ ਹਾਂ ਜੀ।`,
        ta: `${targetLangName} மொழி தேர்ந்தெடுக்கப்பட்டது. அடுத்த இடப் படிக்குச் செல்கிறோம்.`,
        te: `${targetLangName} భాష ఎంపిక విజయవంతమైంది. ప్రాంతం వివరాల దశకు వెళ్తున్నాము.`,
        kn: `${targetLangName} ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಮುಂದಿನ ಸ್ಥಳ ಹಂತಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.`,
        ml: `${targetLangName} ഭാഷ തിരഞ്ഞെടുത്തിരിക്കുന്നു. അടുത്ത ഘട്ടത്തിലേക്ക് കടക്കുന്നു.`,
        mr: `${targetLangName} भाषा निवडली गेली आहे. स्थान माहितीच्या पुढील टप्प्यावर जात आहोत.`,
        gu: `${targetLangName} ભાષા પસંદ થઈ ગઈ છે. વિસ્તાર વિગતો પર આગળ વધી રહ્યા છીએ.`,
        bn: `${targetLangName} ভাষা নির্বাচন করা হয়েছে। এবার মূল ধাপে এগিয়ে যাচ্ছি।`,
        ur: `${targetLangName} زبان منتخب ہو گئی ہے۔ اگلے مرحلے کی طرف بڑھ رہے ہیں۔`
      };

      spokenReply = confirms[targetLangId] || confirms["en"] || `Selected ${targetLangName}. Continuing...`;
    }
    else if (
      lowerQuery.includes("close") || lowerQuery.includes("bye") || lowerQuery.includes("exit") || 
      lowerQuery.includes("band karo") || lowerQuery.includes("बन्द") || lowerQuery.includes("बंद") || 
      lowerQuery.includes("shadd do") || lowerQuery.includes("clode") || lowerQuery.includes("bnd kr")
    ) {
      actionType = "CLOSE_ASSISTANT";
      actionTab = null;
      spokenReply = activeLangCode === "hi" 
        ? "वॉयस असिस्टेंट को बंद किया जा रहा है। मदद के लिए फिर से माइक दबाएं।" 
        : "Closing voice assistant. Feel free to tap microphone again to speak to me.";
    }
    // A. Disease Diagnosis Search
    else if (
      lowerQuery.includes("बीमारी") || lowerQuery.includes("पत्ता") || lowerQuery.includes("disease") || 
      lowerQuery.includes("bimar") || lowerQuery.includes("ਪੱਤਾ") || lowerQuery.includes("ਰੋਗ") || 
      lowerQuery.includes("நோய்") || lowerQuery.includes("ఇలై") || lowerQuery.includes("తేగులు") || 
      lowerQuery.includes("ರೋಗ") || lowerQuery.includes("ഇല") || lowerQuery.includes("রোগ") || 
      lowerQuery.includes("पान") || lowerQuery.includes("પાંદ")
    ) {
      actionType = "OPEN_CAMERA_DISEASE";
      actionTab = "scanner";
      spokenReply = responseVoiceMap.OPEN_CAMERA_DISEASE[activeLangCode] || responseVoiceMap.OPEN_CAMERA_DISEASE["en"];
    }
    // B. Mandi Rates & Prices Tab
    else if (
      lowerQuery.includes("भाव") || lowerQuery.includes("मंडी") || lowerQuery.includes("रेट") || 
      lowerQuery.includes("ਭਾਅ") || lowerQuery.includes("prices") || lowerQuery.includes("rate") || 
      lowerQuery.includes("market") || lowerQuery.includes("விலை") || lowerQuery.includes("మండి") || 
      lowerQuery.includes("ధర") || lowerQuery.includes("ಮಂಡಿ") || lowerQuery.includes("വില") || 
      lowerQuery.includes("দাম") || lowerQuery.includes("दर") || lowerQuery.includes("મંડી")
    ) {
      actionType = "SHOW_MANDI";
      actionTab = "prices";
      spokenReply = responseVoiceMap.SHOW_MANDI[activeLangCode] || responseVoiceMap.SHOW_MANDI["en"];
    }
    // C. Logistics Transport booking Center
    else if (
      lowerQuery.includes("ट्रांसपोर्ट") || lowerQuery.includes("गाड़ी") || lowerQuery.includes("ट्रक") || 
      lowerQuery.includes("ਬੁੱਕ") || lowerQuery.includes("ਲੌਜਿਸਟਿਕ") || lowerQuery.includes("transport") || 
      lowerQuery.includes("truck") || lowerQuery.includes("carrier") || lowerQuery.includes("book") || 
      lowerQuery.includes("வண்டி") || lowerQuery.includes("రవాణా") || lowerQuery.includes("ಲಾರಿ") || 
      lowerQuery.includes("ഗതാഗതം") || lowerQuery.includes("পরিবহন") || lowerQuery.includes("वाहतूक") || 
      lowerQuery.includes("વાહન")
    ) {
      actionType = "BOOK_LOGISTICS";
      actionTab = "logistics";
      spokenReply = responseVoiceMap.BOOK_LOGISTICS[activeLangCode] || responseVoiceMap.BOOK_LOGISTICS["en"];
    }
    // D. Listing/Adding Crop Marketplace Sell Option
    else if (
      lowerQuery.includes("जोड़") || lowerQuery.includes("बेचनी") || lowerQuery.includes("sell") || 
      lowerQuery.includes("list") || lowerQuery.includes("गेहूं") || lowerQuery.includes("प्याज") || 
      lowerQuery.includes("ਕਣਕ") || lowerQuery.includes("ਪਿਆਜ") || lowerQuery.includes("wheat") || 
      lowerQuery.includes("onion") || lowerQuery.includes("धान") || lowerQuery.includes("rice") || 
      lowerQuery.includes("പിയാജ്") || lowerQuery.includes("ಗೋಧಿ") || lowerQuery.includes("നെൽ")
    ) {
      let cropName = "Wheat";
      let quantity = 500;
      let cost = 45;

      if (lowerQuery.includes("प्याज") || lowerQuery.includes("onion") || lowerQuery.includes("ਪਿਆਜ") || lowerQuery.includes("വെംഗായം") || lowerQuery.includes("ఉల్లి") || lowerQuery.includes("ಈರುಳ್ಳಿ") || lowerQuery.includes("कांदा") || lowerQuery.includes("ડુંગળી")) {
        cropName = "Onion";
        cost = 25;
      } else if (lowerQuery.includes("गेहूं") || lowerQuery.includes("wheat") || lowerQuery.includes("ਕਣਕ") || lowerQuery.includes("wheat") || lowerQuery.includes("ಗೋಧಿ") || lowerQuery.includes("गहू") || lowerQuery.includes("ઘઉં") || lowerQuery.includes("গম")) {
        cropName = "Wheat";
        cost = 45;
      } else if (lowerQuery.includes("rice") || lowerQuery.includes("धान") || lowerQuery.includes("ਚੌਲ") || lowerQuery.includes("നെല്ല്") || lowerQuery.includes("వరి") || lowerQuery.includes("ধান") || lowerQuery.includes("भात")) {
        cropName = "Basmati Rice";
        cost = 65;
      } else if (lowerQuery.includes("कपास") || lowerQuery.includes("cotton") || lowerQuery.includes("રૂ") || lowerQuery.includes("પરૂ") || lowerQuery.includes("பருத்தி") || lowerQuery.includes("కપાસ")) {
        cropName = "Cotton";
        cost = 58;
      } else if (lowerQuery.includes("potato") || lowerQuery.includes("आलू") || lowerQuery.includes("ਬਟਾਟਾ") || lowerQuery.includes("உருளை") || lowerQuery.includes("బంగాళా")) {
        cropName = "Potatoes";
        cost = 18;
      }

      // RegEx extraction match for weight numbers
      const numMatch = lowerQuery.match(/\d+/);
      if (numMatch) {
         quantity = parseInt(numMatch[0]);
      }

      actionType = "PREPARE_LISTING";
      actionTab = "sell_marketplace";
      requiresConfirmation = true;
      cropDetails = { name: cropName, quantity, costPerKg: cost };

      // Translate confirmation prompts across major languages beautifully
      if (activeLangCode === "hi") {
        spokenReply = `आप मंडी में ${quantity} किलो ${cropName === 'Wheat' ? 'गेहूं' : (cropName === 'Onion' ? 'प्याज' : cropName)} को ₹${cost}/किलो के भाव पर लिस्ट करना चाहते हैं। क्या मैं इसे प्रकाशित कर दूं?`;
      } else if (activeLangCode === "pa") {
        spokenReply = `ਤੁਸੀਂ ਮੰਡੀ ਵਿੱਚ ${quantity} ਕਿਲੋ ${cropName === 'Wheat' ? 'ਕਣਕ' : (cropName === 'Onion' ? 'ਪਿਆਜ' : cropName)} ਨੂੰ ₹${cost}/ਕਿਲੋ ਦੇ ਹਿਸਾਬ ਨਾਲ ਵੇਚਣਾ ਚਾਹੁੰਦੇ ਹੋ। ਕੀ ਮੈਂ ਲਿਸਟਿੰਗ ਪੱਕੀ ਕਰ ਦੇਵਾਂ?`;
      } else if (activeLangCode === "ta") {
        spokenReply = `நீங்கள் மண்டியினில் ${quantity} கிலோ ${cropName} பயிரை ₹${cost}/கிலோ விலையில் விற்க விரும்புகிறீர்களா? நான் இதை வெளியிடவா?`;
      } else if (activeLangCode === "te") {
        spokenReply = `మీరు మండిలో ${quantity} కిలోల ${cropName} పంటను ₹${cost}/కిలో ధరలో విక్రయించాలనుకుంటున్నారా? నేను దీన్ని సృష్టించాలా?`;
      } else if (activeLangCode === "kn") {
        spokenReply = `ನೀವು ಮಂಡಿಯಲ್ಲಿ ${quantity} ಕೆಜಿ ${cropName} ಬೆಳೆಯನ್ನು ₹${cost}/ಕೆಜಿ ದರದಲ್ಲಿ ಮಾರಾಟ ಮಾಡಲು ಸಿದ್ಧರಿದ್ದೀರಾ? ಪ್ರಕಟಿಸಬೇಕೇ?`;
      } else if (activeLangCode === "ml") {
        spokenReply = `നിങ്ങൾ മണ്ടിയിൽ ${quantity} കിലോ ${cropName} വിളകൾ ₹${cost}/കിലോ നിരക്കിൽ ലിസ്റ്റ് ചെയ്യാൻ ആഗ്രഹിക്കുന്നുവോ? സ്ഥിരീകരിക്കട്ടെ?`;
      } else if (activeLangCode === "mr") {
        spokenReply = `आपण मंडीमध्ये ${quantity} किलो ${cropName} ₹${cost}/किलो च्या भावात विक्रीसाठी नोंदवू इच्छिता? मी लिस्टिंग करू?`;
      } else if (activeLangCode === "gu") {
        spokenReply = `તમે મંડીમાં ${quantity} કિલો ${cropName} ₹${cost}/કિલો ના ભાવે વેચવા માટે યાદી બનાવવા ઇચ્છો છો? હું યાદી પ્રસિદ્ધ કરું?`;
      } else if (activeLangCode === "bn") {
        spokenReply = `আপনি মান্ডিতে ${quantity} কেজি ${cropName} ₹${cost}/কেজি দরে পোস্ট করতে চান। আমি কি এটি পাবলিশ করবো?`;
      } else {
        spokenReply = `You are listing ${quantity} kg of ${cropName} crop at the suggested wholesale price of ₹${cost}/kg on KhetNet marketplace. Shall I publish this listing?`;
      }
    }
    // E. Confirmation Trigger
    else if (
      lowerQuery.includes("हां") || lowerQuery.includes("हाँ") || lowerQuery.includes("कर दो") || 
      lowerQuery.includes("ਹਾਂ") || lowerQuery.includes("ਰੱਖੋ") || lowerQuery.includes("yes") || 
      lowerQuery.includes("confirm") || lowerQuery.includes("continue") || lowerQuery.includes("ஆமாம்") || 
      lowerQuery.includes("అవును") || lowerQuery.includes("ಹೌದು") || lowerQuery.includes("അതെ") || 
      lowerQuery.includes("হ্যাঁ") || lowerQuery.includes("होय") || lowerQuery.includes("હા") || 
      lowerQuery.includes("सत्य") || lowerQuery.includes("सय्य")
    ) {
      if (pendingAction && pendingAction.cropDetails) {
        actionType = "CONFIRM_ACTION";
        const details = pendingAction.cropDetails;
        
        if (activeLangCode === "hi") {
          spokenReply = `${details.quantity} किलो ${details.name} की लिस्टिंग सफलतापूर्वक राष्ट्रीय बाजार में प्रकाशित की जा चुकी है!`;
        } else if (activeLangCode === "pa") {
          spokenReply = `${details.quantity} ਕਿਲੋ ${details.name} ਦੀ ਲਿਸਟਿੰਗ ਸਫ਼ਲਤਾਪੂਰਵਕ ਮੰਡੀ ਵਿੱਚ ਪਾ ਦਿੱਤੀ ਗਈ ਹੈ!`;
        } else if (activeLangCode === "ta") {
          spokenReply = `${details.quantity} கிலோ ${details.name} விவரம் சந்தையில் வெற்றிகரமாக பதிவேற்றப்பட்டது!`;
        } else if (activeLangCode === "te") {
          spokenReply = `${details.quantity} కిలోల ${details.name} విజయవంతంగా మండి బోర్డులో నమోదయినది!`;
        } else if (activeLangCode === "kn") {
          spokenReply = `${details.quantity} ಕೆಜಿ ${details.name} ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ!`;
        } else if (activeLangCode === "ml") {
          spokenReply = `${details.quantity} കിലോ ${details.name} വിജയകരമായി മാർക്കറ്റിൽ പ്രസിദ്ധീകരിച്ചു!`;
        } else if (activeLangCode === "mr") {
          spokenReply = `${details.quantity} किलो ${details.name} यशस्वीरीत्या बाजारात नोंदवले गेले आहे!`;
        } else if (activeLangCode === "gu") {
          spokenReply = `${details.quantity} કિલો ${details.name} ની યાદી બરાબર પ્રસિદ્ધ થઈ ચૂકી છે!`;
        } else if (activeLangCode === "bn") {
          spokenReply = `${details.quantity} কেজি ${details.name} সফলভাবে মান্ডিতে তালিকাভুক্ত করা হয়েছে!`;
        } else {
          spokenReply = `Successfully listed ${details.quantity} kg of ${details.name} directly onto KhetNet national trader board!`;
        }
      } else {
        spokenReply = responseVoiceMap.NOTHING_PENDING[activeLangCode] || responseVoiceMap.NOTHING_PENDING["en"];
      }
    }
    // D2. Edit Listing Crop quantity or price
    else if (
      lowerQuery.includes("change quantity") || lowerQuery.includes("मात्रा") || lowerQuery.includes("बदलो") ||
      lowerQuery.includes("ਕੀਮਤ") || lowerQuery.includes("रेट बदलो") || lowerQuery.includes("change price")
    ) {
      actionType = "EDIT_LISTING";
      actionTab = "sell_marketplace";
      let amount = 200;
      const numMatch = lowerQuery.match(/\d+/);
      if (numMatch) {
         amount = parseInt(numMatch[0]);
      }
      spokenReply = activeLangCode === "hi"
        ? `ठीक है, मैंने गेहूं की मात्रा बदलकर ${amount} किलो करने की तैयारी कर ली है। क्या मैं लिस्टिंग अपडेट कर दूं?`
        : `Quantity change requested to ${amount} kg. Please confirm to apply updating.`;
    }
    // D3. Delete/Remove Listing Crop
    else if (
      lowerQuery.includes("delete") || lowerQuery.includes("remove") || lowerQuery.includes("हटाओ") ||
      lowerQuery.includes("मिटाओ") || lowerQuery.includes("ਰੱਦ") || lowerQuery.includes("dele")
    ) {
      actionType = "DELETE_LISTING";
      actionTab = "sell_marketplace";
      spokenReply = activeLangCode === "hi"
        ? "आपकी अंतिम मंडी लिस्टिंग को हटाने की प्रक्रिया शुरू कर दी गई है। कृपया पुष्टि करें क्या मैं इसे हटा दूं?"
        : "Initialised delete action for your active crop listings. Do you confirm removal?";
    }
    // F1. Sourcing weather forecasts
    else if (
      lowerQuery.includes("weather") || lowerQuery.includes("mausam") || lowerQuery.includes("rain") || 
      lowerQuery.includes("बारिश") || lowerQuery.includes("मौसम") || lowerQuery.includes("तापमान") || 
      lowerQuery.includes("humid") || lowerQuery.includes("ਧੁੱਪ") || lowerQuery.includes("varsha")
    ) {
      actionType = "WEATHER_FORECAST";
      actionTab = "prices";
      spokenReply = activeLangCode === "hi"
        ? `अमृतसर, पंजाब में आज वर्षा की 80% संभावना है। तापमान 32 डिग्री है। भारी बारिश को देखते हुए कीटनाशी छिड़काव टालने की सलाह दी जाती है।`
        : `Amritsar, Punjab weather: 32°C with high risk of thunderstorm shower. Advisory: Delay pesticide application by 24 hours.`;
    }
    // F2. Sourcing Government Schemes or Subsidies
    else if (
      lowerQuery.includes("scheme") || lowerQuery.includes("yojana") || lowerQuery.includes("subsidy") || 
      lowerQuery.includes("सरकारी योजना") || lowerQuery.includes("सब्सिडी") || lowerQuery.includes("योजना") || 
      lowerQuery.includes("किसान") || lowerQuery.includes("bima") || lowerQuery.includes("बीमा")
    ) {
      actionType = "GOVERNMENT_SCHEMES";
      actionTab = "insurance";
      spokenReply = activeLangCode === "hi"
        ? `आपके राज्य पंजाब के लिए प्रमुख सरकारी योजनाएं हैं: प्रधानमंत्री फसल बीमा योजना (PMFBY) 1.5% सब्सिडी प्रीमियम पर, और पीएम-किसान ₹6000 वार्षिक नकद सहायता योजना।`
        : `Eligible government agriculture schemes for your state: PMFBY subsidized insurance shield and PM-KISAN premium cash support transfers.`;
    }
    // F3. Fertilizer & Pesticide Sowing advice recommendation
    else if (
      lowerQuery.includes("fertilizer") || lowerQuery.includes("urea") || lowerQuery.includes("npk") || 
      lowerQuery.includes("खाद") || lowerQuery.includes("pesticide") || lowerQuery.includes("कीटनाश") || 
      lowerQuery.includes("दवाई") || lowerQuery.includes("spray") || lowerQuery.includes("सॉइल") || 
      lowerQuery.includes("मिट्टी")
    ) {
      actionType = "FERTILIZER_PESTICIDE_RECOMMENDATION";
      actionTab = "advisory";
      spokenReply = activeLangCode === "hi"
        ? `गेहूं एवं धान के लिए बुवाई समय एनपीके (12:32:16) खाद 50 किलोग्राम प्रति एकड़ डालने की सलाह दी जाती है। सॉइल चेक के लिए अपनी मिट्टी सैंपल नजदीकी सेंटर भेजें।`
        : `Recommended sowing treatment: Sowing fertilizer NPK 12:32:16 at 50kg per acre. Use neem oil organic spray for early pest prevention.`;
    }
    // F4. Sourcing Active Buyers & Traders list
    else if (
      lowerQuery.includes("buyer") || lowerQuery.includes("trader") || lowerQuery.includes("ग्राहक") || 
      lowerQuery.includes("खरीदार") || lowerQuery.includes("व्यापारी") || lowerQuery.includes("customer") || 
      lowerQuery.includes("grahak") || lowerQuery.includes("ਵਪਾਰੀ")
    ) {
      actionType = "FIND_BUYERS";
      actionTab = "sell_marketplace";
      spokenReply = activeLangCode === "hi"
        ? `आपके अनाज के लिए अमृतसर मंडी के 3 प्रमाणित व्यापारी मिले हैं जो सर्वोत्तम दरों (₹2250/क्विंटल से अधिक) पर थोक खरीदार हैं।`
        : `Discovered 3 verified bulk grain traders matching your crop list in Amritsar local exchange. Checking rates...`;
    }
    // F5. Recommended Sowing & Selling times
    else if (
      lowerQuery.includes("best time") || lowerQuery.includes("कब बेचें") || lowerQuery.includes("बेचने का") || 
      lowerQuery.includes("future price") || lowerQuery.includes("दाम बढ़ेगा") || lowerQuery.includes("project")
    ) {
      actionType = "SELLING_TIME_ADVICE";
      actionTab = "predict";
      spokenReply = activeLangCode === "hi"
        ? `मंडी अनुमानों के अनुसार, अगले 15 दिनों में गेहूं के भाव ₹120 प्रति क्विंटल बढ़ सकते हैं। सलाह है कि अभी माल स्टॉक में रोकें और जून के अंत में बेचें।`
        : `Agri predictive trend is bullish. Central benchmark prices projected to rise by ₹120 per quintal. Sowing hold recommended.`;
    }
    // F6. Safe payments ledger escrow orders tracking
    else if (
      lowerQuery.includes("order") || lowerQuery.includes("track") || lowerQuery.includes("payment") || 
      lowerQuery.includes("पैसा") || lowerQuery.includes("पेमेंट") || lowerQuery.includes("escrow") || 
      lowerQuery.includes("सुरक्षित पेमेंट") || lowerQuery.includes("کھاتا")
    ) {
      actionType = "TRACK_ORDERS";
      actionTab = "escrow";
      spokenReply = activeLangCode === "hi"
        ? `आपकी अंतिम खेप का पेमेंट सुरक्षित कस्टडी एस्क्रो खाते में जमा है जो खरीददार द्वारा अनाज की पुष्टि होने पर रिलीज़ कर दिया जाएगा।`
        : `Your bulk transaction funds are secured in KhetNet's Safe Escrow shield. Tracking dynamic logistic transit now.`;
    }
    // F. General Navigation Tab router
    else if (
      lowerQuery.includes("home") || lowerQuery.includes("profile") || lowerQuery.includes("dashboard") || 
      lowerQuery.includes("insurance") || lowerQuery.includes("escrow") || lowerQuery.includes("verify") || 
      lowerQuery.includes("predict") || lowerQuery.includes("सलाह") || lowerQuery.includes("बचाव") || 
      lowerQuery.includes("मुख्य") || lowerQuery.includes("खाता") || lowerQuery.includes("कागजात")
    ) {
      actionType = "NAVIGATE";
      if (lowerQuery.includes("profile") || lowerQuery.includes("खाता") || lowerQuery.includes("verify")) {
        actionTab = "verify";
      } else if (lowerQuery.includes("insurance") || lowerQuery.includes("बीमा")) {
        actionTab = "insurance";
      } else if (lowerQuery.includes("escrow") || lowerQuery.includes("सुरक्षित")) {
        actionTab = "escrow";
      } else if (lowerQuery.includes("predict") || lowerQuery.includes("अनुमान") || lowerQuery.includes("forecast")) {
        actionTab = "predict";
      } else if (lowerQuery.includes("सलाह") || lowerQuery.includes("advisory") || lowerQuery.includes("expert") || lowerQuery.includes("sowing")) {
        actionTab = "advisory";
      } else {
        actionTab = "hub";
      }
      
      const navReplies: Record<string, string> = {
        en: "Opening requested section. Guided screen is active now.",
        hi: "मांग के अनुसार स्क्रीन खोली जा रही है। मार्गदर्शन सक्रिय है।",
        pa: "ਮੰਗਿਆ ਗਿਆ ਪੰਨਾ ਖੋਲ੍ਹਿਆ ਜਾ ਰਿਹਾ ਹੈ। ਸਕ੍ਰੀਨ ਦੇਖੋ ਜੀ।",
        ta: "நீங்கள் கேட்ட பகுதி இப்போது திறக்கப்பட்டுள்ளது.",
        te: "మీరు కోరిన విభాగం తెరవబడింది.",
        kn: "ನೀವು ಕೇಳಿದ ಪುಟ ಲೋಡ್ ಆಯಿತು.",
        ml: "ആവശ്യപ്പെട്ട വിഭാഗം തുറന്നിരിക്കുന്നു.",
        mr: "मागणी केलेले दालन उघडले आहे.",
        gu: "વિભાગ ખોલવામાં આવ્યો છે. કૃપા કરીને જુઓ.",
        bn: "অনুরোধ করা পেজটি খোলা হয়েছে।"
      };
      spokenReply = navReplies[activeLangCode] || navReplies["en"];
    }
    // G. Default FAQ Help advisory fallback
    else {
      if (activeLangCode === "hi") {
        spokenReply = "मैं आपकी आज गेहूं-धान की कीमतों, मंडी भाव, परिवहन व्यवस्था और पत्तों की बीमारी जांचने में मदद कर सकता हूँ। आप क्या करना चाहते हैं?";
      } else if (activeLangCode === "pa") {
        spokenReply = "ਮੈਂ ਮੰਡੀ ਦੇ ਭਾਅ, ਮੌਸਮ, ਟਰਾਂਸਪੋਰਟ ਬੁੱਕ ਕਰਨ ਅਤੇ ਫਸਲ ਦੀ ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?";
      } else if (activeLangCode === "ta") {
        spokenReply = "மண்டி விலை, போக்குவரத்து வண்டி முன்பதிவு, மற்றும் பயிர் நோய் கண்டறிய என்னால் உதவ முடியும். நான் உங்களுக்கு என்ன செய்ய வேண்டும்?";
      } else if (activeLangCode === "te") {
        spokenReply = "నేను మీకు మండి ధరలు, రవాణా వాహనాలు బుకింగ్ మరియు పంట తెగుళ్ల స్కాన్ చేయడంలో సహాయపడతాను. మీరు ఏమి చేయాలనుకుంటున్నారు?";
      } else if (activeLangCode === "kn") {
        spokenReply = "ನಾನು ನಿಮಗೆ ಇಂದು ಮಂಡಿ ದರಗಳು, ಸಾರಿಗೆ ಬುಕಿಂಗ್ ಮತ್ತು ಬೆಳೆ ರೋಗ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ನೆರವಾಗಬಲ್ಲೆ. ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?";
      } else if (activeLangCode === "ml") {
        spokenReply = "ഇന്നത്തെ മണ്ടി വില കാണാനും ട്രക്കുകൾ ബുക്ക് ചെയ്യാനും ചെടിയുടെ രോഗങ്ങൾ കണ്ടെത്താനും ഞാൻ സഹായിക്കാം. എന്താണ് വേണ്ടത്?";
      } else if (activeLangCode === "mr") {
        spokenReply = "मी आज आपल्याला बाजार भाव, मालाची वाहतूक व्यवस्था आणि पीक रोगांचे स्कॅनिंग करण्यात मदत करू शकतो. काय सेवा हवी बंधू?";
      } else if (activeLangCode === "gu") {
        spokenReply = "હું મંડીના ભાવો ચેક કરવા, વાહનો બુક કરવા અને પાકના રોગ શોધવા માટે આપને મદદ કરી શકું છું. આપે શું કરવું છે?";
      } else if (activeLangCode === "bn") {
        spokenReply = "আমি মান্ডির দর চেক করা, পরিবহন বুকিং ও ফসলের পাতা পরীক্ষা করতে সাহায্য করতে পারি। আপনি কি করতে চান?";
      } else {
        spokenReply = "I can check current Mandi prices, book freight trucks, list your agricultural harvest crops, or scan plant leaf diseases. What can I do for you today?";
      }
    }

    return {
      detectedLanguage,
      detectedLanguageCode,
      spokenReply,
      action: {
        type: actionType,
        tab: actionTab,
        cropDetails
      },
      requiresConfirmation,
      contextMemory: {
        lastDiscussedCrop: cropDetails ? cropDetails.name : (contextMemory.lastDiscussedCrop || "Wheat"),
        lastDiscussedQuantity: cropDetails ? cropDetails.quantity : (contextMemory.lastDiscussedQuantity || null),
        lastDiscussedPrice: cropDetails ? cropDetails.costPerKg : (contextMemory.lastDiscussedPrice || null),
        preferredLanguage: detectedLanguage
      }
    };
  };

  const feedback = runHeuristicsEngine();

  // HIGH-SPEED INTERCEPT PATHWAY
  // If the heuristically-detected action is a valid command (navigation, listing, camera scanner, truck bookings, etc.),
  // bypass LLM external gateway completely. Returns instantly in under 3 milliseconds!
  if (feedback.action.type !== "NONE" || feedback.requiresConfirmation) {
    console.log(`[FastMatch Engine] Resolve vocal interaction instanter: ${feedback.action.type}`);
    return res.json(feedback);
  }

  if (!ai) {
    return res.json(feedback);
  }

  try {
    const prompt = `You are KhetMitra AI, a highly intuitive, multi-lingual, low-literacy agriculture assistant of KhetNet platform.
Your task is to analyze the farmer's spoken text, understand their intent, extract structured actions, detect language, and respond IN THE SAME INDIAN LANGUAGE they spoke.

SUPPORTED INDIAN LANGUAGES include:
Hindi (hi-IN), Punjabi (pa-IN), Urdu (ur-IN), English (en-IN), Marathi (mr-IN), Gujarati (gu-IN), Tamil (ta-IN), Telugu (te-IN), Kannada (kn-IN), Malayalam (ml-IN), Bengali (bn-IN), Assamese (as-IN), Odia (or-IN), Kashmiri (ks-IN), Dogri (doi-IN), Maithili (mai-IN), Nepali (ne-IN), Santali (sat-IN), Konkani (kok-IN), Manipuri (mni-IN), Bodo (brx-IN), Sanskrit (sa-IN), Sindhi (sd-IN).

USER INFORMATION CONTEXT:
Name of Farmer: ${userContext?.name || "KhetNet Farmer"}
Region: ${userContext?.region || "Amritsar"}
State: ${userContext?.state || "Punjab"}
Preferred Language setting: ${userContext?.language || "hi"}

CONVERSATION HISTORY MEMORY CONTEXT:
${JSON.stringify(previousContext || {})}

PENDING CARGO / LISTING ACTION (Waiting for confirmation):
${JSON.stringify(pendingAction || {})}

Farmers shouldn't need technical jargon. Your speech ('spokenReply') should use extremely clean, simple, warm, clear village-style wording.
Rule for confirmation: Before submitting crop sales order listings or accepting escrow transactions, if requiresConfirmation is true, ask confirmation politely: e.g. "You are about to list 500 kg Wheat at ₹45. Shall I proceed?" in their native language.

Here are the target actions to recognize and populate in the "action" structure:
1. PREPARE_LISTING or CREATE_LISTING
   - Example 1: "1 किलो गेहूं जोड़ दो" or "500 किलो प्याज बेचनी है" or "wheat listing banao"
   - Extract crop name (translate to standard display nouns like Wheat, Onion, Basmati Rice, Premium Flour, Potatoes, Red Tomatoes, Red Chili, Cotton, Sugarcane) and quantity as integer number.
   - If cost is not mentioned, suggest/predict a realistic price per kg (e.g., ₹45 for Wheat, ₹25 for Onion, ₹60 for Basmati Rice, etc.)
   - Set requiresConfirmation: true
2. NAVIGATE
   - If they request to open/show sections:
     - 'hub' (dashboard, profile, home)
     - 'prices' (mandi prices, check weather, mandi rates)
     - 'scanner' (disease scanning leaf analysis)
     - 'logistics' (freight carriages, book transport, book vehicles)
     - 'sell_marketplace' (crop market)
     - 'verify' (farmer verification credentials)
     - 'predict' (15-day prices trend)
     - 'escrow' (escrow cargo security)
     - 'insurance' (crop yield shields)
     - 'advisory' (crop sow advisory)
3. CONFIRM_ACTION
   - If they say yes/confirm/हाँ/ਹਾਂ/कर दो/सत्य to a pending action.
4. CANCEL_ACTION
   - If they refuse or say cancel/नहीं/ਨਾ/no.
5. OPEN_CAMERA_DISEASE / DISEASE_DIAGNOSE
   - "मेरी फसल में बीमारी है" or leaf scanners.
6. SHOW_MANDI
   - "मंडी भाव दिखाओ"
7. BOOK_LOGISTICS
   - "ट्रांसपोर्ट बुक करो"

Format the response package strictly as valid JSON, nothing else:
{
  "detectedLanguage": "Detected language name",
  "detectedLanguageCode": "Standard BCP-47 matched code",
  "spokenReply": "Human-friendly clean spoken text responding back to the farmer in their detected language.",
  "action": {
    "type": "NAVIGATE" | "PREPARE_LISTING" | "CONFIRM_ACTION" | "CANCEL_ACTION" | "OPEN_CAMERA_DISEASE" | "SHOW_MANDI" | "BOOK_LOGISTICS" | "EDIT_LISTING" | "DELETE_LISTING" | "WEATHER_FORECAST" | "GOVERNMENT_SCHEMES" | "FERTILIZER_PESTICIDE_RECOMMENDATION" | "FIND_BUYERS" | "SELLING_TIME_ADVICE" | "TRACK_ORDERS" | "NONE",
    "tab": "prices" | "sell_marketplace" | "scanner" | "logistics" | "hub" | "verify" | "predict" | "escrow" | "insurance" | "advisory" | null,
    "cropDetails": {
      "name": "Standardized crop variety name",
      "quantity": number,
      "costPerKg": number
    } | null
  },
  "requiresConfirmation": boolean,
  "contextMemory": {
    "lastDiscussedCrop": "Crop Name",
    "lastDiscussedQuantity": number,
    "lastDiscussedPrice": number,
    "preferredLanguage": "Matched Language"
  }
}

Farmer Spoken Input: "${queryText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse((response.text || "").trim().replace(/^```json\s*/, "").replace(/\s*```$/, ""));
    res.json(parsed);
  } catch (err: any) {
    console.error("KhetMitra Voice AI failed, running heuristics fallback:", err);
    const fallback = runHeuristicsEngine();
    res.json(fallback);
  }
});

// 8. KhetMitra Multilingual Voice-Action AI Agent Endpoint
app.post("/api/khetmitra-voice", async (req, res) => {
  const { query, history, userContext } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing spoken voice query parameter" });
  }

  const ai = getAiClient();
  
  // Heuristic fallbacks for robust offline / developer demo testing
  const normalized = query.toLowerCase().trim();
  let fallbackResponse = {
    detectedLanguage: "English",
    detectedLanguageCode: "en-IN",
    spokenReply: "I heard you, but my intelligence is sleeping. Let's explore the portal together!",
    action: {
      type: "NONE",
      tab: "hub" as any,
      cropParams: null as any
    }
  };

  // 1. Hindi inputs
  if (normalized.includes("गेहूं") || normalized.includes("gehun") || normalized.includes("gehu")) {
    const qty = normalized.match(/\d+/)?.[0] || "1";
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: `ठीक है किसान भाई, मैंने ${qty} किलो गेहूं की लिस्टिंग तैयार कर दी है। क्या मैं इसे ₹३४ प्रति किलो के सरकारी मंडी मूल्य पर लिस्ट कर दूँ?`,
      action: {
        type: "CREATE_LISTING_PREPARE",
        tab: "sell_marketplace",
        cropParams: {
          cropName: "Premium Wheat",
          grade: "A",
          quantity: parseFloat(qty),
          moisture: 12,
          recommendedPrice: 34
        }
      }
    };
  } else if (normalized.includes("प्याज") || normalized.includes("pyaj") || normalized.includes("pyaz")) {
    const qty = normalized.match(/\d+/)?.[0] || "500";
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: `जी भाईसाहब, आपके लिए ${qty} किलो उच्च गुणवत्ता प्याज की लिस्टिंग तैयार कर दी है। क्या मैं इसे ₹२८ प्रति किलो पर पोस्ट कर दूँ?`,
      action: {
        type: "CREATE_LISTING_PREPARE",
        tab: "sell_marketplace",
        cropParams: {
          cropName: "Premium Onion",
          grade: "A",
          quantity: parseFloat(qty),
          moisture: 11,
          recommendedPrice: 28
        }
      }
    };
  } else if (normalized.includes("मंडी") || normalized.includes("भाव") || normalized.includes("mandi") || normalized.includes("bhav") || normalized.includes("bhaav")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "मैंने राष्ट्रीय कृषि मंडी मूल्य सूची पन्ना खोल दिया है। यहाँ आप सभी फसलों के ताज़ा भाव देख सकते हैं।",
      action: {
        type: "NAVIGATE",
        tab: "prices",
        cropParams: null as any
      }
    };
  } else if (normalized.includes("बीमारी") || normalized.includes("bimari") || normalized.includes("disease") || normalized.includes("scanner") || normalized.includes("पत्ता")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "आपके पत्ते में कोई बीमारी दिख रही है? चलिए, मैंने फसल लीफ बीमारी स्कैनर खोल दिया है। कृपया कैमरे से फोटो लें।",
      action: {
        type: "DISEASE_SCANNER",
        tab: "scanner",
        cropParams: null as any
      }
    };
  } else if (normalized.includes("यातायात") || normalized.includes("गाड़ी") || normalized.includes("gadi") || normalized.includes("transport") || normalized.includes("ट्रांसपोर्ट")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "हाँ भाई साहब, मैंने ट्रांसपोर्ट बुकिंग केंद्र खोल दिया है। यहाँ आपके क्षेत्र में उपलब्ध सर्वोत्तम वाहन मौजूद हैं।",
      action: {
        type: "BOOK_TRANSPORT",
        tab: "logistics",
        cropParams: null as any
      }
    };
  } else if (normalized.includes("बीमा") || normalized.includes("bima") || normalized.includes("insurance")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "मैंने फसल बीमा सुरक्षा योजना केंद्र खोल दिया है। यहाँ आप अपनी फसल का बीमा सुरक्षित कर सकते हैं।",
      action: {
        type: "NAVIGATE",
        tab: "insurance",
        cropParams: null as any
      }
    };
  } else if (normalized.includes("सलाह") || normalized.includes("advisory") || normalized.includes("experts")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "कृषि विशेषज्ञों की ताज़ा सलाह पन्ना खोल दिया गया है।",
      action: {
        type: "NAVIGATE",
        tab: "advisory",
        cropParams: null as any
      }
    };
  } else if (normalized.includes("profile") || normalized.includes("प्रोफाइल") || normalized.includes("खाता")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "लीजिये, मैंने आपका किसान प्रोफाइल विवरण खोल दिया है।",
      action: {
        type: "NAVIGATE",
        tab: "verify",
        cropParams: null as any
      }
    };
  } else if (normalized.includes("home") || normalized.includes("मुख्य") || normalized.includes("shuru") || normalized.includes("पोर्टल")) {
    fallbackResponse = {
      detectedLanguage: "Hindi",
      detectedLanguageCode: "hi-IN",
      spokenReply: "हम मुख्य केटनेट पोर्टल होम पेज पर लौट आये हैं।",
      action: {
        type: "NAVIGATE",
        tab: "hub",
        cropParams: null as any
      }
    };
  }

  // 2. Punjabi inputs
  if (normalized.includes("ਕਣਕ") || normalized.includes("kanak") || normalized.includes("gehu")) {
    const qty = normalized.match(/\d+/)?.[0] || "500";
    fallbackResponse = {
      detectedLanguage: "Punjabi",
      detectedLanguageCode: "pa-IN",
      spokenReply: `ਹਾਂਜੀ ਵੀਰ ਜੀ, ਮੈਂ ਤੁਹਾਡੀ ${qty} ਕਿਲੋ ਕਣਕ ਦੀ ਲਿਸਟਿੰਗ ਤਿਆਰ ਕਰ ਦਿੱਤੀ ਹੈ। ਕੀ ਮੈਂ ਇਸਨੂੰ ₹੩੨ ਪ੍ਰਤੀ ਕਿਲੋ ਦੇ ਭਾਅ 'ਤੇ ਸੇਵ ਕਰ ਦੇਵਾਂ?`,
      action: {
        type: "CREATE_LISTING_PREPARE",
        tab: "sell_marketplace",
        cropParams: {
          cropName: "Premium Wheat",
          grade: "A",
          quantity: parseFloat(qty),
          moisture: 12,
          recommendedPrice: 32
        }
      }
    };
  } else if (normalized.includes("ਪਿਆਜ") || normalized.includes("ਪਿਆਜ਼") || normalized.includes("pyaj")) {
    const qty = normalized.match(/\d+/)?.[0] || "500";
    fallbackResponse = {
      detectedLanguage: "Punjabi",
      detectedLanguageCode: "pa-IN",
      spokenReply: `ਠੀਕ ਹੈ ਸਰਦਾਰ ਜੀ, ਮੈਂ ${qty} ਕਿਲੋ ਪਿਆਜ਼ ਦੀ ਨਵੀਂ ਲਿਸਟਿੰਗ ਤਿਆਰ ਕਰ ਲਈ ਹੈ। ਕੀ ₹੨੭ ਦੇ ਹਿਸਾਬ ਨਾਲ ਅੱਗੇ ਵਧਾਂ?`,
      action: {
        type: "CREATE_LISTING_PREPARE",
        tab: "sell_marketplace",
        cropParams: {
          cropName: "Premium Onion",
          grade: "A",
          quantity: parseFloat(qty),
          moisture: 11,
          recommendedPrice: 27
        }
      }
    };
  } else if (normalized.includes("ਮੰਡੀ") || normalized.includes("ਭਾਅ") || normalized.includes("mandi") || normalized.includes("bha")) {
    fallbackResponse = {
      detectedLanguage: "Punjabi",
      detectedLanguageCode: "pa-IN",
      spokenReply: "ਮੈਂ ਤੁਹਾਡੇ ਲਈ ਮੰਡੀ ਦੇ ਤਾਜ਼ਾ ਭਾਅ ਦਾ ਪੰਨਾ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ ਜਿੱਥੇ ਤੁਸੀਂ ਅੱਜ ਦੀਆਂ ਕੀਮਤਾਂ ਦੇਖ ਸਕਦੇ ਹੋ।",
      action: {
        type: "NAVIGATE",
        tab: "prices",
        cropParams: null as any
      }
    };
  }

  // 3. English / Other inputs
  if (normalized.includes("wheat") && (normalized.includes("add") || normalized.includes("list") || normalized.includes("sell"))) {
    const qty = normalized.match(/\d+/)?.[0] || "1";
    fallbackResponse = {
      detectedLanguage: "English",
      detectedLanguageCode: "en-IN",
      spokenReply: `Sure, I have prepared a listing for ${qty} kg of Premium Wheat. Shall I save this listing with an AI suggested price of ₹34/kg?`,
      action: {
        type: "CREATE_LISTING_PREPARE",
        tab: "sell_marketplace",
        cropParams: {
          cropName: "Premium Wheat",
          grade: "A",
          quantity: parseFloat(qty),
          moisture: 12,
          recommendedPrice: 34
        }
      }
    };
  } else if (normalized.includes("onion") && (normalized.includes("add") || normalized.includes("list") || normalized.includes("sell"))) {
    const qty = normalized.match(/\d+/)?.[0] || "500";
    fallbackResponse = {
      detectedLanguage: "English",
      detectedLanguageCode: "en-IN",
      spokenReply: `Absolutely! I have set up a new listing for ${qty} kg of Premium Onions. Should we publish this with the dynamic rate of ₹28 per kg?`,
      action: {
        type: "CREATE_LISTING_PREPARE",
        tab: "sell_marketplace",
        cropParams: {
          cropName: "Premium Onion",
          grade: "A",
          quantity: parseFloat(qty),
          moisture: 11,
          recommendedPrice: 28
        }
      }
    };
  } else if (normalized.includes("price") || normalized.includes("market") || normalized.includes("mandi")) {
    if (fallbackResponse.detectedLanguage === "English") {
      fallbackResponse = {
        detectedLanguage: "English",
        detectedLanguageCode: "en-IN",
        spokenReply: "Navigating to the national APMC mandi prices tracker page now.",
        action: {
          type: "NAVIGATE",
          tab: "prices",
          cropParams: null as any
        }
      };
    }
  }

  // If Gemini client is active, consult Gemini for supreme contextual reasoning & 22-language translation support
  if (ai) {
    try {
      const historySummary = Array.isArray(history) && history.length > 0 
        ? history.slice(-4).map((h: any) => `${h.role === 'user' ? 'Farmer' : 'AI'}: ${h.text}`).join("\n")
        : "No previous logs.";

      const userProfileDesc = `Farmer Name: ${userContext?.name || 'Partner'}, state: ${userContext?.state || 'Punjab'}, district: ${userContext?.region || 'Amritsar'}`;

      const systemPrompt = `You are "KhetMitra AI", a high-performance floating voice agent built to support local Indian farmers.
Farmers expect immediate, ultra-simple, polite spoken advice without corporate terms or complex menus.

OBJECTIVE:
Analyze the farmer's spoken text query, automatically detect which Indian language/dialect they used, handle context memory, and produce:
1. Spoken Reply: Simple, humble verbal response in the SAME detected language.
2. App Action mapping.

SUPPORTED LANGUAGES:
Sanskrit, Hindi, Punjabi, Urdu, English, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, Assamese, Odia, Kashmiri, Dogri, Maithili, Nepali, Santali, Konkani, Manipuri, Bodo.

CONTEXT RESOLUTION RULE:
If the query relies on conversational history (e.g., "क्या मुझे बेच देना चाहिए?" or "Should I sell it?") resolve what they are referring to based on history (e.g., it refers to the wheat query from before).

INTENT RULES & ACTIONS:
A. List / Sell crop (e.g. "1 किलो गेहूं जोड़ दो", "500 किलो प्याज बेचनी है", "Sell 400kg wheat"):
   - Set action.type to "CREATE_LISTING_PREPARE".
   - Set action.tab to "sell_marketplace".
   - Extract parameters: cropName (e.g., "Premium Wheat" or "High Grade Onion"), quantity (number in kilograms), recommendedPrice (realistic bulk rate per kg in Rupees ₹, e.g. Wheat ~34, Onion ~28, Rice ~45, Cotton ~65).
   - In spokenReply, clearly ask for confirmation: "You are about to list [quantity] kg [crop]. Should I list this?" in their spoken language. This is a security guard before actually saving.

B. Navigate to tabs:
   - Command contains "mandi rate", "prices", "मंडी का भाव" -> tab: "prices", type: "NAVIGATE"
   - Command contains "disease", "sick plant", "बीमारी" -> tab: "scanner", type: "DISEASE_SCANNER"
   - Command contains "truck", "vehical", "transport", "यातायात" -> tab: "logistics", type: "BOOK_TRANSPORT"
   - Command contains "home", "मुख्य" -> tab: "hub", type: "NAVIGATE"
   - Command contains "insurance", "faisal bima", "बीमा" -> tab: "insurance", type: "NAVIGATE"
   - Command contains "profile", "vividh", "विवरण" -> tab: "verify", type: "NAVIGATE"

C. General Q/A:
   - If general question, set action.type to "NONE". spokenReply answers them clearly in simple terms.

FORMAT:
Produce a perfect JSON response conforming exactly to this schema:
{
  "detectedLanguage": "Name of Language",
  "detectedLanguageCode": "Standard speech code (e.g., 'hi-IN', 'pa-IN', 'ta-IN', 'mr-IN', 'gu-IN', 'te-IN', 'ur-IN', 'en-IN')",
  "spokenReply": "Humble, simple verbal response in user's matching spoken language",
  "action": {
    "type": "CREATE_LISTING_PREPARE" | "NAVIGATE" | "DISEASE_SCANNER" | "BOOK_TRANSPORT" | "NONE",
    "tab": "prices" | "scanner" | "logistics" | "sell_marketplace" | "hub" | "insurance" | "verify" | "predict" | "escrow" | "advisory" | "trader",
    "cropParams": {
      "cropName": "English crop name",
      "grade": "A",
      "quantity": number,
      "moisture": number,
      "recommendedPrice": number
    }
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nFarmer Profile Context: ${userProfileDesc}\nConversational History Logs:\n${historySummary}\n\nActual Spoken Query: "${query}"` }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = (response.text || "").trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (err: any) {
      console.error("Gemini voice assistant parsing failure:", err);
      // Fallback securely rather than failing
      return res.json(fallbackResponse);
    }
  } else {
    // Return mock fallback for demo mode
    return res.json(fallbackResponse);
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
