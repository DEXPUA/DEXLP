const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const schedule = require('node-schedule');

// Ваш токен бота
const token = 'YOUR_BOT_TOKEN';  // Замініть на ваш токен

// Ініціалізація бота з параметром polling
const bot = new TelegramBot(token, { polling: true });

// Підключення до SQLite бази даних
let db;
open({
  filename: './dexlp.db',
  driver: sqlite3.Database
}).then(database => {
  db = database;
  console.log('Connected to SQLite database');
  
  // Створення таблиць при першому запуску
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER UNIQUE,
    balance INTEGER DEFAULT 1000,
    tasksCompleted INTEGER DEFAULT 0
  )`);
}).catch(err => console.error(err));

// Функція для додавання нового користувача
async function addUser(chatId) {
  const stmt = db.prepare('INSERT OR IGNORE INTO users (chatId) VALUES (?)');
  stmt.run(chatId);
  stmt.finalize();
}

// Функція для отримання балансу користувача
async function getUserBalance(chatId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT balance FROM users WHERE chatId = ?', [chatId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.balance : 0);
      }
    });
  });
}

// Функція для оновлення балансу користувача
async function updateUserBalance(chatId, amount) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET balance = balance + ? WHERE chatId = ?', [amount, chatId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// Обробка команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || 'Користувач';

  // Додавання нового користувача в базу
  addUser(chatId);

  // Привітальне повідомлення
  bot.sendMessage(chatId, `Привіт, ${name}! Це твій Telegram бот. Вибери команду для взаємодії.`);
  
  // Кнопки
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Баланс', callback_data: 'balance' }],
        [{ text: 'Завдання', callback_data: 'tasks' }],
        [{ text: 'Друзі', callback_data: 'friends' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Що хочеш зробити?', options);
});

// Обробка кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  switch (data) {
    case 'balance':
      // Логіка балансу
      const balance = await getUserBalance(chatId);
      bot.sendMessage(chatId, `Твій баланс: ${balance} DEXP`);
      break;
    case 'tasks':
      // Логіка завдань
      bot.sendMessage(chatId, 'Завдання: Пройти тест на знання про криптовалюти!');
      break;
    case 'friends':
      // Логіка друзів
      bot.sendMessage(chatId, 'Ти не маєш друзів, але можеш запросити нових!');
      break;
    default:
      bot.sendMessage(chatId, 'Невідома команда');
  }
});

// Реалізація іншої команди
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Щоб почати роботу, використовуйте команду /start.');
});

// Функція для автоматичного оновлення балансу кожні 2 години
schedule.scheduleJob('0 */2 * * *', async () => {
  console.log('Баланс оновлений для всіх користувачів!');
  
  // Додаємо 100 DEXP кожному користувачу
  db.each('SELECT chatId FROM users', async (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    await updateUserBalance(row.chatId, 100);
  });
});

// Збір статистики кожні 24 години
schedule.scheduleJob('0 0 * * *', () => {
  console.log('Щоденна статистика...');
  // Логіка збору статистики
  // Наприклад, підрахунок кількості користувачів
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Кількість користувачів: ${row.count}`);
  });
});