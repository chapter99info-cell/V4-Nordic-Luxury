const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Routes
app.post("/api/webhook/google-script", async (req, res) => {
  let googleScriptUrl = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyy5PaAAflJzCGGz6U7TdszDHPv82NC45Eo3kzHk4kbGkVFVn2tiNYn2SGfrknM0zNBbA/exec';
  try {
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger webhook" });
  }
});

app.post("/api/notify/line", async (req, res) => {
  const { token, message } = req.body;
  try {
    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }).toString(),
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to send LINE notification" });
  }
});

// Serve static files
const distPath = path.join(__dirname, "dist");

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = require("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is ready! Let’s go Forestville! Running on port ${PORT}`);
  });
}

startServer();
