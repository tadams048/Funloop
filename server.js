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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to get embeddings from OpenAI
async function getEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-ada-002"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI API Error:", data);
    throw new Error("Failed to fetch embedding");
  }

  return data.data[0].embedding; // Return the embedding array
}



// Function to calculate cosine similarity
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (norm1 * norm2);
}

// API Endpoint: Compare Guess with Answer
app.post("/api/embedding", async (req, res) => {
  const { guess, answer } = req.body;

  if (!guess || !answer) {
    return res.status(400).json({ error: "Missing guess or answer" });
  }

  try {
    // Get embeddings
    const guessEmbedding = await getEmbedding(guess);
    const answerEmbedding = await getEmbedding(answer);

    // Compute similarity
    const similarity = cosineSimilarity(guessEmbedding, answerEmbedding);
    console.log(`Similarity score: ${similarity}`);

    // Return the similarity score
    res.json({ similarity });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});