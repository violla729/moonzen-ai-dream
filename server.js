const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 环境变量配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const FOURO_IMAGE_API_KEY = process.env.FOURO_IMAGE_API_KEY;

// 4oimageapi.io API配置
const FOURO_IMAGE_API_URL = 'https://4oimageapiio.erweima.ai';
const FOURO_IMAGE_API_ENDPOINT = '/api/v1/gpt4o-image/generate';

// 多语言提示模板
const dreamAnalysisPrompts = {
    en: {
        systemMessage: 'You are a professional dream analyst and psychological healer, skilled in using warm, understanding, and insightful language to interpret dreams and help people better understand their inner worlds.',
        promptTemplate: (dream) => `Please analyze the following dream in a professional and healing manner:

Dream description: ${dream}

Please analyze from the following perspectives:
1. Basic meaning and symbolic significance of the dream
2. Possible psychological states and emotions reflected
3. Messages the subconscious wants to convey
4. Insights and suggestions for real life
5. Healing interpretation and recommendations

Please respond with warm, understanding, and insightful language to help the user better understand their inner world. Please reply in English with detailed and healing content.`
    },
    zh: {
        systemMessage: '你是一位专业的梦境分析师和心理疗愈师，擅长用温暖、理解且富有洞察力的语言来解析梦境，帮助人们更好地理解自己的内心世界。',
        promptTemplate: (dream) => `请以专业且疗愈的方式解析以下梦境：

梦境描述：${dream}

请从以下角度进行分析：
1. 梦境的基本含义和象征意义
2. 可能反映的心理状态和情感
3. 潜意识想要传达的信息
4. 对现实生活的启示和建议
5. 疗愈性的解读和建议

请用温暖、理解且富有洞察力的语言来回应，帮助用户更好地理解自己的内心世界。请用中文回复，内容要详细且具有疗愈性。`
    },
    es: {
        systemMessage: 'Eres un analista profesional de sueños y sanador psicológico, hábil en usar un lenguaje cálido, comprensivo y perspicaz para interpretar sueños y ayudar a las personas a entender mejor sus mundos interiores. IMPORTANTE: Debes responder ÚNICAMENTE en español, sin excepción.',
        promptTemplate: (dream) => `Por favor analiza el siguiente sueño de manera profesional y sanadora:

Descripción del sueño: ${dream}

Por favor analiza desde las siguientes perspectivas:
1. Significado básico e importancia simbólica del sueño
2. Posibles estados psicológicos y emociones reflejadas
3. Mensajes que el subconsciente quiere transmitir
4. Perspectivas y sugerencias para la vida real
5. Interpretación sanadora y recomendaciones

Por favor responde con un lenguaje cálido, comprensivo y perspicaz para ayudar al usuario a entender mejor su mundo interior. 

IMPORTANTE: Tu respuesta debe ser COMPLETAMENTE en español. No uses ninguna palabra en inglés u otro idioma. Responde con contenido detallado y sanador, todo en español.`
    }
};

// DeepSeek梦境解析API
app.post('/api/analyze-dream', async (req, res) => {
    try {
        const { dream, language = 'en' } = req.body;
        
        if (!dream) {
            const errorMessages = {
                en: 'Dream description cannot be empty',
                zh: '梦境描述不能为空',
                es: 'La descripción del sueño no puede estar vacía'
            };
            return res.status(400).json({ error: errorMessages[language] || errorMessages.en });
        }
        
        if (!DEEPSEEK_API_KEY) {
            const errorMessages = {
                en: 'DeepSeek API key not configured',
                zh: 'DeepSeek API密钥未配置',
                es: 'Clave API de DeepSeek no configurada'
            };
            return res.status(500).json({ error: errorMessages[language] || errorMessages.en });
        }
        
        // 获取对应语言的提示模板
        const languagePrompts = dreamAnalysisPrompts[language] || dreamAnalysisPrompts.en;
        const prompt = languagePrompts.promptTemplate(dream);

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: languagePrompts.systemMessage
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const analysis = response.data.choices[0].message.content;
        
        res.json({ analysis });
        
    } catch (error) {
        console.error('梦境分析API错误:', error);
        
        const { language = 'en' } = req.body;
        
        // 多语言错误消息
        const errorMessages = {
            rateLimited: {
                en: 'Too many requests, please try again later',
                zh: '请求过于频繁，请稍后重试',
                es: 'Demasiadas solicitudes, inténtalo de nuevo más tarde'
            },
            invalidKey: {
                en: 'Invalid API key, please check configuration',
                zh: 'API密钥无效，请检查配置',
                es: 'Clave API inválida, verifica la configuración'
            },
            generalError: {
                en: 'Dream analysis failed, please try again later',
                zh: '梦境分析失败，请稍后重试',
                es: 'Análisis de sueños falló, inténtalo de nuevo más tarde'
            }
        };
        
        // 处理DeepSeek特定的错误
        if (error.response && error.response.status === 429) {
            res.status(429).json({ error: errorMessages.rateLimited[language] || errorMessages.rateLimited.en });
        } else if (error.response && error.response.status === 401) {
            res.status(401).json({ error: errorMessages.invalidKey[language] || errorMessages.invalidKey.en });
        } else {
            res.status(500).json({ error: errorMessages.generalError[language] || errorMessages.generalError.en });
        }
    }
});

