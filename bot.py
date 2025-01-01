import logging
from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackQueryHandler, CallbackContext
import sqlite3
from datetime import datetime, timedelta

# Підключення до бази даних
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Створення таблиць, якщо вони не існують
cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT,
                    balance INTEGER DEFAULT 0,
                    referral_code TEXT,
                    last_bonus_time TEXT,
                    vip INTEGER DEFAULT 0,
                    friends TEXT DEFAULT ""
                    )''')

# Логування
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    level=logging.INFO)
logger = logging.getLogger(__name__)

# Основні функції

def start(update: Update, context: CallbackContext) -> None:
    user_id = update.message.from_user.id
    username = update.message.from_user.username
    referral_code = update.message.text.split()[1] if len(update.message.text.split()) > 1 else None

    # Якщо користувач вже є в базі даних
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user:
        # Додаємо нового користувача
        code = str(user_id) + 'REF'  # Генеруємо реферальний код
        cursor.execute("INSERT INTO users (id, username, referral_code) VALUES (?, ?, ?)", (user_id, username, code))
        conn.commit()
        update.message.reply_text(f"Вітаємо! Ви успішно зареєстровані. Ваш реферальний код: {code}")

    if referral_code:
        # Логіка для реферального коду
        cursor.execute("SELECT id FROM users WHERE referral_code = ?", (referral_code,))
        referrer = cursor.fetchone()

        if referrer:
            cursor.execute("UPDATE users SET balance = balance + 500 WHERE id = ?", (referrer[0],))
            cursor.execute("UPDATE users SET balance = balance + 100 WHERE id = ?", (user_id,))
            conn.commit()
            update.message.reply_text(f"Ви зареєструвались через реферальний код! Ви отримали бонус 100 DEXP. Ваш реферал отримав 500 DEXP!")
        else:
            update.message.reply_text("Невірний реферальний код.")
    else:
        update.message.reply_text("Вітаємо! Ви успішно зареєстровані.")

def vip(update: Update, context: CallbackContext) -> None:
    user_id = update.message.from_user.id
    cursor.execute("SELECT vip FROM users WHERE id = ?", (user_id,))
    vip_status = cursor.fetchone()

    if vip_status and vip_status[0] == 1:
        update.message.reply_text("Ви вже маєте VIP статус!")
    else:
        # Даємо VIP статус за певну кількість DEXP або умовами
        cursor.execute("UPDATE users SET vip = 1 WHERE id = ?", (user_id,))
        conn.commit()
        update.message.reply_text("Вітаємо! Ви отримали VIP статус!")

def add_friend(update: Update, context: CallbackContext) -> None:
    user_id = update.message.from_user.id
    friend_id = int(context.args[0])

    # Перевірка чи є друг в базі даних
    cursor.execute("SELECT * FROM users WHERE id = ?", (friend_id,))
    friend = cursor.fetchone()

    if not friend:
        update.message.reply_text("Цей користувач не існує в системі!")
        return

    cursor.execute("SELECT friends FROM users WHERE id = ?", (user_id,))
    friends = cursor.fetchone()[0]
    
    # Додавання друга до списку
    new_friends = friends + f"{friend_id}, " if friends else f"{friend_id}, "
    cursor.execute("UPDATE users SET friends = ? WHERE id = ?", (new_friends, user_id))
    conn.commit()

    update.message.reply_text(f"Користувач {friend_id} успішно доданий у ваш список друзів!")

def leaderboard(update: Update, context: CallbackContext) -> None:
    # Підключення до бази даних і отримання топ 10 користувачів
    cursor.execute("SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10")
    top_users = cursor.fetchall()

    # Формування повідомлення з лідерами
    leaderboard_msg = "Лідери:\n"
    for idx, user in enumerate(top_users, 1):
        leaderboard_msg += f"{idx}. {user[0]} - {user[1]} DEXP\n"

    update.message.reply_text(leaderboard_msg)

def retro_bonus(update: Update, context: CallbackContext) -> None:
    user_id = update.message.from_user.id
    current_time = datetime.now()

    # Перевірка, коли користувач востаннє отримував бонус
    cursor.execute("SELECT last_bonus_time FROM users WHERE id = ?", (user_id,))
    last_bonus = cursor.fetchone()

    if last_bonus:
        last_bonus_time = datetime.strptime(last_bonus[0], "%Y-%m-%d %H:%M:%S")
        if current_time - last_bonus_time >= timedelta(hours=24):
            # Нарахування бонусу
            cursor.execute("UPDATE users SET balance = balance + 100 WHERE id = ?", (user_id,))
            cursor.execute("UPDATE users SET last_bonus_time = ? WHERE id = ?", (current_time.strftime("%Y-%m-%d %H:%M:%S"), user_id))
            conn.commit()
            update.message.reply_text("Ви отримали ретро бонус 100 DEXP!")
        else:
            update.message.reply_text("Ви вже отримували бонус сьогодні. Спробуйте пізніше.")
    else:
        update.message.reply_text("Щось пішло не так. Спробуйте ще раз.")

def help_command(update: Update, context: CallbackContext) -> None:
    help_text = """
    Доступні команди:
    /start - Почати використання бота.
    /leaderboard - Переглянути лідерів.
    /retrobonus - Отримати ретро бонус.
    /vip - Оформити VIP статус.
    /addfriend <ID друга> - Додати друга до списку.
    """
    update.message.reply_text(help_text)

def main():
    # Вказуємо токен вашого бота
    TOKEN = '8008430295:AAFATrn-vbY1365zwKEYA_CTW5lxRfhdAG8'
    
    updater = Updater(TOKEN, use_context=True)

    dp = updater.dispatcher

    # Додаємо обробники команд
    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("leaderboard", leaderboard))
    dp.add_handler(CommandHandler("retrobonus", retro_bonus))
    dp.add_handler(CommandHandler("vip", vip))
    dp.add_handler(CommandHandler("addfriend", add_friend))
    dp.add_handler(CommandHandler("help", help_command))

    # Запускаємо бота
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()