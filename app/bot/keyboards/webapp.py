from aiogram.types import KeyboardButton, ReplyKeyboardMarkup
from aiogram.types.web_app_info import WebAppInfo


def webapp_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text='Открыть приложение 📱',
                               web_app=WebAppInfo(url='https://servisplus.publicvm.com/'))
            ]
        ],
        resize_keyboard=True
    )