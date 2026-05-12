const express = require("express");
const { getRenderStatus, startRender } = require("../controllers/renderJobController");

const router = express.Router();

router.post("/", startRender);
router.get("/:jobId", getRenderStatus);

module.exports = router;
