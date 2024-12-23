const TelegramBot = require('node-telegram-bot-api');

// Заміни на новий токен
const token = '7766962148:AAHa6D3Tdwdhj1c09bEBq0oZAdM8MR3NlNo';

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