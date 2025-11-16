import { Router, Request, Response } from "express";
import OpenAI from "openai";

const router = Router();

// Only allow ~8 KB of frontend snapshot
const SNAPSHOT_CHAR_LIMIT = 8000;

// Warn if missing key (no crash)
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY missing — /api/v1/ai/ask will return 503.");
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Simple ping
router.get("/", (_req, res) => {
  res.send("✅ AI route active. POST /api/v1/ai/ask");
});

// Optional status endpoint
router.get("/status", (_req, res) => {
  res.json({
    ok: Boolean(process.env.OPENAI_API_KEY),
    model: "gpt-4o-mini",
  });
});

// Main route
router.post("/ask", async (req: Request, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: "Service not configured",
        details: "Missing OPENAI_API_KEY",
      });
    }

    const { question, frontendData } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        details: "Missing 'question' (string required)",
      });
    }

    // Apply snapshot limiter
    const json = JSON.stringify(frontendData ?? {});
    const snapshot =
      json.length > SNAPSHOT_CHAR_LIMIT
        ? json.slice(0, SNAPSHOT_CHAR_LIMIT) + "… [truncated]"
        : json;

    // Timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    // ---- OpenAI Call (CORRECT 2025 FORMAT) ----
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You are the AI assistant of the HIRA Staffing Tool. You analyze healthcare staffing inputs and provide concise answers.",
          },
          {
            role: "user",
            content:
              `Question: ${question}\n\n` +
              `Frontend snapshot (JSON):\n${snapshot}`,
          },
        ],
      },
      {
        signal: controller.signal, // <-- CORRECT: second argument
      }
    );
    // -------------------------------------------

    clearTimeout(timeout);

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return res.status(502).json({ error: "No content returned by OpenAI" });
    }

    return res.json({ answer });
  } catch (err: any) {
    console.error("AI /ask error →", {
      message: err?.message,
      name: err?.name,
      type: err?.type,
      status: err?.status,
      stack: err?.stack,
      data: err?.response?.data,
    });

    return res.status(err?.status ?? 500).json({
      error: "AI request failed",
      details: err?.message ?? "Unknown error",
    });
  }
});

export default router;