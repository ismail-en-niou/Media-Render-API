const { generateImage } = require("../services/imageService");

const generateImageHandler = async (req, res, next) => {
  try {
    const { prompt, width, height } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const result = await generateImage({ prompt, width, height });

    return res.json({
      success: true,
      imageUrl: result.imageUrl,
      width: result.width,
      height: result.height
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { generateImageHandler };