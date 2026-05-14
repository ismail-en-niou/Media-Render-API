const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { AUDIO_DIR, toPublicPath } = require("../utils/paths");

const toWordTimings = (alignment) => {
  if (!alignment || typeof alignment !== "object") {
    return [];
  }

  const chars = Array.isArray(alignment.characters) ? alignment.characters : [];
  const starts = Array.isArray(alignment.character_start_times_seconds)
    ? alignment.character_start_times_seconds
    : [];
  const ends = Array.isArray(alignment.character_end_times_seconds)
    ? alignment.character_end_times_seconds
    : [];

  const words = [];
  let currentText = "";
  let currentStart = null;
  let currentEnd = null;

  const flush = () => {
    if (!currentText.trim()) {
      currentText = "";
      currentStart = null;
      currentEnd = null;
      return;
    }
    if (Number.isFinite(currentStart) && Number.isFinite(currentEnd) && currentEnd > currentStart) {
      words.push({
        text: currentText.trim(),
        start: currentStart,
        end: currentEnd
      });
    }
    currentText = "";
    currentStart = null;
    currentEnd = null;
  };

  for (let i = 0; i < chars.length; i += 1) {
    const char = String(chars[i] ?? "");
    const start = Number(starts[i]);
    const end = Number(ends[i]);
    const isWhitespace = /\s/.test(char);

    if (isWhitespace) {
      flush();
      continue;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      continue;
    }

    if (currentStart === null) {
      currentStart = start;
    }
    currentEnd = end;
    currentText += char;
  }

  flush();
  return words;
};

const writeAudioFile = (audioBuffer) => {
  const filename = `voice-${uuidv4()}.mp3`;
  const outputPath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(outputPath, audioBuffer);
  return {
    audioUrl: toPublicPath("audio", filename),
    outputPath
  };
};

const generateVoiceAudioOnly = async ({ voiceId, payload, headers }) => {
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    payload,
    {
      headers: {
        ...headers,
        Accept: "audio/mpeg"
      },
      responseType: "arraybuffer"
    }
  );

  const audioResult = writeAudioFile(Buffer.from(response.data));
  return {
    ...audioResult,
    wordTimings: []
  };
};

const generateVoice = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error("ElevenLabs credentials are not configured.");
  }

  const modelId = process.env.ELEVENLABS_MODEL_ID;
  const payload = { text };
  if (modelId) {
    payload.model_id = modelId;
  }

  const headers = {
    "xi-api-key": apiKey,
    "Content-Type": "application/json"
  };

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      payload,
      {
        headers: {
          ...headers,
          Accept: "application/json"
        },
        responseType: "json"
      }
    );

    const audioBase64 = response?.data?.audio_base64;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      throw new Error("ElevenLabs timestamps response missing audio_base64");
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioResult = writeAudioFile(audioBuffer);
    const alignment = response?.data?.normalized_alignment || response?.data?.alignment;
    const wordTimings = toWordTimings(alignment);

    return {
      ...audioResult,
      wordTimings
    };
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 || status === 400 || status === 422) {
      return generateVoiceAudioOnly({ voiceId, payload, headers });
    }

    // Improve error message: include ElevenLabs response if available
    if (err.response) {
      const responseStatus = err.response.status;
      let body = "";
      try {
        body = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
      } catch (e) {
        body = "(unserializable response)";
      }
      const e = new Error(`ElevenLabs error ${responseStatus}: ${body}`);
      e.status = responseStatus;
      console.error("ElevenLabs request failed:", responseStatus, body);
      throw e;
    }

    console.error("ElevenLabs request failed:", err.message || err);
    throw err;
  }
};

module.exports = { generateVoice };
