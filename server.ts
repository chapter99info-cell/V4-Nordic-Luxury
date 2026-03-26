import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Route for Google Script Webhook
  app.post("/api/webhook/google-script", async (req, res) => {
    let googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!googleScriptUrl) {
      console.warn("GOOGLE_SCRIPT_URL is not defined in environment variables.");
      return res.status(500).json({ error: "Webhook URL not configured" });
    }

    // Sanitize URL (handle potential markdown link syntax from copy-paste)
    const markdownMatch = googleScriptUrl.match(/\[.*\]\((.*)\)/);
    if (markdownMatch) {
      googleScriptUrl = markdownMatch[1];
    }
    googleScriptUrl = googleScriptUrl.trim();

    try {
      const response = await fetch(googleScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Error calling Google Script webhook:", error);
      res.status(500).json({ error: "Failed to trigger webhook" });
    }
  });

  // API Route for LINE Notify Proxy
  app.post("/api/notify/line", async (req, res) => {
    const { token, message } = req.body;
    if (!token || !message) {
      return res.status(400).json({ error: "Token and message are required" });
    }

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
      console.error("Error calling LINE Notify:", error);
      res.status(500).json({ error: "Failed to send LINE notification" });
    }
  });

  // API Route for LINE Messaging API (Push Message)
  app.post("/api/line/push", async (req, res) => {
    const { channelAccessToken, to, message } = req.body;
    if (!channelAccessToken || !to || !message) {
      return res.status(400).json({ error: "Channel Access Token, recipient ID (to), and message are required" });
    }

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${channelAccessToken}`,
        },
        body: JSON.stringify({
          to,
          messages: [
            {
              type: "text",
              text: message,
            },
          ],
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("LINE API Error:", result);
        return res.status(response.status).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error("Error calling LINE Messaging API:", error);
      res.status(500).json({ error: "Failed to send LINE push message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
