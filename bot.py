import random
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes

TOKEN = "8008430295:AAFATrn-vbY1365zwKEYA_CTW5lxRfhdAG8"  # ваш токен

# Дані користувачів та промокоди
users_data = {}
promo_codes = {
    "4KS2EK66": {"bonus": 1505, "activations": 100},
    "6ZWOYE84": {"bonus": 43548, "activations": 100},
    "KNTFCCXI": {"bonus": 8412, "activations": 100},
    "B9PJSECN": {"bonus": 19140, "activations": 100},
    # Додайте інші промокоди тут...
}

# Функція для старту
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id not in users_data:
        users_data[user_id] = {'balance': 0, 'promo_used': set(), 'vip': False, 'friends': set()}
    keyboard = [
        [InlineKeyboardButton("Balance", callback_data='balance')],
        [InlineKeyboardButton("Promo Code", callback_data='promo')],
        [InlineKeyboardButton("Leaderboard", callback_data='leaderboard')],
        [InlineKeyboardButton("VIP Status", callback_data='vip')],
        [InlineKeyboardButton("My Friends", callback_data='friends')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Welcome to DEXP bot! Choose an option below:", reply_markup=reply_markup)

# Перевірка балансу
async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    balance = users_data[user_id]['balance']
    await update.callback_query.edit_message_text(f"Your balance: {balance} DEXP")

# Використання промокоду
async def promo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    await update.callback_query.edit_message_text("Enter your promo code:")

async def handle_promo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    code = update.message.text.upper()
    if code in promo_codes and promo_codes[code]['activations'] > 0 and code not in users_data[user_id]['promo_used']:
        bonus = promo_codes[code]['bonus']
        users_data[user_id]['balance'] += bonus
        users_data[user_id]['promo_used'].add(code)
        promo_codes[code]['activations'] -= 1
        await update.message.reply_text(f"Promo code activated! You received {bonus} DEXP.")
    else:
        await update.message.reply_text("Invalid or expired promo code.")

# Лідерборд
async def leaderboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    leaderboard = sorted(users_data.items(), key=lambda x: x[1]['balance'], reverse=True)
    leaderboard_text = "Leaderboard:\n"
    for idx, (user_id, data) in enumerate(leaderboard[:10]):
        username = f"User {user_id}"
        leaderboard_text += f"{idx+1}. {username} - {data['balance']} DEXP\n"
    await update.callback_query.edit_message_text(leaderboard_text)

# ВІП статус
async def vip(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if users_data[user_id]['balance'] >= 10000:
        users_data[user_id]['vip'] = True
        await update.callback_query.edit_message_text("Congratulations! You have VIP status.")
    else:
        await update.callback_query.edit_message_text("You need at least 10,000 DEXP to get VIP status.")

# Друзья
async def friends(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    friends = users_data[user_id]['friends']
    if friends:
        friends_text = "Your Friends:\n"
        for friend_id in friends:
            friends_text += f"- User {friend_id}\n"
        await update.callback_query.edit_message_text(friends_text)
    else:
        await update.callback_query.edit_message_text("You have no friends yet. Add some!")

# Додати друга
async def add_friend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    friend_id = int(update.message.text.split()[1])  # очікуємо формат: /addfriend <ID>
    if friend_id not in users_data:
        await update.message.reply_text("This user does not exist.")
    else:
        users_data[user_id]['friends'].add(friend_id)
        users_data[friend_id]['friends'].add(user_id)  # двостороннє додавання
        await update.message.reply_text(f"User {friend_id} has been added to your friends list.")

# Основна функція
async def main():
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(balance, pattern="balance"))
    app.add_handler(CallbackQueryHandler(promo, pattern="promo"))
    app.add_handler(CallbackQueryHandler(leaderboard, pattern="leaderboard"))
    app.add_handler(CallbackQueryHandler(vip, pattern="vip"))
    app.add_handler(CallbackQueryHandler(friends, pattern="friends"))
    app.add_handler(CommandHandler("addfriend", add_friend))
    await app.run_polling()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())