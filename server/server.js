require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const start = async () => {
  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } else {
    console.warn("MONGODB_URI not set; skipping MongoDB connection.");
  }

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
