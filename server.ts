import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Transcription Summarization
  app.post("/api/summarize", async (req, res) => {
    try {
      const { transcription } = req.body;
      if (!transcription || typeof transcription !== "string" || !transcription.trim()) {
        return res.status(400).json({ error: "Transcription content is required." });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }
      
      // Lazy load GoogleGenAI as required by the dependency guidelines
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert executive assistant. Summarize the following meeting or relationship transcription in a structured format:
1. One-sentence high-level overview.
2. Short bulleted list of 2-4 key takeaways/insights (personal details, preferences, context).
3. Short bulleted list of actionable next steps/action items (if any).

Keep the output brief, professional, and formatted in clean markdown.

Transcription:
${transcription}`,
      });
      
      const summary = response.text || "No summary could be generated.";
      res.json({ summary });
    } catch (error: any) {
      console.error("Error generating AI summary:", error);
      res.status(500).json({ error: error.message || "An error occurred during summarization." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
