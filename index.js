const TelegramBot = require('node-telegram-bot-api');

// Токен твого бота
const token = '7766962148:AAHa6D3Tdwdhj1c09bEBq0oZAdM8MR3NlNo';

// Ініціалізація бота
const bot = new TelegramBot(token, { polling: true });

// Логування запуску
console.log('Бот успішно запущено!');

// Зберігання даних користувачів
let users = {};

// Відповідь на команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'Користувач';

    // Якщо вже відповідали, не реагуємо
    if (users[chatId]) {
        bot.sendMessage(chatId, 'Ви вже запускали бота! Спробуйте інші команди.');
        console.log(`Повторна команда від ${name} (${chatId})`);
        return;
    }

    // Додаємо користувача до списку
    users[chatId] = { name: name, tasksCompleted: 0, balance: 0 };

    // Відповідь
    bot.sendMessage(chatId, `Привіт, ${name}! Це твій Telegram бот. Використовуй /help, щоб побачити доступні команди.`);
    console.log(`Користувач ${name} (${chatId}) вперше використав /start`);
});

// Команда /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpMessage = `
Команди:
- /start: Запустити бота
- /help: Список команд
- /balance: Переглянути баланс
- /task: Виконати завдання для заробітку
- /leaderboard: Таблиця лідерів
- /reset: Скинути прогрес
    `;

    bot.sendMessage(chatId, helpMessage);
});

// Команда /balance
bot.onText(/\/balance/, (msg) => {
    const chatId = msg.chat.id;

    if (!users[chatId]) {
        bot.sendMessage(chatId, 'Вам потрібно спочатку запустити бота через /start.');
        return;
    }

    const balance = users[chatId].balance;
    bot.sendMessage(chatId, `Ваш баланс: ${balance} DEXP.`);
});

// Команда /task
bot.onText(/\/task/, (msg) => {
    const chatId = msg.chat.id;

    if (!users[chatId]) {
        bot.sendMessage(chatId, 'Вам потрібно спочатку запустити бота через /start.');
        return;
    }

    // Завдання
    const reward = Math.floor(Math.random() * 500) + 1;
    users[chatId].balance += reward;
    users[chatId].tasksCompleted += 1;

    bot.sendMessage(chatId, `Ви виконали завдання і отримали ${reward} DEXP! Ваш новий баланс: ${users[chatId].balance} DEXP.`);
});

// Команда /leaderboard
bot.onText(/\/leaderboard/, (msg) => {
    const chatId = msg.chat.id;

    // Створення таблиці лідерів
    let leaderboard = '🏆 Таблиця лідерів 🏆\n';
    const sortedUsers = Object.entries(users).sort((a, b) => b[1].balance - a[1].balance);

    sortedUsers.slice(0, 10).forEach(([id, user], index) => {
        leaderboard += `${index + 1}. ${user.name} — ${user.balance} DEXP\n`;
    });

    bot.sendMessage(chatId, leaderboard);
});

// Команда /reset
bot.onText(/\/reset/, (msg) => {
    const chatId = msg.chat.id;

    if (!users[chatId]) {
        bot.sendMessage(chatId, 'Вам потрібно спочатку запустити бота через /start.');
        return;
    }

    users[chatId].balance = 0;
    users[chatId].tasksCompleted = 0;

    bot.sendMessage(chatId, 'Ваш прогрес скинуто. Почнімо з початку!');
});

// Логування повідомлень
bot.on('message', (msg) => {
    console.log(`Повідомлення від ${msg.from.first_name}: ${msg.text}`);
});

// Обробка помилок
bot.on('polling_error', (error) => {
    console.error('Помилка polling:', error.message);
});

// Експорт для Vercel
module.exports = (req, res) => {
    res.status(200).send("Telegram бот працює!");
};