// Lightweight Hugging Face inference helpers (optional token)
// Uses public models with a bearer token if provided in env

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string | undefined;

type SentimentResult = {
  label: string; // e.g., POSITIVE/NEGATIVE/NEUTRAL depending on model
  score: number;
};

export async function hfSentiment(text: string): Promise<SentimentResult[] | null> {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
        },
        body: JSON.stringify({ inputs: text }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // HF returns [[{label,score},...]] sometimes or [{label,score},...] depending on pipeline
    const arr = Array.isArray(data) ? (Array.isArray(data[0]) ? data[0] : data) : [];
    return arr as SentimentResult[];
  } catch {
    return null;
  }
}

// Simple speech-to-text using an open Whisper endpoint on HF (requires token for most hosts).
// Accepts a Blob from MediaRecorder (webm). Converts to ArrayBuffer and sends as binary.
export async function hfWhisperTranscribe(audioBlob: Blob): Promise<string | null> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const res = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-small",
      {
        method: "POST",
        headers: {
          // For binary uploads, omit content-type; HF detects from payload
          ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
        },
        body: arrayBuffer,
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Expected: { text: string }
    if (data && typeof data.text === "string") return data.text;
    return null;
  } catch {
    return null;
  }
}


