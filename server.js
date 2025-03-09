const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // If you're on Node 18+, you can skip this.

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // <-- This automatically sets Access-Control-Allow-Origin: *

// If you prefer manual headers instead of cors(), you can do:
/*
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
*/

// Hugging Face key
const HF_API_KEY = "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";

// Proxy endpoint
app.post("/api/embedding", async (req, res) => {
  const { guess, answer } = req.body;

  if (!guess || !answer) {
    return res.status(400).json({ error: "Missing guess or answer" });
  }

  try {
    // Call Hugging Face's API using the sentence similarity format.
    const response = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2?wait_for_model=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: guess,      // The user's guess
            sentences: [answer]          // The correct answer (or one of them)
          }
        })
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Error from HF API:", response.status, errorDetails);
      return res.status(response.status).json({ error: "Failed to fetch embedding", details: errorDetails });
    }

    // Parse the similarity scores.
    const scores = await response.json();
    // Expecting the response to be an array like [0.85]
    const similarity = scores[0];
    console.log("Similarity score from HF API:", similarity);

    // Return the similarity score to the client.
    res.json({ similarity });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