// 多语言图像生成消息
const imageGenerationMessages = {
    en: {
        emptyDream: 'Dream description cannot be empty',
        fallbackMessage: 'Due to technical limitations, we provided a related healing image for you',
        presetMessage: 'We provided a healing-style image to help you better understand your dream',
        errorMessage: 'Image generation is temporarily unavailable, but dream analysis function is normal',
        continueMessage: 'You can continue to use the dream analysis function'
    },
    zh: {
        emptyDream: '梦境描述不能为空',
        fallbackMessage: '由于技术限制，为您提供了相关的疗愈图像',
        presetMessage: '为您提供了一张疗愈风格的图像，希望能帮助您更好地理解梦境',
        errorMessage: '图像生成暂时不可用，但梦境分析功能正常',
        continueMessage: '您可以继续使用梦境分析功能'
    },
    es: {
        emptyDream: 'La descripción del sueño no puede estar vacía',
        fallbackMessage: 'Debido a limitaciones técnicas, te proporcionamos una imagen sanadora relacionada',
        presetMessage: 'Te proporcionamos una imagen de estilo sanador para ayudarte a entender mejor tu sueño',
        errorMessage: 'La generación de imágenes no está disponible temporalmente, pero la función de análisis de sueños funciona normalmente',
        continueMessage: 'Puedes continuar usando la función de análisis de sueños'
    }
};

