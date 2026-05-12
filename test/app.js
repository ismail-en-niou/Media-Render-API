const state = {
  media: [],
  audio: ""
};

const baseUrlInput = document.getElementById("baseUrl");
const uploadInput = document.getElementById("uploadFiles");
const uploadBtn = document.getElementById("uploadBtn");
const mediaList = document.getElementById("mediaList");
const mediaManual = document.getElementById("mediaManual");
const ttsText = document.getElementById("ttsText");
const voiceBtn = document.getElementById("voiceBtn");
const audioPathInput = document.getElementById("audioPath");
const formatSelect = document.getElementById("formatSelect");
const renderBtn = document.getElementById("renderBtn");
const renderLink = document.getElementById("renderLink");
const renderMeta = document.getElementById("renderMeta");
const renderVideo = document.getElementById("renderVideo");
const logEl = document.getElementById("log");

const normalizeBaseUrl = () => baseUrlInput.value.trim().replace(/\/+$/, "");

const log = (message, data) => {
  const time = new Date().toLocaleTimeString();
  const payload = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  logEl.textContent = `[${time}] ${message}${payload}\n${logEl.textContent}`;
};

const renderMediaList = () => {
  mediaList.innerHTML = "";

  if (state.media.length === 0) {
    const empty = document.createElement("p");
    empty.className = "meta";
    empty.textContent = "No uploads yet.";
    mediaList.appendChild(empty);
    return;
  }

  state.media.forEach((item) => {
    const label = document.createElement("label");
    label.className = "check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "mediaItem";
    checkbox.value = item;
    checkbox.checked = true;

    const text = document.createElement("span");
    text.textContent = item;

    label.appendChild(checkbox);
    label.appendChild(text);
    mediaList.appendChild(label);
  });
};

const getSelectedMedia = () => {
  const checked = Array.from(document.querySelectorAll('input[name="mediaItem"]:checked'));
  return checked.map((item) => item.value);
};

const parseManualMedia = () => {
  return mediaManual.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
};

uploadBtn.addEventListener("click", async () => {
  const files = Array.from(uploadInput.files || []);
  if (files.length === 0) {
    log("Upload skipped: no files selected.");
    return;
  }

  const baseUrl = normalizeBaseUrl();
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  try {
    log("Uploading media...");
    const data = await requestJson(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData
    });

    state.media = [...state.media, ...(data.files || [])];
    if (!mediaManual.value) {
      mediaManual.value = state.media.join(", ");
    }
    renderMediaList();
    log("Upload complete.", data);
  } catch (err) {
    log(`Upload failed: ${err.message}`);
  }
});

voiceBtn.addEventListener("click", async () => {
  const text = ttsText.value.trim();
  if (!text) {
    log("Voice generation skipped: text is required.");
    return;
  }

  const baseUrl = normalizeBaseUrl();

  try {
    log("Generating voice...");
    const data = await requestJson(`${baseUrl}/api/voice/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    state.audio = data.audioUrl || "";
    audioPathInput.value = state.audio;
    log("Voice generated.", data);
  } catch (err) {
    log(`Voice generation failed: ${err.message}`);
  }
});

renderBtn.addEventListener("click", async () => {
  const baseUrl = normalizeBaseUrl();
  const audio = audioPathInput.value.trim();
  const selectedMedia = getSelectedMedia();
  const manualMedia = parseManualMedia();
  const media = selectedMedia.length ? selectedMedia : manualMedia;

  if (media.length === 0) {
    log("Render skipped: media list is empty.");
    return;
  }

  if (!audio) {
    log("Render skipped: audio path is required.");
    return;
  }

  try {
    log("Rendering video...");
    const data = await requestJson(`${baseUrl}/api/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media,
        audio,
        format: formatSelect.value
      })
    });

    const outputUrl = data.outputUrl || "";
    const absoluteUrl = outputUrl ? `${baseUrl}${outputUrl}` : "";

    renderLink.textContent = absoluteUrl || "No render yet";
    renderLink.href = absoluteUrl || "#";
    renderMeta.textContent = outputUrl ? `Format: ${data.format}` : "";
    renderVideo.src = absoluteUrl;

    log("Render complete.", data);
  } catch (err) {
    log(`Render failed: ${err.message}`);
  }
});

renderMediaList();
