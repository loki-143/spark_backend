const express = require("express");
const router = express.Router();
const { runCode } = require("../controllers/codeController");

router.post("/", runCode); // <- Fixed route

module.exports = router;