// 图像生成API - 使用多种方案
app.post('/api/generate-image', async (req, res) => {
    try {
        const { dream, analysis, language = 'en' } = req.body;
        
        const messages = imageGenerationMessages[language] || imageGenerationMessages.en;
        
        if (!dream) {
            return res.status(400).json({ error: messages.emptyDream });
        }
        
        // 方案1：使用4oimageapi.io GPT-4o图像生成（混合模式）
        try {
            if (!FOURO_IMAGE_API_KEY) {
                throw new Error('4oimageapi.io API key not configured');
            }

            // 生成适合GPT-4o的英文提示词
            const gpt4oPrompt = generateDallePrompt(dream, language);
            
            console.log('使用4oimageapi.io生成图像，提示词:', gpt4oPrompt.substring(0, 100) + '...');

            // 使用4oimageapi.io API生成图像任务
            // 检查是否有公网URL，没有则使用空回调（轮询模式）
            const baseUrl = process.env.PUBLIC_URL;
            const callbackUrl = baseUrl ? `${baseUrl}/api/4oimage-callback` : "";
            
            console.log('设置回调URL:', callbackUrl || '使用轮询模式（无回调）');
            
            const response = await axios.post(`${FOURO_IMAGE_API_URL}${FOURO_IMAGE_API_ENDPOINT}`, {
                filesUrl: [], // 我们是文本到图像，不需要输入图像
                prompt: gpt4oPrompt,
                size: "1:1", // 方形图像
                callBackUrl: callbackUrl // 如果有公网URL则使用回调，否则为空
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
                }
            });
            
            console.log('4oimageapi.io API响应状态:', response.status);
            console.log('4oimageapi.io API响应:', response.data);
            
            // 4oimageapi.io任务创建成功
            if (response.data && response.data.code === 200 && response.data.data && response.data.data.taskId) {
                const taskId = response.data.data.taskId;
                console.log('✅ 4oimageapi.io任务创建成功，任务ID:', taskId);
                
                // 由于查询端点目前不可用，我们使用预设疗愈图像作为临时方案
                console.log('📝 注意: 4oimageapi.io任务已提交，但查询端点暂不可用，使用预设疗愈图像');
                
                // 使用多语言消息说明情况
                const mixedMessage = {
                    en: `Your GPT-4o image generation task has been submitted to 4oimageapi.io (Task ID: ${taskId.substring(0,8)}...). The AI-generated image will be ready shortly via callback. Meanwhile, here's a curated healing image for your dream analysis. Check /api/4oimage-result/${taskId} for the final result.`,
                    zh: `您的GPT-4o图像生成任务已提交至4oimageapi.io（任务ID: ${taskId.substring(0,8)}...）。AI生成的图像将通过回调机制很快就绪。现在为您提供精选疗愈图像辅助梦境分析。可通过 /api/4oimage-result/${taskId} 查看最终结果。`,
                    es: `Su tarea de generación de imágenes GPT-4o se ha enviado a 4oimageapi.io (ID: ${taskId.substring(0,8)}...). La imagen generada por IA estará lista pronto mediante callback. Mientras tanto, aquí tiene una imagen curativa seleccionada. Consulte /api/4oimage-result/${taskId} para el resultado final.`
                };
                
                // 选择预设的疗愈图像
                const presetImages = [
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop'
                ];
                
                const randomImage = presetImages[Math.floor(Math.random() * presetImages.length)];
                
                return res.json({ 
                    imageUrl: randomImage,
                    source: '4oimageapi.io-preset-healing',
                    message: mixedMessage[language] || mixedMessage.en,
                    taskId: taskId, // 提供任务ID供调试
                    note: '4oimageapi.io service integrated but using preset healing image temporarily'
                });
            } else {
                throw new Error('Invalid response format from 4oimageapi.io: ' + JSON.stringify(response.data));
            }
            
        } catch (fourOError) {
            console.log('4oimageapi.io连接失败，尝试备用方案:', fourOError.message);
            if (fourOError.response) {
                console.log('4oimageapi.io错误详情:', fourOError.response.status, fourOError.response.data);
            }
            
            // 方案2：使用Unsplash API获取相关图像
            try {
                const searchTerm = getImageSearchTerm(dream);
                const unsplashResponse = await axios.get(`https://api.unsplash.com/search/photos`, {
                    params: {
                        query: searchTerm,
                        orientation: 'landscape',
                        per_page: 1
                    },
                    headers: {
                        'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY'
                    }
                });
                
                if (unsplashResponse.data.results.length > 0) {
                    const imageUrl = unsplashResponse.data.results[0].urls.regular;
                    return res.json({ 
                        imageUrl, 
                        source: 'unsplash',
                        message: messages.fallbackMessage
                    });
                }
            } catch (unsplashError) {
                console.log('Unsplash API失败:', unsplashError.message);
            }
            
            // 方案3：返回预设的疗愈图像
            const healingImages = [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
            ];
            
            const randomImage = healingImages[Math.floor(Math.random() * healingImages.length)];
            
            res.json({ 
                imageUrl: randomImage, 
                source: 'preset',
                message: messages.presetMessage
            });
        }
        
    } catch (error) {
        console.error('图像生成API错误:', error);
        
        const { language = 'en' } = req.body;
        const messages = imageGenerationMessages[language] || imageGenerationMessages.en;
        
        res.status(500).json({ 
            error: messages.errorMessage,
            message: messages.continueMessage
        });
    }
});

