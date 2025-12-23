@echo off
chcp 65001 >nul
echo ========================================
echo    测评网站 - 一键部署到Vercel
echo ========================================
echo.
echo 请确保您已经：
echo 1. 安装了Node.js（可以在命令行输入 node -v 检查）
echo 2. 注册了Vercel账号（https://vercel.com）
echo.
pause
echo.

echo [1/3] 安装Vercel命令行工具...
call npm install -g vercel
echo.

echo [2/3] 登录Vercel...
echo 浏览器会自动打开，请在浏览器中点击"Authorize"授权
call vercel login
echo.

echo [3/3] 部署项目...
echo 根据提示操作：
echo - Set up and deploy? 选择 Y
echo - Which scope? 按回车（使用默认）
echo - Link to existing project? 选择 N
echo - Project name? 按回车（使用默认）
echo - In which directory is your code located? 按回车（使用默认）
echo.
call vercel --prod
echo.

echo ========================================
echo 部署完成！
echo Vercel会给您一个网址，复制它就可以访问了！
echo 网址类似：https://assessment-platform-xxx.vercel.app
echo ========================================
pause
