const express = require("express");
const { listUploads, deleteUpload } = require("../controllers/uploadsController");

const router = express.Router();

router.get("/", listUploads);
router.delete("/:filename", deleteUpload);

module.exports = router;