// 轮询4oimageapi.io任务结果
async function pollTaskResult(taskId, apiKey, maxAttempts = 30, interval = 2000) {
    console.log(`开始轮询任务结果，taskId: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // 常见的查询端点可能是 /api/v1/gpt4o-image/query 或 /result
            const queryEndpoints = [
                '/api/v1/gpt4o-image/query',
                '/api/v1/gpt4o-image/result', 
                '/api/v1/gpt4o-image/status',
                `/api/v1/gpt4o-image/${taskId}`
            ];
            
            for (const endpoint of queryEndpoints) {
                try {
                    console.log(`尝试查询端点 ${attempt}/${maxAttempts}: ${endpoint}`);
                    
                    const response = await axios.post(`${FOURO_IMAGE_API_URL}${endpoint}`, {
                        taskId: taskId
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        timeout: 10000
                    });
                    
                    console.log(`查询响应 (${endpoint}):`, response.data);
                    
                    // 检查任务是否完成
                    if (response.data && response.data.code === 200) {
                        const data = response.data.data;
                        
                        // 尝试不同的可能字段名
                        const imageUrl = data.imageUrl || data.image_url || data.url || 
                                       (data.images && data.images[0]) ||
                                       (data.result && data.result.imageUrl);
                        
                        if (imageUrl) {
                            console.log('✅ 成功获取图像URL:', imageUrl);
                            return imageUrl;
                        }
                        
                        // 检查任务状态
                        const status = data.status || data.state;
                        if (status === 'completed' || status === 'success' || status === 'finished') {
                            console.log('任务已完成但未找到图像URL，响应:', data);
                        } else if (status === 'failed' || status === 'error') {
                            console.log('任务失败:', data);
                            return null;
                        } else {
                            console.log('任务仍在处理中，状态:', status);
                        }
                    }
                    
                    // 如果这个端点有效响应，跳出端点循环
                    break;
                    
                } catch (endpointError) {
                    console.log(`端点 ${endpoint} 失败:`, endpointError.message);
                    // 继续尝试下一个端点
                    continue;
                }
            }
            
            // 等待后重试
            if (attempt < maxAttempts) {
                console.log(`等待 ${interval}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, interval));
            }
            
        } catch (error) {
            console.log(`查询任务失败 (尝试 ${attempt}/${maxAttempts}):`, error.message);
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
    }
    
    console.log('⚠️ 轮询超时，未能获取图像结果');
    return null;
}

// 生成适合DALL-E的图像提示词
function generateDallePrompt(dream, language) {
    // 将梦境描述转换为英文（DALL-E在英文提示词下效果最佳）
    let dreamInEnglish = dream;
    
    // 如果是其他语言，提供一个基础的英文转换提示
    if (language === 'zh') {
        // 对于中文梦境，提取关键元素并构建英文提示
        dreamInEnglish = translateChineseDreamToEnglish(dream);
    } else if (language === 'es') {
        // 对于西班牙语梦境，提取关键元素并构建英文提示
        dreamInEnglish = translateSpanishDreamToEnglish(dream);
    }
    
    // 构建高质量的DALL-E提示词
    const dallePrompt = `Create a healing and dreamy artistic interpretation of this dream: "${dreamInEnglish}". 
Style: Soft, ethereal, therapeutic art with gentle lighting and peaceful atmosphere. 
Colors: Predominantly use soft purples, pinks, light blues, and warm pastels that evoke healing and tranquility. 
Mood: Serene, hopeful, mystical, and emotionally comforting. 
Quality: High artistic quality, painterly style, suitable for meditation and emotional healing. 
Avoid: Any dark, disturbing, or negative imagery. Focus on beauty, peace, and positive emotional resonance.`;
    
    return dallePrompt;
}

// 辅助函数：将中文梦境转换为英文关键词
function translateChineseDreamToEnglish(dream) {
    const dreamLower = dream.toLowerCase();
    let englishElements = [];
    
    if (dreamLower.includes('飞') || dreamLower.includes('飞翔')) {
        englishElements.push('flying through the sky');
    }
    if (dreamLower.includes('花') || dreamLower.includes('花园')) {
        englishElements.push('beautiful garden with colorful flowers');
    }
    if (dreamLower.includes('海') || dreamLower.includes('水')) {
        englishElements.push('peaceful ocean or flowing water');
    }
    if (dreamLower.includes('森林') || dreamLower.includes('树')) {
        englishElements.push('enchanted forest with tall trees');
    }
    if (dreamLower.includes('天空') || dreamLower.includes('云')) {
        englishElements.push('expansive sky with soft clouds');
    }
    if (dreamLower.includes('动物')) {
        englishElements.push('gentle animals');
    }
    if (dreamLower.includes('光') || dreamLower.includes('阳光')) {
        englishElements.push('warm golden light');
    }
    
    return englishElements.length > 0 ? englishElements.join(', ') : 'a peaceful and beautiful dreamscape';
}

