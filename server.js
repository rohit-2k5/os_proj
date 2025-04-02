const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/page_replacement")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Schema & Model
const PageFrameSchema = new mongoose.Schema({
  algorithm: String,
  frames: [Number],
  pageFaults: Number,
  timestamp: { type: Date, default: Date.now }
});

const PageFrame = mongoose.model("PageFrame", PageFrameSchema);

// Routes
app.post("/simulate", async (req, res) => {
  const { algorithm, pages, frameSize } = req.body;
  if (!algorithm || !pages || !frameSize) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const result = runPageReplacementAlgorithm(algorithm, pages, frameSize);

  const newSimulation = new PageFrame({
    algorithm,
    frames: result.frames,
    pageFaults: result.pageFaults
  });

  await newSimulation.save();
  res.json(result);
});

// Page Replacement Algorithm Logic
function runPageReplacementAlgorithm(algorithm, pages, frameSize) {
  let pageFaults = 0;
  let frames = [];

  if (algorithm === "FIFO") {
    let queue = [];

    pages.forEach(page => {
      if (!queue.includes(page)) {
        if (queue.length >= frameSize) {
          queue.shift(); // Remove the oldest page
        }
        queue.push(page);
        pageFaults++;
      }
    });
    frames = [...queue];
  } 
  else if (algorithm === "LRU") {
    let cache = new Map();

    pages.forEach(page => {
      if (!cache.has(page)) {
        if (cache.size >= frameSize) {
          // Find the least recently used page
          const leastUsedPage = [...cache.entries()].reduce((a, b) => (a[1] < b[1] ? a : b))[0];
          cache.delete(leastUsedPage);
        }
        pageFaults++;
      } else {
        cache.delete(page); // Remove from its old position
      }
      cache.set(page, Date.now()); // Reinsert to mark as recently used
    });

    frames = [...cache.keys()].slice(-frameSize); // Ensure only the latest `frameSize` pages are returned
  } else {
    return { error: "Invalid algorithm" };
  }

  return { frames, pageFaults };
}

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));