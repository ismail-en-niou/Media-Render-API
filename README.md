# testapi

REST API MVP for uploads, ElevenLabs text-to-speech, and FFmpeg renders.

## Setup
1. Copy .env.example to .env and fill in values.
2. Install dependencies: npm install
3. Run the server: npm run dev

## Docker
Build and run the API:

```bash
docker build -t testapi .
docker run --env-file .env -p 3000:3000 \
	-v "$(pwd)/server/uploads:/app/server/uploads" \
	-v "$(pwd)/server/audio:/app/server/audio" \
	-v "$(pwd)/server/renders:/app/server/renders" \
	testapi
```

## Docker Compose
Run API + MongoDB:

```bash
docker compose up --build
```

Notes:
- Compose sets `MONGODB_URI` to the `mongo` service.
- If you do not want MongoDB, remove the `mongo` service and `MONGODB_URI` entry from docker-compose.yml.

API docs
 - Swagger UI: http://localhost:3000/api/docs
 - Raw OpenAPI JSON: http://localhost:3000/api/docs.json

## Endpoints
POST /api/upload
- multipart/form-data
- field name: files
- response: { "success": true, "files": ["/uploads/..."] }

POST /api/voice/generate
- body: { "text": "Welcome to my video" }
- response: { "audioUrl": "/audio/voice-<id>.mp3" }

POST /api/render
- body: { "media": ["/uploads/..."], "audio": "/audio/...", "format": "9:16" }
- response: { "outputUrl": "/renders/render-<id>.mp4", "format": "9:16" }

GET /api/download/{filePath}
- Download a file from uploads, audio, or renders directories.
- Example: /api/download/uploads/image.jpg

POST /api/render-job
- Start an async render job (returns jobId immediately, render runs in background).
- body: { "media": [...], "audio": "...", "format": "..." }
- response: { "jobId": "<uuid>", "status": "pending" }

GET /api/render-job/{jobId}
- Check render job status and progress.
- response: { "jobId": "...", "status": "pending|processing|completed|failed", "progress": 0-100, "outputUrl": "...", "error": "..." }

POST /api/video/generate
- Generate video from text with ElevenLabs + media (all-in-one endpoint).
- Combines voice generation + video rendering in one call.
- body: { "text": "Welcome to my video", "media": ["/uploads/image.jpg"], "format": "9:16" }
- response: { "success": true, "audioUrl": "/audio/...", "outputUrl": "/renders/...", "format": "9:16" }

## Export Formats
- 16:9 -> 1920x1080
- 9:16 -> 1080x1920
- 1:1 -> 1080x1080

## Notes
- Static files are served from /uploads, /audio, and /renders.
- Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.
- IMAGE_DURATION_SECONDS controls how long each image stays on screen.