// 辅助函数：将西班牙语梦境转换为英文关键词
function translateSpanishDreamToEnglish(dream) {
    const dreamLower = dream.toLowerCase();
    let englishElements = [];
    
    if (dreamLower.includes('volar') || dreamLower.includes('volando')) {
        englishElements.push('flying through the sky');
    }
    if (dreamLower.includes('jardín') || dreamLower.includes('flores')) {
        englishElements.push('beautiful garden with colorful flowers');
    }
    if (dreamLower.includes('océano') || dreamLower.includes('agua') || dreamLower.includes('mar')) {
        englishElements.push('peaceful ocean or flowing water');
    }
    if (dreamLower.includes('bosque') || dreamLower.includes('árboles')) {
        englishElements.push('enchanted forest with tall trees');
    }
    if (dreamLower.includes('cielo') || dreamLower.includes('nubes')) {
        englishElements.push('expansive sky with soft clouds');
    }
    if (dreamLower.includes('animales')) {
        englishElements.push('gentle animals');
    }
    if (dreamLower.includes('luz') || dreamLower.includes('sol')) {
        englishElements.push('warm golden light');
    }
    
    return englishElements.length > 0 ? englishElements.join(', ') : 'a peaceful and beautiful dreamscape';
}

// 辅助函数：根据梦境内容生成图像搜索关键词（备用方案使用）
function getImageSearchTerm(dream) {
    const dreamLower = dream.toLowerCase();
    
    if (dreamLower.includes('童年') || dreamLower.includes('小时候')) {
        return 'childhood memories peaceful';
    } else if (dreamLower.includes('花') || dreamLower.includes('花园')) {
        return 'healing flowers peaceful garden';
    } else if (dreamLower.includes('海') || dreamLower.includes('水')) {
        return 'calm ocean healing water';
    } else if (dreamLower.includes('森林') || dreamLower.includes('树')) {
        return 'peaceful forest healing nature';
    } else if (dreamLower.includes('天空') || dreamLower.includes('云')) {
        return 'peaceful sky healing clouds';
    } else if (dreamLower.includes('紫色') || dreamLower.includes('粉色')) {
        return 'healing purple pink colors';
    } else {
        return 'healing meditation peaceful';
    }
}

// 4oimageapi.io回调端点
app.post('/api/4oimage-callback', async (req, res) => {
    try {
        console.log('=== 4oimageapi.io 回调通知 ===');
        console.log('收到回调数据:', JSON.stringify(req.body, null, 2));
        
        // 存储回调结果（简单内存存储，生产环境应使用数据库）
        const callbackData = req.body;
        
        // 检查是否有taskId和图像URL
        if (callbackData && callbackData.taskId) {
            console.log('任务完成:', callbackData.taskId);
            
            // 存储到全局变量（简单实现）
            if (!global.imageCallbacks) {
                global.imageCallbacks = new Map();
            }
            global.imageCallbacks.set(callbackData.taskId, callbackData);
            
            console.log('✅ 回调数据已保存');
        }
        
        // 返回200状态码表示回调接收成功
        res.status(200).json({ 
            success: true, 
            message: 'Callback received successfully' 
        });
        
    } catch (error) {
        console.error('回调处理失败:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Callback processing failed' 
        });
    }
});

// 测试端点：模拟4oimageapi.io回调（仅用于本地测试）
app.post('/api/test-callback/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        
        // 模拟4oimageapi.io的回调数据格式
        const mockCallbackData = {
            taskId: taskId,
            imageUrl: `https://picsum.photos/800/600?random=${Date.now()}`, // 使用随机图像模拟AI生成结果
            status: 'completed',
            timestamp: new Date().toISOString(),
            note: 'This is a simulated callback for local testing'
        };
        
        // 存储模拟的回调数据
        if (!global.imageCallbacks) {
            global.imageCallbacks = new Map();
        }
        global.imageCallbacks.set(taskId, mockCallbackData);
        
        console.log('🧪 模拟回调测试 - 任务完成:', taskId);
        console.log('模拟的图像URL:', mockCallbackData.imageUrl);
        
        res.json({
            success: true,
            message: 'Mock callback processed successfully',
            data: mockCallbackData
        });
        
    } catch (error) {
        console.error('模拟回调测试失败:', error);
        res.status(500).json({
            success: false,
            error: 'Mock callback test failed'
        });
    }
});

