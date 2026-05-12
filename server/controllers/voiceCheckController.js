const axios = require('axios');

const checkElevenLabs = async (req, res, next) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'ELEVENLABS_API_KEY not set' });

    const resp = await axios.get('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey }
    });

    return res.json({ ok: true, data: resp.data });
  } catch (err) {
    const status = err.response?.status || 500;
    const body = err.response?.data || err.message;
    return res.status(status).json({ error: `ElevenLabs check failed: ${JSON.stringify(body)}` });
  }
};

module.exports = { checkElevenLabs };
