@echo off
echo Starting ngrok tunnel for Quickart...
echo.
echo Your dev server should be running on http://localhost:5173
echo.
echo Press Ctrl+C to stop ngrok
echo.
ngrok http 5173
