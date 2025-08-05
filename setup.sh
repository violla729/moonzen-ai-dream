#!/bin/bash

echo "🌙 AI解梦应用设置向导"
echo "========================"

# 检查是否存在.env文件
if [ ! -f .env ]; then
    echo "📝 创建.env文件..."
    cp env.example .env
    echo "✅ .env文件已创建"
    echo ""
    echo "⚠️  重要提示："
    echo "请编辑.env文件，将 'your_deepseek_api_key_here' 替换为您的真实DeepSeek API密钥"
    echo ""
    echo "获取API密钥的步骤："
    echo "1. 访问 https://platform.deepseek.com/"
    echo "2. 注册或登录账户"
    echo "3. 在控制台中创建API密钥"
    echo "4. 将密钥复制到.env文件中"
    echo ""
else
    echo "✅ .env文件已存在"
fi

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "🚀 启动应用..."
echo "使用以下命令启动应用："
echo "npm start"
echo ""
echo "或者使用："
echo "node server.js"
echo ""
echo "应用将在 http://localhost:3000 运行"
echo ""
echo "💡 提示：图像生成功能使用备用方案，无需额外配置" 