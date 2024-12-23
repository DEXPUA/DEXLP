const TelegramBot = require('node-telegram-bot-api');

// Токен твого бота
const token = '7766962148:AAHa6D3Tdwdhj1c09bEBq0oZAdM8MR3NlNo'; 
const bot = new TelegramBot(token, { polling: true });

// Привітальне повідомлення при запуску
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привіт! Це твій Telegram бот!');
});

// Обробка інших команд
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Це твій бот. Напиши /start, щоб почати!');
}); 