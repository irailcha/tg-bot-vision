import TelegramBot from "node-telegram-bot-api";
import express from "express";
import axios from "axios";
import "dotenv/config";
import { OpenAI } from "openai";
import sharp from "sharp";

const app = express();
const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

bot.on("webhook_error", (error) => {
  console.log(error.code); // => 'EPARSE'
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

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const photo = msg.photo[msg.photo.length - 1];
  const file = await bot.getFile(photo.file_id);
  const imageUrl = `https://api.telegram.org/file/bot${process.env.TOKEN}/${file.file_path}`;

  try {
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(imageResponse.data, "binary");

    const processedImage = await sharp(imageBuffer).resize(256, 256).toBuffer();

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `What’s in this image? [image data: ${processedImage.toString(
            "base64"
          )}]`,
        },
      ],
    });

    const description = response.choices[0].message.content;
    bot.sendMessage(chatId, `I think it's: ${description}`);
  } catch (error) {
    console.error("Error:", error.message);
    bot.sendMessage(chatId, "Sorry, I could not recognize the image.");
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