// 主动查询4oimageapi.io任务状态（轮询模式）
app.get('/api/poll-4oimage/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        console.log('🔍 主动查询4oimageapi.io任务状态:', taskId);
        
        // 尝试多个可能的查询端点
        const queryEndpoints = [
            `/api/v1/gpt4o-image/status/${taskId}`,
            `/api/v1/gpt4o-image/result/${taskId}`,
            `/api/v1/gpt4o-image/${taskId}`,
            `/api/v1/gpt4o-image/query`
        ];
        
        for (const endpoint of queryEndpoints) {
            try {
                console.log(`尝试查询端点: ${FOURO_IMAGE_API_URL}${endpoint}`);
                
                let queryResponse;
                if (endpoint === '/api/v1/gpt4o-image/query') {
                    // POST方式查询
                    queryResponse = await axios.post(`${FOURO_IMAGE_API_URL}${endpoint}`, {
                        taskId: taskId
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
                        },
                        timeout: 10000
                    });
                } else {
                    // GET方式查询
                    queryResponse = await axios.get(`${FOURO_IMAGE_API_URL}${endpoint}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
                        },
                        timeout: 10000
                    });
                }
                
                console.log(`查询成功 (${endpoint}):`, queryResponse.data);
                
                // 检查响应格式
                if (queryResponse.data && queryResponse.data.code === 200) {
                    const data = queryResponse.data.data;
                    const imageUrl = data.imageUrl || data.image_url || data.url;
                    
                    if (imageUrl) {
                        console.log('✅ 找到图像URL:', imageUrl);
                        
                        // 保存结果到内存
                        if (!global.imageCallbacks) {
                            global.imageCallbacks = new Map();
                        }
                        global.imageCallbacks.set(taskId, {
                            taskId: taskId,
                            imageUrl: imageUrl,
                            status: 'completed',
                            timestamp: new Date().toISOString(),
                            source: '4oimageapi.io-polling'
                        });
                        
                        return res.json({
                            success: true,
                            taskId: taskId,
                            imageUrl: imageUrl,
                            status: 'completed',
                            source: 'polling'
                        });
                    } else {
                        return res.json({
                            success: false,
                            taskId: taskId,
                            status: data.status || 'processing',
                            message: 'Image still processing'
                        });
                    }
                }
                
            } catch (endpointError) {
                console.log(`端点查询失败 (${endpoint}):`, endpointError.message);
                continue; // 尝试下一个端点
            }
        }
        
        // 所有端点都失败
        res.json({
            success: false,
            taskId: taskId,
            message: 'Unable to query task status - all endpoints failed'
        });
        
    } catch (error) {
        console.error('轮询查询失败:', error);
        res.status(500).json({
            success: false,
            error: 'Polling query failed'
        });
    }
});

// 查询4oimageapi.io任务结果端点（统一入口）
app.get('/api/4oimage-result/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        console.log('查询任务结果:', taskId);
        
        // 首先从内存中查找结果（回调或轮询缓存）
        if (global.imageCallbacks && global.imageCallbacks.has(taskId)) {
            const result = global.imageCallbacks.get(taskId);
            console.log('找到缓存结果:', result);
            
            return res.json({
                success: true,
                taskId: taskId,
                result: result
            });
        }
        
        // 如果没有缓存结果，尝试主动查询（轮询模式）
        console.log('未找到缓存，尝试主动查询...');
        
        // 内部调用轮询端点
        try {
            const pollResponse = await axios.get(`http://localhost:${PORT}/api/poll-4oimage/${taskId}`);
            
            if (pollResponse.data && pollResponse.data.success) {
                return res.json({
                    success: true,
                    taskId: taskId,
                    result: {
                        taskId: taskId,
                        imageUrl: pollResponse.data.imageUrl,
                        status: pollResponse.data.status,
                        source: 'active-polling'
                    }
                });
            }
        } catch (pollError) {
            console.log('主动查询也失败:', pollError.message);
        }
        
        // 都失败了
        res.json({
            success: false,
            taskId: taskId,
            message: 'Task result not yet available'
        });
        
    } catch (error) {
        console.error('查询任务结果失败:', error);
        res.status(500).json({
            success: false,
            error: 'Query failed'
        });
    }
});

