const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

// Отримуємо токен з середовища (встановлений у vercel.json)
const token = process.env.BOT_TOKEN;
const dbPath = process.env.DB_PATH;

// Ініціалізація бота
const bot = new TelegramBot(token, { polling: true });

// Ініціалізація бази даних
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Database opened successfully");
  }
});

// Створення таблиці для збереження балансу користувачів
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, balance INTEGER DEFAULT 0)");

// Функція для отримання балансу користувача
const getUserBalance = (userId) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
      if (err) reject(err);
      resolve(row ? row.balance : 0);
    });
  });
};

// Функція для оновлення балансу користувача
const updateUserBalance = (userId, amount) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT OR REPLACE INTO users (id, balance) VALUES (?, ?)", [userId, amount], (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

// Привітальне повідомлення
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  try {
    const balance = await getUserBalance(chatId);
    bot.sendMessage(chatId, `Привіт, @${username}! Ваш баланс: ${balance} DEXP`);
  } catch (err) {
    bot.sendMessage(chatId, 'Виникла помилка при отриманні балансу.');
  }
});

// Команда для отримання балансу
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const balance = await getUserBalance(chatId);
    bot.sendMessage(chatId, `Ваш баланс: ${balance} DEXP`);
  } catch (err) {
    bot.sendMessage(chatId, 'Виникла помилка при отриманні балансу.');
  }
});

// Команда для отримання винагороди (наприклад, 100 DEXP кожні 2 години)
cron.schedule('0 */2 * * *', async () => {
  // Перебір всіх користувачів і оновлення їх балансу
  db.each("SELECT id FROM users", async (err, row) => {
    if (err) throw err;
    const currentBalance = await getUserBalance(row.id);
    const newBalance = currentBalance + 100;
    await updateUserBalance(row.id, newBalance);
    bot.sendMessage(row.id, `Ваш баланс був оновлений на 100 DEXP. Тепер: ${newBalance} DEXP`);
  });
});

// Лідерборд: виведення топ 10 користувачів з найвищим балансом
bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;
  db.all("SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10", (err, rows) => {
    if (err) {
      bot.sendMessage(chatId, 'Не вдалося отримати лідерборд.');
      return;
    }
    let leaderboard = 'Топ 10 користувачів:\n';
    rows.forEach((row, index) => {
      leaderboard += `${index + 1}. @${row.username} - ${row.balance} DEXP\n`;
    });
    bot.sendMessage(chatId, leaderboard);
  });
});

// Створення нового користувача, якщо він не існує
bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.new_chat_member.id;
  const username = msg.new_chat_member.username;

  db.get("SELECT id FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      bot.sendMessage(chatId, 'Не вдалося перевірити користувача в базі даних.');
      return;
    }
    if (!row) {
      db.run("INSERT INTO users (id, username) VALUES (?, ?)", [userId, username], (err) => {
        if (err) {
          bot.sendMessage(chatId, 'Не вдалося додати користувача в базу даних.');
        } else {
          bot.sendMessage(chatId, `Вітаємо @${username}, ви зареєстровані в боте!`);
        }
      });
    }
  });
});

// Запуск бота
console.log('Bot is running...');