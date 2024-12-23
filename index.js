const TelegramBot = require('node-telegram-bot-api');

// Замінити на свій токен
const token = 'YOUR_BOT_API_TOKEN';

// Створюємо нового бота
const bot = new TelegramBot(token, { polling: true });

// Обробка команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привіт! Це твій бот!');
});

// Обробка команди /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Це твій бот. Напиши /start, щоб почати!');
});

// Експортуємо функцію для обробки запитів на Vercel
module.exports = (req, res) => {
  res.status(200).send('Bot is working');
};