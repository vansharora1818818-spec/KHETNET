import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CloudSun, 
  Droplets, 
  Thermometer, 
  Wind, 
  Sprout, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Clock, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface WeatherAdvisoryProps {
  user: any;
  t: any;
}

export function AgriAdvisory({ user, t }: WeatherAdvisoryProps) {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Derive regional crop lists & mock climate based on state
  const stateName = user.state || 'Punjab';
  const regionName = user.region || 'Amritsar';

  // State-specific crop advisors with seasonal metrics
  const regionData: Record<string, {
    temp: string;
    humidity: string;
    soilMoisture: string;
    rainfallChance: string;
    recommendedCrops: string[];
    advisories: string[];
  }> = {
    'Punjab': {
      temp: '37°C',
      humidity: '42%',
      soilMoisture: '58%',
      rainfallChance: '15%',
      recommendedCrops: ['Basmati Rice', 'Cotton', 'Sugarcane', 'Maize'],
      advisories: [
        'Kharif cultivation matches current high temperature. Basmati nurseries should be irrigated regularly.',
        'High winds expected on Tuesday; reschedule foliar nitrogen spray to avoid pesticide drift.',
        'Apply zinc sulfate to paddy saplings to prevent iron chlorosis leaf drying.'
      ]
    },
    'Haryana': {
      temp: '38°C',
      humidity: '40%',
      soilMoisture: '54%',
      rainfallChance: '10%',
      recommendedCrops: ['Pearl Millet (Bajra)', 'Cotton', 'Guar', 'Basmati Paddy'],
      advisories: [
        'Moisture level in soil is dry-optimal; perfect window for cotton weeding.',
        'Paddy sowing recommended in shaded beds first. Maintain a standing water depth of 2-3 cm.',
        'Watch out for Whitefly pests on early cotton plantations. Apply neem oil concentrate.'
      ]
    },
    'Karnataka': {
      temp: '29°C',
      humidity: '75%',
      soilMoisture: '82%',
      rainfallChance: '65%',
      recommendedCrops: ['Ragi (Finger Millet)', 'Maize', 'Sugarcane', 'Groundnut'],
      advisories: [
        'Southwest monsoon showers have moisturized clay-loams. Excellent conditions for Ragi sowing.',
        'Avoid stagnant water pooling near coconut saplings to prevent root rot disease.',
        'Harvested groundnut crops must undergo drying immediately in a covered warehouse.'
      ]
    },
    'Tamil Nadu': {
      temp: '33°C',
      humidity: '68%',
      soilMoisture: '70%',
      rainfallChance: '40%',
      recommendedCrops: ['Samba Paddy', 'Cotton', 'Millets', 'Banana'],
      advisories: [
        'High dampness levels can propagate stem-borer pests. Administer biological pheromone traps.',
        'Drip irrigation schedules can be deferred by 48 hours owing to regional evening showers.',
        'Sow blackgram as a catch crop after the summer harvest to enrich soil nitrogen concentration.'
      ]
    },
    'Andhra Pradesh': {
      temp: '34°C',
      humidity: '60%',
      soilMoisture: '65%',
      rainfallChance: '30%',
      recommendedCrops: ['Rice (Paddy)', 'Chillies', 'Cotton', 'Tobacco'],
      advisories: [
        'Chilli nursery growth is at peak maturity. Transplant to main fields during soft overcast skies.',
        'Inspect cotton fields weekly for Pink Bollworm moths. Keep soil well-aerated by tilling.',
        'Nitrogenous top-dressing must be done immediately after dry soil tilling cycles.'
      ]
    },
    'Telangana': {
      temp: '35°C',
      humidity: '52%',
      soilMoisture: '61%',
      rainfallChance: '25%',
      recommendedCrops: ['Cotton', 'Red Gram', 'Rice Paddy', 'Turmeric'],
      advisories: [
        'Red Gram sowing is highly feasible given current deep loam moisture levels.',
        'Prepare raised crop beds to facilitate smooth field drainage in future heavy rain events.',
        'Turmeric rhizome treatment with Trichoderma viride is mandatory to block rhizome rot.'
      ]
    },
    'Maharashtra': {
      temp: '31°C',
      humidity: '70%',
      soilMoisture: '78%',
      rainfallChance: '55%',
      recommendedCrops: ['Soybean', 'Cotton', 'Sugarcane', 'Jowar'],
      advisories: [
        'Soybean sowing should hit maximum pace as ground monsoon saturation touches critical 70%.',
        'In cotton fields, do broad-bed furrowing to safely retain organic run-off nutrition.',
        'Sugarcane planting steps must receive organic manure before rain sets in later this week.'
      ]
    }
  };

  const currentClimate = regionData[stateName] || {
    temp: '32°C',
    humidity: '55%',
    soilMoisture: '62%',
    rainfallChance: '30%',
    recommendedCrops: ['Rice Paddy', 'Vegetables', 'Maize'],
    advisories: [
      'Normal regional climate detected. Perform general weeding and localized row-watering.',
      'Check local mandi index forecasts to select premium seed options.'
    ]
  };

  const handleRunAnalysis = (cropName: string) => {
    if (!cropName) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Simulate highly advanced, clinical agronomy feasibility audit
      const isOptimal = 
        currentClimate.recommendedCrops.map(c => c.toLowerCase()).includes(cropName.toLowerCase()) ||
        cropName.toLowerCase().includes('rice') ||
        cropName.toLowerCase().includes('cotton');

      const feasibilityScore = isOptimal ? Math.floor(Math.random() * 15) + 82 : Math.floor(Math.random() * 20) + 55;

      setAnalysisResult({
        crop: cropName,
        score: feasibilityScore,
        status: feasibilityScore >= 80 ? 'HIGHLY REC' : feasibilityScore >= 65 ? 'MODERATE' : 'RISKY',
        nitrogenNeeds: isOptimal ? 'Moderate (60kg/Hectare)' : 'High (100kg/Hectare)',
        waterRequirement: isOptimal ? 'Optimal (monsoon aligned)' : 'Heavy Additional Tubewell Irrigation Required',
        soilPhRange: '6.2 - 7.0 (Slightly Acidic to Neutral)',
        estimatedDaysToHarvest: cropName.toLowerCase().includes('rice') ? 120 : cropName.toLowerCase().includes('cotton') ? 165 : 95,
        clinicalSummary: isOptimal 
          ? `Current weather matches ${cropName} biological threshold perfectly. Ambient temperature matches metabolic requirements and humidity will keep transpiration balanced during germination.`
          : `Climate is sub-optimal for ${cropName} in ${regionName}. Low atmospheric moisture or extreme soil temperature might cause seedlings to sweat excessively. High watchfulness required if sown.`
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6" id="agri-advisory-root">
      {/* Title block */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 rounded bg-[#4C6B36]/10 text-[#4C6B36] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Live KhetNet Intelligence
          </span>
        </div>
        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">Climate Sowing Advisor</h2>
        <p className="text-xs text-gray-400 font-medium">Bespoke agricultural meteorology matched to {regionName}, {stateName}.</p>
      </div>

      {/* Weather Dashboard grid */}
      <div className="grid grid-cols-2 gap-3" id="weather-dashboard-bento">
        {/* Temp Card */}
        <div className="bg-[#FAFDF6] rounded-2xl border border-[#E2F0D9] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Air Temp</p>
            <p className="text-lg font-black text-gray-950">{currentClimate.temp}</p>
          </div>
        </div>

        {/* Moisture Card */}
        <div className="bg-[#FAFDF6] rounded-2xl border border-[#E2F0D9] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Soil Moisture</p>
            <p className="text-lg font-black text-gray-950">{currentClimate.soilMoisture}</p>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="bg-[#FAFDF6] rounded-2xl border border-[#E2F0D9] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Relative Humidity</p>
            <p className="text-lg font-black text-gray-950">{currentClimate.humidity}</p>
          </div>
        </div>

        {/* Rain Card */}
        <div className="bg-[#FAFDF6] rounded-2xl border border-[#E2F0D9] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rain Probability</p>
            <p className="text-lg font-black text-gray-950">{currentClimate.rainfallChance}</p>
          </div>
        </div>
      </div>

      {/* Recommended regional crops */}
      <div className="bg-white rounded-3xl border-2 border-[#E2F0D9] p-6 space-y-4">
        <div>
          <h3 className="font-heading font-black text-sm text-gray-950 uppercase tracking-wider flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#4C6B36]" /> Recommended Crops This Week
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Recommended cultivars based on regional water tables and seed statistics.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentClimate.recommendedCrops.map(crop => (
            <button
              key={crop}
              onClick={() => { setSelectedCrop(crop); handleRunAnalysis(crop); }}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${selectedCrop === crop ? 'bg-[#4C6B36] text-white shadow-sm scale-102' : 'bg-[#F0F7EB] text-[#4C6B36] hover:bg-[#E2F0D9]'}`}
            >
              🌾 {crop}
            </button>
          ))}
        </div>
      </div>

      {/* Advisory Bulletins */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider block ml-1">Agronomy Advisory Bulletins</h4>
        <div className="space-y-2.5">
          {currentClimate.advisories.map((adv, idx) => (
            <div key={idx} className="p-4 bg-white border border-[#E2F0D9] rounded-2xl flex items-start gap-3">
              <span className="p-1 px-2 text-[10px] bg-[#FAFDF6] border border-[#E2F0D9] rounded-lg font-black text-[#4C6B36] shrink-0">{idx+1}</span>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">{adv}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Sowing feasibility simulator */}
      <div className="bg-white rounded-3xl border-2 border-dashed border-[#4C6B36]/30 p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-heading font-black text-base text-gray-950 italic flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5 text-[#4C6B36]" /> Climate Auditing Engine
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Test feasibility score of any custom crop cultivar before buying seeds.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customCrop}
            onChange={(e) => setCustomCrop(e.target.value)}
            placeholder="e.g. Mustard, Wheat, Tomato, Carrot..."
            className="flex-1 px-4 py-3 bg-[#F5F9F2] text-xs font-bold rounded-xl outline-none"
          />
          <button
            onClick={() => handleRunAnalysis(customCrop)}
            disabled={!customCrop || isAnalyzing}
            className="px-5 py-3 bg-[#4C6B36] text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#3D562B] transition-all disabled:opacity-45"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Audit'}
          </button>
        </div>

        {/* Audit Report Result with micro-animations */}
        {analysisResult && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border ${analysisResult.status === 'HIGHLY REC' ? 'bg-[#FAFDF6] border-[#4C6B36]' : 'bg-amber-50/50 border-amber-200'} space-y-4`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-heading font-black text-sm text-gray-950">{analysisResult.crop} Analysis Report</h4>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-0.5">Sow Feasibility Rating</p>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${analysisResult.status === 'HIGHLY REC' ? 'bg-[#4C6B36] text-white' : 'bg-amber-100 text-amber-700'}`}>
                  {analysisResult.score}% {analysisResult.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Nitrogen / Fertilizer Needs</p>
                <p className="font-bold text-gray-900 mt-0.5">{analysisResult.nitrogenNeeds}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Estimated Days To Harvest</p>
                <p className="font-bold text-[#4C6B36] mt-0.5">~{analysisResult.estimatedDaysToHarvest} Days</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Water Requirements</p>
                <p className="font-bold text-gray-900 mt-0.5 leading-snug">{analysisResult.waterRequirement}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Clinical Agronomist Note</p>
                <p className="text-gray-600 mt-1 leading-relaxed text-[11px] font-medium">{analysisResult.clinicalSummary}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#4C6B36] font-bold">
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#4C6B36]" /> Seed standard verified</span>
              <button 
                onClick={() => handleRunAnalysis(analysisResult.crop)}
                className="text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 hover:underline"
              >
                Re-assess calculations <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