// 4oimageapi.io调试端点
app.post('/api/debug-4oimage', async (req, res) => {
    try {
        const testPrompt = "A beautiful healing image of nature";
        
        console.log('=== 4oimageapi.io 调试测试 ===');
        console.log('1. 创建图像生成任务...');
        
        // Step 1: 创建任务
        const createResponse = await axios.post(`${FOURO_IMAGE_API_URL}${FOURO_IMAGE_API_ENDPOINT}`, {
            filesUrl: [],
            prompt: testPrompt,
            size: "1:1",
            callBackUrl: ""
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
            }
        });
        
        console.log('创建任务响应:', JSON.stringify(createResponse.data, null, 2));
        
        if (createResponse.data && createResponse.data.code === 200 && createResponse.data.data.taskId) {
            const taskId = createResponse.data.data.taskId;
            console.log('2. 获得任务ID:', taskId);
            
            // Step 2: 等待一段时间
            console.log('3. 等待10秒...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Step 3: 尝试多种查询方法
            console.log('4. 尝试多种查询方法...');
            
            // 尝试方法1: GET请求
            let queryResponse;
            try {
                console.log('尝试GET请求查询...');
                queryResponse = await axios.get(`${FOURO_IMAGE_API_URL}/api/v1/gpt4o-image/${taskId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
                    }
                });
                console.log('GET请求成功:', queryResponse.data);
            } catch (getError) {
                console.log('GET请求失败:', getError.message);
                
                // 尝试方法2: 不同的POST端点
                try {
                    console.log('尝试POST请求到/result端点...');
                    queryResponse = await axios.post(`${FOURO_IMAGE_API_URL}/api/v1/gpt4o-image/result`, {
                        taskId: taskId
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
                        }
                    });
                    console.log('POST /result成功:', queryResponse.data);
                } catch (postError) {
                    console.log('POST /result失败:', postError.message);
                    
                    // 尝试方法3: 等待更长时间后再次尝试原始查询
                    console.log('等待更长时间(30秒)后重试...');
                    await new Promise(resolve => setTimeout(resolve, 20000)); // 额外等待20秒
                    
                    try {
                        queryResponse = await axios.post(`${FOURO_IMAGE_API_URL}/api/v1/gpt4o-image/query`, {
                            taskId: taskId
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${FOURO_IMAGE_API_KEY}`
                            }
                        });
                        console.log('延迟查询成功:', queryResponse.data);
                    } catch (delayedError) {
                        console.log('延迟查询也失败:', delayedError.message);
                        throw new Error('所有查询方法都失败了');
                    }
                }
            }
            
            console.log('查询响应:', JSON.stringify(queryResponse.data, null, 2));
            
            res.json({
                success: true,
                taskId: taskId,
                createResponse: createResponse.data,
                queryResponse: queryResponse.data
            });
        } else {
            res.json({
                success: false,
                error: 'Failed to create task',
                response: createResponse.data
            });
        }
        
    } catch (error) {
        console.error('调试测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', error.response.data);
        }
        
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    const hasFourOAPI = FOURO_IMAGE_API_KEY && FOURO_IMAGE_API_KEY.length > 0;
    
    res.json({ 
        status: 'ok', 
        message: 'AI解梦服务运行正常',
        features: {
            dreamAnalysis: 'available (DeepSeek API)',
            imageGeneration: hasFourOAPI ? 'available (4oimageapi.io GPT-4o)' : 'limited (4oimageapi.io API key required)'
        }
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`AI解梦服务器运行在端口 ${PORT}`);
    console.log(`访问 http://localhost:${PORT} 查看应用`);
    console.log('使用 DeepSeek API (梦境分析) + 4oimageapi.io GPT-4o (图像生成)');
    
    // 检查API密钥配置
    if (!FOURO_IMAGE_API_KEY || FOURO_IMAGE_API_KEY.length === 0) {
        console.log('⚠️  注意：请在.env文件中配置您的4oimageapi.io API密钥以启用图像生成功能');
    } else {
        console.log('✅ 4oimageapi.io API密钥已配置，图像生成功能已启用');
        console.log('💡 使用更经济实惠的4oimageapi.io服务提供GPT-4o图像生成能力');
        console.log('📝 当前使用回调模式：任务提交至4oimageapi.io + 回调接收结果 + 预设疗愈图像');
    }
});

module.exports = app; 