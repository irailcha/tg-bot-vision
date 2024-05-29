import TelegramBot from "node-telegram-bot-api";
import express from "express";
import multer from "multer";
import "dotenv/config";
import { OpenAI } from "openai";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Hi! Send a picture");
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  const fileBuffer = req.file.buffer;
  try {
    const response = await openai.createImage({ image: fileBuffer });
    res.json({ description: response.data.description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
