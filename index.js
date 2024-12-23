const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Токен твого бота
const token = '7766962148:AAHa6D3Tdwdhj1c09bEBq0oZAdM8MR3NlNo';

// Ініціалізація бота через Webhook
const bot = new TelegramBot(token, { webHook: true });

// Вказуємо адресу Webhook
const app = express();
const port = process.env.PORT || 3000;

bot.setWebHook(`https://dexlp.vercel.app/bot${token}`);

// Зберігання даних користувачів
let users = {};

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'Користувач';

    if (users[chatId]) {
        bot.sendMessage(chatId, 'Ви вже запускали бота!');
        return;
    }

    users[chatId] = { name: name, balance: 0, tasks: 0 };
    bot.sendMessage(chatId, `Привіт, ${name}! Вітаю у боті.`);
});

// Команда /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Список команд:\n/start - Запуск бота\n/help - Довідка\n/balance - Баланс\n/task - Виконати завдання`);
});

// Команда /balance
bot.onText(/\/balance/, (msg) => {
    const chatId = msg.chat.id;

    if (!users[chatId]) {
        bot.sendMessage(chatId, 'Спершу скористайтеся /start.');
        return;
    }

    bot.sendMessage(chatId, `Ваш баланс: ${users[chatId].balance} DEXP.`);
});

// Команда /task
bot.onText(/\/task/, (msg) => {
    const chatId = msg.chat.id;

    if (!users[chatId]) {
        bot.sendMessage(chatId, 'Спершу скористайтеся /start.');
        return;
    }

    const reward = Math.floor(Math.random() * 500) + 1;
    users[chatId].balance += reward;

    bot.sendMessage(chatId, `Ви виконали завдання та отримали ${reward} DEXP! Ваш новий баланс: ${users[chatId].balance} DEXP.`);
});

// Express сервер для Webhook
app.use(express.json());
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущено на порті ${port}`);
});