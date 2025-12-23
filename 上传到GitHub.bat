@echo off
echo ========================================
echo    测评网站 - 上传到GitHub
echo ========================================
echo.

REM 检查是否已经初始化git
if not exist ".git" (
    echo [1/5] 初始化Git仓库...
    git init
    echo.
)

echo [2/5] 添加所有文件...
git add .
echo.

echo [3/5] 创建提交...
git commit -m "Initial commit: 青少年生涯规划测评系统"
echo.

echo [4/5] 请按照以下步骤操作：
echo.
echo 1. 访问 https://github.com
echo 2. 登录您的GitHub账号
echo 3. 点击右上角 "+" 按钮，选择 "New repository"
echo 4. 仓库名称输入：assessment-platform
echo 5. 选择 "Public"（公开）
echo 6. 点击 "Create repository"
echo 7. 复制页面上显示的仓库地址（类似 https://github.com/您的用户名/assessment-platform.git）
echo.
set /p REPO_URL="请粘贴您的GitHub仓库地址: "

echo.
echo [5/5] 上传到GitHub...
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo ========================================
echo 上传完成！
echo 现在可以继续Vercel部署步骤了
echo ========================================
pause
