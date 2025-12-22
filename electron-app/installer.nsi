; installer.nsi
!include "MUI2.nsh"

Name "Telegram Bot Manager"
OutFile "Telegram Bot Manager Setup.exe"
InstallDir "$PROGRAMFILES\TelegramBotManager"

; Язык
!insertmacro MUI_LANGUAGE "Russian"
!insertmacro MUI_LANGUAGE "English"

; Иконки
!define MUI_ICON "assets/icons/icon.ico"
!define MUI_UNICON "assets/icons/icon.ico"

; Страницы установки (кастомный порядок)
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Страницы удаления
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Раздел установки
Section "Установить"
  SetOutPath "$INSTDIR"
  File /r "out\make\squirrel.windows\*.*"
  
  ; Создать ярлыки
  CreateDirectory "$SMPROGRAMS\Telegram Bot Manager"
  CreateShortCut "$SMPROGRAMS\Telegram Bot Manager\Telegram Bot Manager.lnk" "$INSTDIR\Telegram Bot Manager.exe"
  CreateShortCut "$DESKTOP\Telegram Bot Manager.lnk" "$INSTDIR\Telegram Bot Manager.exe"
SectionEnd

; Раздел удаления
Section "Uninstall"
  RMDir /r "$INSTDIR"
  RMDir /r "$SMPROGRAMS\Telegram Bot Manager"
  Delete "$DESKTOP\Telegram Bot Manager.lnk"
SectionEnd
