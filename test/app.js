const state = {
  media: [],
  audio: "",
  jobs: new Map()
};

const baseUrlInput = document.getElementById("baseUrl");
const uploadInput = document.getElementById("uploadFiles");
const uploadBtn = document.getElementById("uploadBtn");
const mediaList = document.getElementById("mediaList");
const mediaManual = document.getElementById("mediaManual");
const ttsText = document.getElementById("ttsText");
const voiceBtn = document.getElementById("voiceBtn");
const imagePromptInput = document.getElementById("imagePrompt");
const imageSizeSelect = document.getElementById("imageSizeSelect");
const imageGenerateBtn = document.getElementById("imageGenerateBtn");
const imageLink = document.getElementById("imageLink");
const imageMeta = document.getElementById("imageMeta");
const generatedImage = document.getElementById("generatedImage");
const audioPathInput = document.getElementById("audioPath");
const formatSelect = document.getElementById("formatSelect");
const asyncFormatSelect = document.getElementById("asyncFormatSelect");
const renderBtn = document.getElementById("renderBtn");
const renderLink = document.getElementById("renderLink");
const renderMeta = document.getElementById("renderMeta");
const renderVideo = document.getElementById("renderVideo");
const asyncRenderBtn = document.getElementById("asyncRenderBtn");
const jobsList = document.getElementById("jobsList");
const jobDetail = document.getElementById("jobDetail");
const jobIdEl = document.getElementById("jobId");
const jobStatusEl = document.getElementById("jobStatus");
const jobProgressEl = document.getElementById("jobProgress");
const pollJobBtn = document.getElementById("pollJobBtn");
const jobDownloadLink = document.getElementById("jobDownloadLink");
const downloadPathInput = document.getElementById("downloadPath");
const downloadBtn = document.getElementById("downloadBtn");
const combinedFilesInput = document.getElementById("combinedFiles");
const combinedText = document.getElementById("combinedText");
const combinedFormatSelect = document.getElementById("combinedFormatSelect");
const combinedGenerateBtn = document.getElementById("combinedGenerateBtn");
const combinedVideoLink = document.getElementById("combinedVideoLink");
const combinedVideoMeta = document.getElementById("combinedVideoMeta");
const combinedVideo = document.getElementById("combinedVideo");
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

imageGenerateBtn.addEventListener("click", async () => {
  const baseUrl = normalizeBaseUrl();
  const prompt = imagePromptInput.value.trim();
  if (!prompt) {
    log("Image generation skipped: prompt is required.");
    return;
  }

  const [width, height] = imageSizeSelect.value.split("x").map(Number);

  try {
    log("Generating image...");
    const data = await requestJson(`${baseUrl}/api/image/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width, height })
    });

    const absoluteUrl = `${baseUrl}${data.imageUrl}`;
    imageLink.textContent = absoluteUrl;
    imageLink.href = absoluteUrl;
    imageMeta.textContent = `Size: ${data.width} x ${data.height}`;
    generatedImage.src = absoluteUrl;
    generatedImage.style.maxWidth = "100%";
    generatedImage.style.borderRadius = "14px";
    generatedImage.style.border = "1px solid var(--border)";

    log("Image generated.", data);
  } catch (err) {
    log(`Image generation failed: ${err.message}`);
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

asyncRenderBtn.addEventListener("click", async () => {
  const baseUrl = normalizeBaseUrl();
  const audio = audioPathInput.value.trim();
  const selectedMedia = getSelectedMedia();
  const manualMedia = parseManualMedia();
  const media = selectedMedia.length ? selectedMedia : manualMedia;

  if (media.length === 0) {
    log("Async render skipped: media list is empty.");
    return;
  }

  if (!audio) {
    log("Async render skipped: audio path is required.");
    return;
  }

  try {
    log("Starting async render job...");
    const data = await requestJson(`${baseUrl}/api/render-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media,
        audio,
        format: asyncFormatSelect.value
      })
    });

    const jobId = data.jobId;
    state.jobs.set(jobId, {
      jobId,
      status: "pending",
      progress: 0,
      outputUrl: null,
      error: null
    });

    renderJobsList();
    selectJob(jobId);
    log("Render job created.", data);
  } catch (err) {
    log(`Async render failed: ${err.message}`);
  }
});

