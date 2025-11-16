import { Router, Request, Response } from "express"
import OpenAI from "openai"

const router = Router()

// Safety: snapshot limiter so we don't send megabytes
const SNAPSHOT_CHAR_LIMIT = 8000 // ~8 KB

// Optional: early warning if key missing (won't crash)
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set. /api/v1/ai/ask will return a 503.")
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// GET /api/v1/ai – quick ping
router.get("/", (_req, res) => {
  res.send("✅ AI route active. Use POST /api/v1/ai/ask")
})

// GET /api/v1/ai/status – optional status check
router.get("/status", (_req, res) => {
  res.json({
    ok: Boolean(process.env.OPENAI_API_KEY),
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    model: "gpt-4o-mini",
  })
})

// POST /api/v1/ai/ask – main endpoint
router.post("/ask", async (req: Request, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: "Service not configured",
        details: "Missing OPENAI_API_KEY on the server.",
      });
    }

    const { question, frontendData } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Missing or invalid 'question' (string required).",
      });
    }

    // Snapshot limiter
    const json = JSON.stringify(frontendData ?? {});
    const snapshot =
      json.length > SNAPSHOT_CHAR_LIMIT
        ? json.slice(0, SNAPSHOT_CHAR_LIMIT) + "… [truncated]"
        : json;

    // Timeout + AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    // ---------- FIXED OPENAI CALL ----------
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You are the AI assistant of the HIRA Staffing Tool. You analyze healthcare staffing inputs and answer concise, helpful questions.",
          },
          {
            role: "user",
            content:
              `Question: ${question}\n\n` +
              `Frontend snapshot (JSON, possibly truncated):\n${snapshot}`,
          },
        ],
      },
      {
        signal: controller.signal, 
      }
    );
    // ----------------------------------------
    
    clearTimeout(timeout);

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return res.status(502).json({ error: "No content returned by model." });
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

    const status =
      err?.status && Number.isInteger(err.status) ? err.status : 500;

    const details =
      err?.response?.data?.error ||
      err?.message ||
      "Unknown error calling OpenAI.";

    return res.status(status).json({
      error: "AI request failed",
      details,
    });
  }
});


export default router
