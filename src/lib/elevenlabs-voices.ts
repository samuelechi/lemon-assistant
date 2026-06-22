export type ElevenLabsVoice = {
    id: string
    name: string
    gender: "female" | "male"
    accent: string
    description: string
    previewUrl: string
}

// Curated set of stable ElevenLabs voices suitable for a professional phone receptionist.
// All are non-default (community/cloned) voices with long-term availability.
// Rachel (21m00Tcm4TlvDq8ikWAM) is the current default — included here so Pro users
// can explicitly pick it, and Growth users still get it as the silent fallback.
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
    {
        id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        gender: "female",
        accent: "American",
        description: "Calm, professional, clear",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3",
    },
    {
        id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        gender: "female",
        accent: "American",
        description: "Strong, confident, expressive",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5a559-bf09-4a0a-98d8-ee0f13d5f8ad.mp3",
    },
    {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        gender: "female",
        accent: "American",
        description: "Warm, friendly, approachable",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04365bce-98cc-4e99-9f10-56b60680cda9.mp3",
    },
    {
        id: "MF3mGyEYCl7XYWbV9V6O",
        name: "Elli",
        gender: "female",
        accent: "American",
        description: "Young, energetic, conversational",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/ede1e4e2-c0c8-44a6-a1fe-ae0d8a141ae7.mp3",
    },
    {
        id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Josh",
        gender: "male",
        accent: "American",
        description: "Deep, trustworthy, professional",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/cee5a987-3741-4d88-9b78-e44e3b0fc8ad.mp3",
    },
    {
        id: "VR6AewLTigWG4xSOukaG",
        name: "Arnold",
        gender: "male",
        accent: "American",
        description: "Crisp, authoritative, articulate",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/66e83dc2-6543-4897-9283-e028ac5ae4aa.mp3",
    },
    {
        id: "pNInz6obpgDQGcFmaJgB",
        name: "Adam",
        gender: "male",
        accent: "American",
        description: "Smooth, neutral, versatile",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/e0b45450-78db-49b9-aaa4-d5358a6871bd.mp3",
    },
    {
        id: "yoZ06aMxZJJ28mfd3POQ",
        name: "Sam",
        gender: "male",
        accent: "American",
        description: "Raspy, intense, confident",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/a6932462-b5e4-4c97-a8a5-e3cfdd6e2c44.mp3",
    },
    {
        id: "jBpfuIE2acCO8z3wKNLl",
        name: "Freya",
        gender: "female",
        accent: "American",
        description: "Overpowering, strong, upfront",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/jBpfuIE2acCO8z3wKNLl/s0K7TEdYbJfbtyaQ9cqP.mp3",
    },
    {
        id: "onwK4e9ZLuTAKqWW03F9",
        name: "Daniel",
        gender: "male",
        accent: "British",
        description: "Deep, authoritative, news presenter",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7c5f74a3-36b8-467c-b0de-b95f1bcd6ebc.mp3",
    },
    {
        id: "ThT5KcBeYPX3keUQqHPh",
        name: "Dorothy",
        gender: "female",
        accent: "British",
        description: "Pleasant, trustworthy, calm",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/ThT5KcBeYPX3keUQqHPh/981f0855-6598-48d2-9f8f-b6d92fbbe3fc.mp3",
    },
    {
        id: "g5CIjZEefAph4nQFvHAz",
        name: "Ethan",
        gender: "male",
        accent: "American",
        description: "Whispered, intimate, ASMR-style",
        previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/g5CIjZEefAph4nQFvHAz/26acfa14-4446-4f92-b5a1-b7ab3c95d1c4.mp3",
    },
]

export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM" // Rachel

export function getVoiceById(id: string): ElevenLabsVoice | undefined {
    return ELEVENLABS_VOICES.find((v) => v.id === id)
}