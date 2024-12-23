const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');

// Ваш токен
const token = '7766962148:AAHa6D3Tdwdhj1c09bEBq0oZAdM8MR3NlNo';

// Підключення до MongoDB
const uri = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

// Ініціалізація бота
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Підключення до бази даних
    await client.connect();
    db = client.db('telegram_bot');

    const userCollection = db.collection('users');
    const user = await userCollection.findOne({ chatId });

    if (!user) {
      // Додати користувача до бази, якщо його немає
      await userCollection.insertOne({ chatId, balance: 0 });
      bot.sendMessage(chatId, 'Привіт! Ти тільки що зареєструвався!');
    } else {
      bot.sendMessage(chatId, `Привіт! Твій баланс: ${user.balance} DEXP`);
    }
  } catch (err) {
    console.log('Помилка при підключенні до MongoDB:', err);
    bot.sendMessage(chatId, 'Сталася помилка при збереженні даних!');
  }
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Отримати баланс з MongoDB
    const userCollection = db.collection('users');
    const user = await userCollection.findOne({ chatId });

    if (user) {
      bot.sendMessage(chatId, `Твій баланс: ${user.balance} DEXP`);
    } else {
      bot.sendMessage(chatId, 'Ти ще не зареєстрований у системі!');
    }
  } catch (err) {
    console.log('Помилка при отриманні балансу:', err);
    bot.sendMessage(chatId, 'Сталася помилка при отриманні балансу!');
  }
});

bot.onText(/\/reward/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Оновити баланс користувача
    const userCollection = db.collection('users');
    const user = await userCollection.findOne({ chatId });

    if (user) {
      const newBalance = user.balance + 100; // Додавання 100 DEXP
      await userCollection.updateOne({ chatId }, { $set: { balance: newBalance } });
      bot.sendMessage(chatId, `Ти отримав 100 DEXP! Твій новий баланс: ${newBalance} DEXP`);
    } else {
      bot.sendMessage(chatId, 'Ти ще не зареєстрований у системі!');
    }
  } catch (err) {
    console.log('Помилка при оновленні балансу:', err);
    bot.sendMessage(chatId, 'Сталася помилка при нарахуванні винагороди!');
  }
});

// Експортуємо функцію для Vercel
module.exports = (req, res) => {
  res.status(200).send('Bot is running!');
};

// Закриваємо з'єднання з MongoDB, коли процес завершується
process.on('exit', () => {
  client.close();
});