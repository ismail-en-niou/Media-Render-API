const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { IMAGES_DIR, toPublicPath } = require("../utils/paths");

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const wrapText = (text, maxChars) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
};

const generateImage = async ({ prompt, width = 1024, height = 1024 }) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("prompt is required");
  }

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error("prompt is required");
  }

  const safeWidth = Number(width) > 0 ? Number(width) : 1024;
  const safeHeight = Number(height) > 0 ? Number(height) : 1024;
  const filename = `image-${uuidv4()}.svg`;
  const outputPath = path.join(IMAGES_DIR, filename);

  const gradientId = `grad-${uuidv4().replace(/-/g, "")}`;
  const lines = wrapText(cleanPrompt, Math.max(18, Math.floor(safeWidth / 18)));
  const lineHeight = Math.max(42, Math.floor(safeHeight / 12));
  const totalTextHeight = lines.length * lineHeight;
  const startY = Math.max(180, Math.floor((safeHeight - totalTextHeight) / 2));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f4c5c" />
      <stop offset="50%" stop-color="#1f7a8c" />
      <stop offset="100%" stop-color="#d9e2ec" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#102a43" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})" />
  <circle cx="${Math.floor(safeWidth * 0.8)}" cy="${Math.floor(safeHeight * 0.2)}" r="${Math.floor(Math.min(safeWidth, safeHeight) * 0.18)}" fill="rgba(255,255,255,0.14)" />
  <circle cx="${Math.floor(safeWidth * 0.18)}" cy="${Math.floor(safeHeight * 0.78)}" r="${Math.floor(Math.min(safeWidth, safeHeight) * 0.22)}" fill="rgba(255,255,255,0.10)" />
  <rect x="${Math.floor(safeWidth * 0.08)}" y="${Math.floor(safeHeight * 0.1)}" width="${Math.floor(safeWidth * 0.84)}" height="${Math.floor(safeHeight * 0.8)}" rx="42" fill="rgba(255,255,255,0.14)" filter="url(#shadow)" />
  <text x="50%" y="${startY - 70}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#eaf2f8" letter-spacing="3">GENERATED IMAGE</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="50%" y="${startY + index * lineHeight}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(42, Math.floor(safeWidth / 20))}" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
  <text x="50%" y="${safeHeight - 80}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#f0f4f8">${escapeXml(new Date().toLocaleString())}</text>
</svg>`;

  fs.writeFileSync(outputPath, svg, "utf8");

  return {
    imageUrl: toPublicPath("images", filename),
    outputPath,
    width: safeWidth,
    height: safeHeight
  };
};

module.exports = { generateImage };