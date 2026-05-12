const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Media Render API",
    version: "1.0.0",
    description: "Upload media, generate ElevenLabs voice, and render MP4 videos."
  },
  servers: [
    { url: process.env.SWAGGER_BASE_URL || "http://localhost:3000", description: "Local server" }
  ],
  paths: {
    "/api/upload": {
      post: {
        summary: "Upload images or videos",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Files uploaded", content: { "application/json": { schema: { $ref: "#/components/schemas/UploadResponse" } } } }
        }
      }
    },
    "/api/voice/generate": {
      post: {
        summary: "Generate speech audio from text (ElevenLabs)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VoiceRequest" }
            }
          }
        },
        responses: {
          "200": { description: "Audio generated", content: { "application/json": { schema: { $ref: "#/components/schemas/VoiceResponse" } } } },
          "400": { description: "Bad request" }
        }
      }
    },
    "/api/voice/check": {
      get: {
        summary: "Check ElevenLabs API key",
        responses: {
          "200": { description: "Key OK" },
          "400": { description: "Key missing or invalid" }
        }
      }
    },
    "/api/render": {
      post: {
        summary: "Render a video from media and audio",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RenderRequest" }
            }
          }
        },
        responses: {
          "200": { description: "Render complete", content: { "application/json": { schema: { $ref: "#/components/schemas/RenderResponse" } } } },
          "400": { description: "Bad request" }
        }
      }
    },
    "/api/download/{filePath}": {
      get: {
        summary: "Download a file (uploads, audio, renders)",
        parameters: [
          { name: "filePath", in: "path", required: true, schema: { type: "string" }, example: "uploads/image.jpg" }
        ],
        responses: {
          "200": { description: "File stream" },
          "404": { description: "File not found" }
        }
      }
    },
    "/api/render-job": {
      post: {
        summary: "Start an async render job",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RenderRequest" }
            }
          }
        },
        responses: {
          "200": { description: "Job created", content: { "application/json": { schema: { $ref: "#/components/schemas/RenderJobResponse" } } } }
        }
      }
    },
    "/api/render-job/{jobId}": {
      get: {
        summary: "Get render job status",
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Job status", content: { "application/json": { schema: { $ref: "#/components/schemas/RenderJob" } } } },
          "404": { description: "Job not found" }
        }
      }
    }
  },
  components: {
    schemas: {
      UploadResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          files: { type: "array", items: { type: "string" } }
        }
      },
      VoiceRequest: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"]
      },
      VoiceResponse: {
        type: "object",
        properties: { audioUrl: { type: "string" } }
      },
      RenderRequest: {
        type: "object",
        properties: {
          media: { type: "array", items: { type: "string" } },
          audio: { type: "string" },
          format: { type: "string", enum: ["16:9", "9:16", "1:1"] }
        },
        required: ["media", "audio"]
      },
      RenderResponse: {
        type: "object",
        properties: {
          outputUrl: { type: "string" },
          format: { type: "string" }
        }
      },
      RenderJobResponse: {
        type: "object",
        properties: {
          jobId: { type: "string" },
          status: { type: "string" }
        }
      },
      RenderJob: {
        type: "object",
        properties: {
          jobId: { type: "string" },
          media: { type: "array", items: { type: "string" } },
          audio: { type: "string" },
          format: { type: "string" },
          status: { type: "string", enum: ["pending", "processing", "completed", "failed"] },
          progress: { type: "number" },
          outputUrl: { type: "string", nullable: true },
          error: { type: "string", nullable: true },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
