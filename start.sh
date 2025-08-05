#!/bin/bash

echo "🌙 AI解梦助手启动脚本"
echo "========================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js (版本 >= 16.0.0)"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  警告: 未找到.env文件"
    echo "📝 正在创建.env文件..."
    cp env.example .env
    echo "✅ .env文件已创建"
    echo "🔑 请编辑.env文件，添加您的OpenAI API密钥"
    echo "   然后重新运行此脚本"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
fi

# 启动服务器
echo "🚀 启动AI解梦助手..."
echo "🌐 访问地址: http://localhost:3000"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

npm start 