const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Conversation = require("../models/Conversation");

//  Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log(
  "GEMINI KEY LOADED:",
  process.env.GEMINI_API_KEY ? "YES" : "NO - KEY MISSING!",
);

// AI Route
router.post("/ask-ai", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    console.log("Sending request to Gemini...");

    //  Using the current stable flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Safety check: ensure the response actually contains text
    const text = response.text();

    console.log(" Gemini response received");

    return res.json({
      success: true,
      answer: text,
    });
  } catch (err) {
    console.error("Gemini Error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message || "AI request failed",
    });
  }
});

//  Save Route
router.post("/save", async (req, res) => {
  const { prompt, response } = req.body;

  if (!prompt || !response) {
    return res.status(400).json({
      error: "Prompt and response are required",
    });
  }

  try {
    const doc = await Conversation.create({ prompt, response });

    console.log(" Data saved to MongoDB");

    return res.json({
      success: true,
      id: doc._id,
    });
  } catch (err) {
    console.error(" Save Error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
