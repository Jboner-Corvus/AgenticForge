@echo off
echo --- Lancement de la requete Curl ---

:: Definit le chemin complet vers votre fichier de donnees sur le lecteur Z:
set JSON_FILE_PATH=%~dp0data.json

:: Definit un chemin temporaire sur votre disque local C:
set TEMP_JSON_PATH=%TEMP%\data_temp.json

echo Copie du fichier de donnees vers un emplacement temporaire...
copy "%JSON_FILE_PATH%" "%TEMP_JSON_PATH%"

echo Execution de la commande curl...
curl.exe -v -X POST ^
-H "Content-Type: application/json" ^
-H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" ^
-H "User-Agent: Mon_User_Agent" ^
-H "Accept: application/json, text/plain, */*" ^
-d "@%TEMP_JSON_PATH%" ^
"http://192.168.2.56:8080/api/chat"

echo.
echo Nettoyage du fichier temporaire...
del "%TEMP_JSON_PATH%"

echo --- Termine ---
pause