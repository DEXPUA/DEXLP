import random
import string
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, CallbackContext

# Ваш токен
TOKEN = "7776186936:AAHr25s_q4aUesSEPPOAgvXfs6a11YT-Bqc"

# Словник для зберігання балансу, друзів та виконаних завдань
users_data = {}

# Генерація випадкових промокодів
def generate_promocode():
    promo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return promo

# Команда старт
async def start(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    if user_id not in users_data:
        users_data[user_id] = {
            'balance': 0,
            'friends': [],
            'tasks_completed': [],
            'promocode_used': False
        }
    await update.message.reply_text('Привіт! Це твій бот. Використовуй команди для взаємодії.')

# Команда отримати DEXP кожні 2 години
async def get_dexp(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    if user_id in users_data:
        # Перевірка, чи вже отримано токени
        if 'last_claim' in users_data[user_id]:
            await update.message.reply_text('Ти вже отримав DEXP. Спробуй пізніше.')
        else:
            # Нарахування DEXP
            users_data[user_id]['balance'] += 100
            users_data[user_id]['last_claim'] = update.message.date
            await update.message.reply_text('Ти отримав 100 DEXP!')

# Завдання: підписатися на канал
async def subscribe_channel(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    if user_id in users_data:
        if 'subscribe_channel' not in users_data[user_id]:
            users_data[user_id]['balance'] += 1000  # Нарахувати 1000 DEXP
            users_data[user_id]['subscribe_channel'] = True
            await update.message.reply_text('Ти підписався на канал! Ти отримав 1000 DEXP!')
        else:
            await update.message.reply_text('Ти вже підписався на канал.')

# Завдання: запросити друзів
async def invite_friends(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    if user_id in users_data:
        if len(users_data[user_id]['friends']) < 10:  # Максимум 10 друзів
            users_data[user_id]['friends'].append(update.message.from_user.username)
            users_data[user_id]['balance'] += 10000  # Нарахувати 10000 DEXP
            await update.message.reply_text(f'Ти запросив друга! Ти отримав 10000 DEXP!')
        else:
            await update.message.reply_text('Ти вже запросив 10 друзів.')

# Генерація промокоду
async def generate_promo(update: Update, context: CallbackContext):
    promo_code = generate_promocode()
    await update.message.reply_text(f'Твій промокод: {promo_code}')

# Використання промокоду
async def use_promo(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id
    if user_id in users_data:
        if not users_data[user_id]['promocode_used']:
            users_data[user_id]['promocode_used'] = True
            amount = random.randint(1000, 50000)
            users_data[user_id]['balance'] += amount
            await update.message.reply_text(f'Промокод активовано! Ти отримав {amount} DEXP.')
        else:
            await update.message.reply_text('Ти вже використовував промокод.')

# Лідерборд
async def leaderboard(update: Update, context: CallbackContext):
    sorted_users = sorted(users_data.items(), key=lambda x: x[1]['balance'], reverse=True)
    leaderboard_text = 'Лідерборд:\n'
    for index, (user_id, data) in enumerate(sorted_users[:10]):
        leaderboard_text += f"{index + 1}. {user_id}: {data['balance']} DEXP\n"
    await update.message.reply_text(leaderboard_text)

# Обробник текстових повідомлень
async def handle_message(update: Update, context: CallbackContext):
    await update.message.reply_text('Я отримав твоє повідомлення!')

# Основна функція
def main():
    # Створення Application
    application = Application.builder().token(TOKEN).build()

    # Реєстрація команд
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("get_dexp", get_dexp))
    application.add_handler(CommandHandler("subscribe_channel", subscribe_channel))
    application.add_handler(CommandHandler("invite_friends", invite_friends))
    application.add_handler(CommandHandler("generate_promo", generate_promo))
    application.add_handler(CommandHandler("use_promo", use_promo))
    application.add_handler(CommandHandler("leaderboard", leaderboard))

    # Обробник для текстових повідомлень
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Запуск бота
    application.run_polling()

if __name__ == '__main__':
    main()