const TelegramBot = require('node-telegram-bot-api');

// Встав свій токен тут
const token = '7766962148:AAHa6D3Tdwdhj1c09bEBq0oZAdM8MR3NlNo';

// Створюємо бота
const bot = new TelegramBot(token, { polling: true });

// Логування запуску бота
console.log('Бот запущено');

// Обробка команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || 'Користувач';

  // Відповідь на команду
  bot.sendMessage(chatId, `Привіт, ${name}! Це твій Telegram бот!`);
});

// Логування інших повідомлень
bot.on('message', (msg) => {
  console.log(`Повідомлення від ${msg.from.first_name}: ${msg.text}`);
});

// Обробка помилок
bot.on('polling_error', (error) => {
  console.error('Помилка polling:', error.message);
});

// Для серверного розгортання (наприклад, на Vercel)
module.exports = async (req, res) => {
  res.status(200).send('Telegram бот працює');
}; 