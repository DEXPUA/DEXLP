const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Токен бота з змінної середовища
const token = process.env.BOT_TOKEN;

// Ініціалізуємо бота з параметром polling
const bot = new TelegramBot(token, { polling: true });

// Шлях до бази даних для Vercel (тимчасове сховище)
const dbPath = path.join(__dirname, 'botdata.db');

// Ініціалізуємо базу даних SQLite
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Помилка при підключенні до бази даних: ', err.message);
  } else {
    console.log('База даних підключена!');
    // Створення таблиці, якщо її не існує
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT,
      username TEXT,
      balance INTEGER DEFAULT 0
    )`, (err) => {
      if (err) {
        console.error('Помилка при створенні таблиці: ', err.message);
      }
    });
  }
});

// Обробка команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Перевіряємо чи є користувач в базі
  db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
    if (err) {
      bot.sendMessage(chatId, 'Сталася помилка при перевірці користувача!');
      return;
    }

    if (row) {
      // Якщо користувач знайдений, вітаємо
      bot.sendMessage(chatId, `Привіт, ${msg.from.first_name}! Ваш баланс: ${row.balance} DEXP`);
    } else {
      // Якщо користувач не знайдений, додаємо його до бази
      db.run('INSERT INTO users (telegram_id, username) VALUES (?, ?)', [chatId, msg.from.username], (err) => {
        if (err) {
          bot.sendMessage(chatId, 'Не вдалося додати користувача в базу!');
        } else {
          bot.sendMessage(chatId, `Привіт, ${msg.from.first_name}! Ви зареєстровані! Ваш баланс: 0 DEXP`);
        }
      });
    }
  });
});

// Обробка команди /balance для перевірки балансу
bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;

  db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
    if (err) {
      bot.sendMessage(chatId, 'Сталася помилка при отриманні балансу!');
      return;
    }

    if (row) {
      bot.sendMessage(chatId, `Ваш баланс: ${row.balance} DEXP`);
    } else {
      bot.sendMessage(chatId, 'Ви не зареєстровані! Використайте команду /start для реєстрації.');
    }
  });
});

// Обробка команди /reward для нарахування винагороди
bot.onText(/\/reward/, (msg) => {
  const chatId = msg.chat.id;

  db.get('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, row) => {
    if (err) {
      bot.sendMessage(chatId, 'Сталася помилка при нарахуванні винагороди!');
      return;
    }

    if (row) {
      const newBalance = row.balance + 100; // Додаємо 100 DEXP
      db.run('UPDATE users SET balance = ? WHERE telegram_id = ?', [newBalance, chatId], (err) => {
        if (err) {
          bot.sendMessage(chatId, 'Не вдалося оновити баланс!');
        } else {
          bot.sendMessage(chatId, `Вітаємо! Ви отримали 100 DEXP! Ваш новий баланс: ${newBalance} DEXP`);
        }
      });
    } else {
      bot.sendMessage(chatId, 'Ви не зареєстровані! Використайте команду /start для реєстрації.');
    }
  });
});

// Обробка помилок бота
bot.on("polling_error", (err) => {
  console.error("Помилка при опитуванні: ", err);
});

// Закриття з'єднання з базою даних, коли бот вимикається
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('Помилка при закритті бази даних: ', err.message);
    } else {
      console.log('База даних закрита!');
    }
  });
});