const renderJobsList = () => {
  jobsList.innerHTML = "";

  if (state.jobs.size === 0) {
    const empty = document.createElement("p");
    empty.className = "meta";
    empty.textContent = "No render jobs yet.";
    jobsList.appendChild(empty);
    return;
  }

  for (const [jobId, job] of state.jobs) {
    const item = document.createElement("div");
    item.className = "check";
    item.style.cursor = "pointer";
    item.style.padding = "8px";
    item.style.borderRadius = "8px";
    item.style.backgroundColor = "rgba(15, 76, 92, 0.05)";
    item.style.marginBottom = "8px";

    const statusColor = {
      pending: "#666",
      processing: "#0f4c5c",
      completed: "#2d6a4f",
      failed: "#d62828"
    }[job.status] || "#666";

    item.innerHTML = `
      <strong style="color: ${statusColor};">${job.status.toUpperCase()}</strong>
      <span style="font-size: 12px; color: #666; margin-left: 8px;">${jobId.slice(0, 8)}...</span>
    `;

    item.addEventListener("click", () => selectJob(jobId));
    jobsList.appendChild(item);
  }
};

const selectJob = (jobId) => {
  const job = state.jobs.get(jobId);
  if (!job) return;

  jobIdEl.textContent = `Job ID: ${jobId}`;
  jobStatusEl.textContent = `Status: ${job.status} (${job.progress}%)`;
  jobProgressEl.style.width = `${job.progress}%`;

  if (job.status === "completed" && job.outputUrl) {
    const baseUrl = normalizeBaseUrl();
    const downloadUrl = `${baseUrl}${job.outputUrl}`;
    jobDownloadLink.href = downloadUrl;
    jobDownloadLink.download = job.outputUrl.split("/").pop();
    jobDownloadLink.style.display = "inline-block";
  } else {
    jobDownloadLink.style.display = "none";
  }

  jobDetail.style.display = "block";
};

pollJobBtn.addEventListener("click", async () => {
  const baseUrl = normalizeBaseUrl();
  let selectedJobId = null;

  for (const [jobId, job] of state.jobs) {
    if (job === state.jobs.get(jobId)) {
      selectedJobId = jobId;
      break;
    }
  }

  const jobId = jobIdEl.textContent.replace("Job ID: ", "");
  if (!jobId || jobId === "") {
    log("No job selected.");
    return;
  }

  try {
    log(`Polling job status: ${jobId}`);
    const data = await requestJson(`${baseUrl}/api/render-job/${jobId}`);

    state.jobs.set(jobId, {
      jobId: data.jobId,
      status: data.status,
      progress: data.progress,
      outputUrl: data.outputUrl,
      error: data.error
    });

    selectJob(jobId);
    log("Job status updated.", data);
  } catch (err) {
    log(`Poll failed: ${err.message}`);
  }
});

downloadBtn.addEventListener("click", () => {
  const filePath = downloadPathInput.value.trim();
  if (!filePath) {
    log("Download skipped: file path is required.");
    return;
  }

  const baseUrl = normalizeBaseUrl();
  const downloadUrl = `${baseUrl}/api/download/${filePath}`;

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filePath.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  log(`Download started: ${filePath}`);
});

combinedGenerateBtn.addEventListener("click", async () => {
  const baseUrl = normalizeBaseUrl();
  const text = combinedText.value.trim();
  const files = Array.from(combinedFilesInput.files || []);
  const selectedMedia = getSelectedMedia();
  const manualMedia = parseManualMedia();
  const media = selectedMedia.length ? selectedMedia : manualMedia;

  if (!text) {
    log("Combined generation skipped: text is required.");
    return;
  }

  try {
    log("Generating video from text with ElevenLabs...");
    let data;
    if (files.length > 0) {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("format", combinedFormatSelect.value);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`${baseUrl}/api/video/generate`, {
        method: "POST",
        body: formData
      });
      data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
      }
    } else {
      data = await requestJson(`${baseUrl}/api/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          media,
          format: combinedFormatSelect.value
        })
      });
    }

    const outputUrl = data.outputUrl || "";
    const absoluteUrl = outputUrl ? `${baseUrl}${outputUrl}` : "";

    combinedVideoLink.textContent = absoluteUrl || "No video yet";
    combinedVideoLink.href = absoluteUrl || "#";
    combinedVideoMeta.textContent = data.success ? `Audio: ${data.audioUrl}, Format: ${data.format}` : "Failed";
    combinedVideo.src = absoluteUrl;

    log("Video generation complete.", data);
  } catch (err) {
    log(`Video generation failed: ${err.message}`);
  }
});

renderMediaList();
