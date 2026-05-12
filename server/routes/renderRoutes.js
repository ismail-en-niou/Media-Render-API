const express = require("express");
const { renderHandler } = require("../controllers/renderController");

const router = express.Router();

router.post("/", renderHandler);

module.exports = router;
