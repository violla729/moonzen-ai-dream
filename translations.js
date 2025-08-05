// 多语言翻译数据
const translations = {
    en: {
        // 页面标题
        'page-title': 'Dream Analysis',
        'page-subtitle': 'AI Dream Interpreter - Explore the Mysteries of Your Subconscious',
        
        // 头部
        'dream-input-label': 'Describe your dream...',
        'dream-input-placeholder': 'For example: I dreamed I was walking through a field of purple flowers with a rainbow in the sky...',
        'analyze-btn': 'Analyze Dream',
        'loading-text': 'AI is analyzing your dream...',
        'analysis-title': 'Dream Analysis',
        'image-title': 'Dream Image',
        'image-placeholder': 'The image generated from your dream will appear here',
        'generate-image-btn': 'Generate Dream Image',
        'generating-text': 'Generating...',
        'footer-text': 'Exploring Inner Wisdom',
        
        // AI能力和免费使用
        'ai-powered': 'AI Powered',
        'free-to-use': 'Free to Use',
        
        // 通知消息
        'error-empty-dream': 'Please enter your dream description',
        'error-analysis-failed': 'Dream analysis failed, please try again later',
        'error-image-failed': 'Image generation failed, please try again later',
        'success-image-generated': 'Dream image generated successfully!',
        'error-analyze-first': 'Please analyze your dream first',
        
        // 输入提示
        'input-hint-text': "We'll analyze your dream and generate a beautiful image for you!",
        
        // 画廊
        'gallery-title': 'Dream Gallery',
        'gallery-subtitle': 'Explore dreams shared by our community',
        'gallery-placeholder': 'Be the first to share your dream image!',
        
        // 语言切换器
        'language-english': 'English',
        'language-spanish': 'Español',
        'language-chinese': '中文'
    },
    
    es: {
        // 页面标题
        'page-title': 'Análisis de Sueños',
        'page-subtitle': 'Intérprete de Sueños IA - Explora los Misterios de tu Subconsciente',
        
        // 头部
        'dream-input-label': 'Describe tu sueño...',
        'dream-input-placeholder': 'Por ejemplo: Soñé que caminaba por un campo de flores púrpuras con un arcoíris en el cielo...',
        'analyze-btn': 'Analizar Sueño',
        'loading-text': 'La IA está analizando tu sueño...',
        'analysis-title': 'Análisis del Sueño',
        'image-title': 'Imagen del Sueño',
        'image-placeholder': 'La imagen generada de tu sueño aparecerá aquí',
        'generate-image-btn': 'Generar Imagen del Sueño',
        'generating-text': 'Generando...',
        'footer-text': 'Explorando la Sabiduría Interior',
        
        // AI能力和免费使用
        'ai-powered': 'Con IA',
        'free-to-use': 'Gratis',
        
        // 通知消息
        'error-empty-dream': 'Por favor ingresa la descripción de tu sueño',
        'error-analysis-failed': 'El análisis del sueño falló, por favor intenta de nuevo más tarde',
        'error-image-failed': 'La generación de imagen falló, por favor intenta de nuevo más tarde',
        'success-image-generated': '¡Imagen del sueño generada exitosamente!',
        'error-analyze-first': 'Por favor analiza tu sueño primero',
        
        // 输入提示
        'input-hint-text': 'Analizaremos tu sueño y generaremos una imagen hermosa para ti!',
        
        // 画廊
        'gallery-title': 'Galería de Sueños',
        'gallery-subtitle': 'Explora sueños compartidos por nuestra comunidad',
        'gallery-placeholder': '¡Se el primero en compartir tu imagen de sueño!',
        
        // 语言切换器
        'language-english': 'English',
        'language-spanish': 'Español',
        'language-chinese': '中文'
    },
    
    zh: {
        // 页面标题
        'page-title': '梦境解析',
        'page-subtitle': 'AI解梦助手 - 探索潜意识的奥秘',
        
        // 头部
        'dream-input-label': '请描述您的梦境...',
        'dream-input-placeholder': '例如：我梦见自己在一片紫色的花海中漫步，天空中有彩虹...',
        'analyze-btn': '解析梦境',
        'loading-text': 'AI正在解析您的梦境...',
        'analysis-title': '梦境解析',
        'image-title': '梦境图像',
        'image-placeholder': '基于您的梦境生成的图像将在这里显示',
        'generate-image-btn': '生成梦境图像',
        'generating-text': '生成中...',
        'footer-text': '探索内心的智慧',
        
        // AI能力和免费使用
        'ai-powered': 'AI驱动',
        'free-to-use': '免费使用',
        
        // 通知消息
        'error-empty-dream': '请输入您的梦境描述',
        'error-analysis-failed': '梦境分析失败，请稍后重试',
        'error-image-failed': '图像生成失败，请稍后重试',
        'success-image-generated': '梦境图像生成成功！',
        'error-analyze-first': '请先解析梦境',
        
        // 输入提示
        'input-hint-text': '我们将分析您的梦境并为您生成一张美丽的图片！',
        
        // 画廊
        'gallery-title': '梦境画廊',
        'gallery-subtitle': '探索我们的社区分享的梦境',
        'gallery-placeholder': '成为第一个分享您梦境图像的人！',
        
        // 语言切换器
        'language-english': 'English',
        'language-spanish': 'Español',
        'language-chinese': '中文'
    }
};

// 当前语言
let currentLanguage = 'en';

// 切换语言
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // 更新页面标题
    document.title = getTranslation('page-title') + ' - AI Dream Interpreter';
    
    // 更新所有翻译文本
    updateTranslations();
    
    // 更新语言按钮状态
    updateLanguageButtons(lang);
    
    // 保存语言偏好到本地存储
    localStorage.setItem('preferredLanguage', lang);
}

// 更新翻译
function updateTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getTranslation(key);
        if (translation) {
            // 只更新文本内容，不重新创建元素
            if (element.tagName === 'BUTTON') {
                // 对于按钮，只更新span元素的内容，保持原有结构和事件监听器
                const span = element.querySelector('span');
                if (span) {
                    span.textContent = translation;
                } else {
                    // 如果没有span，直接更新文本内容但保持其他元素
                    const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
                    if (textNodes.length > 0) {
                        textNodes[0].textContent = translation;
                    } else {
                        element.textContent = translation;
                    }
                }
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // 更新占位符文本
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        const translation = getTranslation(key);
        if (translation) {
            element.placeholder = translation;
        }
    });
}

// 更新语言按钮状态
function updateLanguageButtons(activeLang) {
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.lang === activeLang) {
            option.classList.add('active');
        }
    });
}

// 获取翻译文本
function getTranslation(key) {
    return translations[currentLanguage]?.[key] || translations['en'][key] || key;
}

// 获取当前语言
function getCurrentLanguage() {
    return currentLanguage;
}

// 将函数暴露到全局作用域
window.getCurrentLanguage = getCurrentLanguage;

// 初始化语言
function initLanguage() {
    // 从本地存储获取语言偏好
    const savedLanguage = localStorage.getItem('preferredLanguage');
    
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    } else {
        // 根据浏览器语言自动选择
        const browserLang = navigator.language.split('-')[0];
        
        if (translations[browserLang]) {
            currentLanguage = browserLang;
        } else {
            currentLanguage = 'en';
        }
    }
    
    // 应用语言设置
    switchLanguage(currentLanguage);
} 