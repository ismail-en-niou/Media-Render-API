const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { AUDIO_DIR, toPublicPath } = require("../utils/paths");

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

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      payload,
      {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
        },
        responseType: "arraybuffer"
      }
    );

    const filename = `voice-${uuidv4()}.mp3`;
    const outputPath = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(outputPath, response.data);

    return {
      audioUrl: toPublicPath("audio", filename),
      outputPath
    };
  } catch (err) {
    // Improve error message: include ElevenLabs response if available
    if (err.response) {
      const status = err.response.status;
      let body = "";
      try {
        body = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
      } catch (e) {
        body = "(unserializable response)";
      }
      const e = new Error(`ElevenLabs error ${status}: ${body}`);
      e.status = status;
      console.error("ElevenLabs request failed:", status, body);
      throw e;
    }

    console.error("ElevenLabs request failed:", err.message || err);
    throw err;
  }
};

module.exports = { generateVoice };
