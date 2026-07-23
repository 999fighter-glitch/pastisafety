import express, { Request, Response } from "express";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

// Runtime config in memory
let runtimeConfig = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
};

async function getEffectiveTelegramConfig() {
  let token = runtimeConfig.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "";
  let chatId = runtimeConfig.telegramChatId || process.env.TELEGRAM_CHAT_ID || "";

  if (!token || !chatId) {
    try {
      const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "sustained-sandbox-w5xj8";
      const dbId = process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-8f3dbb41-3cc2-4a80-9f09-efcd98f45929";
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/systemConfig/telegram`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const fields = data.fields || {};
        if (!token && fields.botToken?.stringValue) token = fields.botToken.stringValue;
        if (!chatId && fields.chatId?.stringValue) chatId = fields.chatId.stringValue;
        runtimeConfig.telegramBotToken = token;
        runtimeConfig.telegramChatId = chatId;
      }
    } catch (err) {
      console.warn("Could not fetch telegram config from Firestore REST:", err);
    }
  }

  return { token, chatId };
}

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", environment: "Netlify Serverless Function" });
});

// GET Telegram Config
app.get("/api/telegram-config", async (req: Request, res: Response) => {
  const { token, chatId } = await getEffectiveTelegramConfig();
  const maskedToken = token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : "";
  const maskedChatId = chatId ? `${chatId.substring(0, 3)}...${chatId.substring(chatId.length - 2)}` : "";

  res.json({
    tokenConfigured: Boolean(token),
    chatIdConfigured: Boolean(chatId),
    token: maskedToken,
    chatId: maskedChatId,
  });
});

// POST Update Telegram Config
app.post("/api/telegram-config", async (req: Request, res: Response) => {
  const { token, chatId } = req.body;
  if (typeof token === 'string') runtimeConfig.telegramBotToken = token.trim();
  if (typeof chatId === 'string') runtimeConfig.telegramChatId = chatId.trim();

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "sustained-sandbox-w5xj8";
    const dbId = process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-8f3dbb41-3cc2-4a80-9f09-efcd98f45929";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/systemConfig/telegram`;
    
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          botToken: { stringValue: runtimeConfig.telegramBotToken },
          chatId: { stringValue: runtimeConfig.telegramChatId },
          updatedAt: { stringValue: new Date().toISOString() }
        }
      })
    });
  } catch (err) {
    console.warn("Failed to persist telegram config to Firestore:", err);
  }

  res.json({
    success: true,
    message: "Telegram configuration updated on Netlify Serverless Backend and Firebase."
  });
});

// GET Firebase Details
app.get("/api/firebase-config", (req: Request, res: Response) => {
  res.json({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "sustained-sandbox-w5xj8",
    databaseId: process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-8f3dbb41-3cc2-4a80-9f09-efcd98f45929",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "sustained-sandbox-w5xj8.firebaseapp.com",
    status: "connected"
  });
});

// GET Test Telegram
app.get("/api/test-telegram", async (req: Request, res: Response) => {
  const { token } = await getEffectiveTelegramConfig();

  if (!token) {
    return res.status(400).json({ error: "Telegram token missing. Sila tetapkan TELEGRAM_BOT_TOKEN dalam Netlify Environment Variables." });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Ralat komunikasi dengan Telegram API." });
  }
});

// POST Send Telegram Message
app.post("/api/send-telegram", async (req: Request, res: Response) => {
  const { message, token: customToken, chatId: customChatId } = req.body;
  const config = await getEffectiveTelegramConfig();
  const token = customToken || config.token;
  const chatId = customChatId || config.chatId;

  if (!token || !chatId) {
    return res.status(400).json({ error: "Telegram configuration missing. Sila tetapkan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID dalam Netlify Environment Variables." });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message || "Percubaan notifikasi sistem PASTI Kuala Langat",
        parse_mode: "Markdown",
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal menghantar mesej ke Telegram." });
  }
});

export const handler = serverless(app);
