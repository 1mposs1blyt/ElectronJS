@echo off
chcp 65001 > nul

echo Запуск приложений...
echo.

REM Переменная для пути к проекту (замени на свой путь)
set PROJECT_PATH=C:\Users\alexandr\Desktop\ElectronJS\
REM D:\Работа\ПРОЭКТЫ\ElectronJS-1\

REM Сервер
start "Bot Server" cmd /k "cd /d %PROJECT_PATH%\SocketServer && npm start"
timeout /t 2 /nobreak

REM Боты
start "Bot 0" cmd /k "cd /d %PROJECT_PATH%\TelegramBots\TelegramBot_0 && npm start"
timeout /t 1 /nobreak

start "Bot 1" cmd /k "cd /d %PROJECT_PATH%\TelegramBots\TelegramBot_1 && npm start"
timeout /t 1 /nobreak

start "Bot 2" cmd /k "cd /d %PROJECT_PATH%\TelegramBots\TelegramBot_2 && npm start"
timeout /t 1 /nobreak

start "Bot 3" cmd /k "cd /d %PROJECT_PATH%\TelegramBots\TelegramBot_3 && npm start"
timeout /t 1 /nobreak

start "Bot 4" cmd /k "cd /d %PROJECT_PATH%\TelegramBots\TelegramBot_4 && npm start"
timeout /t 1 /nobreak

start "Bot 5" cmd /k "cd /d %PROJECT_PATH%\TelegramBots\TelegramBot_5 && npm start"
timeout /t 1 /nobreak


REM Electron
start "Electron App" cmd /k "cd /d %PROJECT_PATH%\electron-app && npm start"

echo.
echo ✓ Все приложения запущены!
exit
