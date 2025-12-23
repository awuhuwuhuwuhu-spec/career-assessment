@echo off
chcp 65001 >nul
echo ========================================
echo    测评网站 - 本地运行
echo ========================================
echo.
echo 正在启动开发服务器...
echo 请稍候10-20秒...
echo.
echo 启动成功后，浏览器会自动打开网站
echo 如果没有自动打开，请手动访问：http://localhost:5173
echo.
echo 按 Ctrl+C 可以停止服务器
echo ========================================
echo.

call npm run dev

pause
