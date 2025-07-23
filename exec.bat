@echo off
setlocal

:: =================================================================
:: CONFIGURATION CENTRALE
:: =================================================================
set "TARGET_IP=192.168.2.56"
set "SSH_USER=demon"
set "SSH_PRIVATE_KEY=C:\Users\nicol\.ssh\id_rsa"
set "REMOTE_SCRIPT_PATH=/home/demon/agentforge/AgenticForge2/AgenticForge4/run.sh"
set "API_PORT=8080"
set "API_TOKEN=Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0"
:: =================================================================


:: --- V?rification initiale et affichage de l'aide ---
if "%~1"=="" (
    echo.
    echo Usage: %~n0 [commande] [arguments...]
    echo.
    goto :eof
)

:: --- Redirection vers la bonne fonction (m?thode robuste) ---
set "command=%~1"

if /I "%command%"=="send_chat" goto :send_chat
if /I "%command%"=="restart" goto :restart
if /I "%command%"=="logs" goto :logs
if /I "%command%"=="shell" goto :shell

if /I "%command%"=="start" goto :generic_remote_command
if /I "%command%"=="stop" goto :generic_remote_command
if /I "%command%"=="status" goto :generic_remote_command
if /I "%command%"=="rebuild" goto :generic_remote_command
if /I "%command%"=="clean-docker" goto :generic_remote_command
if /I "%command%"=="lint" goto :generic_remote_command
if /I "%command%"=="format" goto :generic_remote_command
if /I "%command%"=="test" goto :generic_remote_command
if /I "%command%"=="typecheck" goto :generic_remote_command
if /I "%command%"=="all-checks" goto :generic_remote_command
if /I "%command%"=="menu" goto :generic_remote_command

echo ERREUR: La commande "%command%" n'existe pas ou est invalide.
goto :eof


:: =================================================================
:: DEFINITION DES FONCTIONS
:: =================================================================

:send_chat
    if "%~2"=="" (
        echo ERREUR: La fonction 'send_chat' requiert le chemin vers un fichier JSON.
        goto :eof
    )
    echo. & echo --- Envoi de la requete POST a l'API ---
    set "TEMP_JSON_PATH=%~2"
    if not exist "%TEMP_JSON_PATH%" (
        echo ERREUR: Le fichier specifie n'existe pas: "%TEMP_JSON_PATH%"
        goto :eof
    )
    echo Fichier de donnees utilise: %TEMP_JSON_PATH%
    curl.exe -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %API_TOKEN%" -H "User-Agent: Mon_User_Agent" -H "Accept: application/json, text/plain, */*" -d "@%TEMP_JSON_PATH%" "http://%TARGET_IP%:%API_PORT%/api/chat"
    echo. & echo --- Requete API terminee. ---
    goto :eof

:restart
:logs
    echo. & echo --- Execution de la commande distante: %1 %2 ---
    ssh -i "%SSH_PRIVATE_KEY%" %SSH_USER%@%TARGET_IP% "bash %REMOTE_SCRIPT_PATH% %1 %2"
    echo. & echo --- Execution distante terminee. ---
    goto :eof

:shell
    echo. & echo --- Ouverture d'un shell interactif sur le serveur distant ---
    echo --- Pour quitter, tapez 'exit' et appuyez sur Entree. --- & echo.
    ssh -t -i "%SSH_PRIVATE_KEY%" %SSH_USER%@%TARGET_IP% "bash %REMOTE_SCRIPT_PATH% shell"
    goto :eof

:generic_remote_command
    echo. & echo --- Execution de la commande distante: %1 ---
    ssh -i "%SSH_PRIVATE_KEY%" %SSH_USER%@%TARGET_IP% "bash %REMOTE_SCRIPT_PATH% %1"
    echo. & echo --- Execution distante terminee. ---
    goto :eof

:eof
endlocal
