// 全局变量
let currentDream = '';
let analysisResultText = '';

// DOM元素变量声明
let dreamInput, analyzeBtn, resultsSection, loadingSpinner, analysisResult, analysisContent;
let imageGeneration, imageContainer, generateImageBtn, inputHint;
let languageDropdown, languageDropdownBtn, languageDropdownContent, currentLanguageSpan;
let dreamGallery, galleryGrid, galleryPlaceholder;

// 梦境分析处理
async function handleDreamAnalysis() {
    const dreamText = dreamInput.value.trim();
    
    if (!dreamText) {
        showNotification(getTranslation('error-empty-dream'), 'error');
        return;
    }
    
    currentDream = dreamText;
    
    // 添加点击效果
    analyzeBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        analyzeBtn.style.transform = '';
    }, 150);
    
    // 显示结果区域和加载动画
    resultsSection.style.display = 'block';
    loadingSpinner.style.display = 'block';
    analysisResult.style.display = 'none';
    imageGeneration.style.display = 'none';
    
    try {
        // 调用AI解梦API
        const analysis = await analyzeDream(dreamText);
        analysisResultText = analysis;
        
        // 隐藏加载动画，显示结果
        loadingSpinner.style.display = 'none';
        analysisResult.style.display = 'block';
        imageGeneration.style.display = 'block';
        
        // 显示分析结果
        displayAnalysisResult(analysis);
        
        // 滚动到结果区域
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('梦境分析失败:', error);
        loadingSpinner.style.display = 'none';
        showNotification(getTranslation('error-analysis-failed'), 'error');
    }
}

// AI解梦API调用
async function analyzeDream(dreamText) {
    try {
        // 获取当前语言设置
        let language = 'en'; // 默认英文
        
        if (typeof window.getCurrentLanguage !== 'undefined') {
            language = window.getCurrentLanguage();
        } else {
            console.warn('getCurrentLanguage函数未定义，使用默认语言en');
        }
        
        console.log('===== 梦境分析API调用 =====');
        console.log('检测到的当前语言:', language);
        console.log('梦境内容:', dreamText.substring(0, 50) + '...');
        console.log('========================');
        
        const response = await fetch('/api/analyze-dream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                dream: dreamText,
                language: language 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API调用失败');
        }
        
        const data = await response.json();
        return data.analysis;
        
    } catch (error) {
        console.error('API调用错误:', error);
        throw error;
    }
}

// 显示分析结果
function displayAnalysisResult(analysis) {
    analysisContent.innerHTML = analysis.replace(/\n/g, '<br>');
}

// 图像生成处理
async function handleImageGeneration() {
    if (!currentDream) {
        showNotification(getTranslation('error-analyze-first'), 'error');
        return;
    }
    
    // 显示图像生成中的状态
    generateImageBtn.disabled = true;
    generateImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-translate="generating-text">Generating...</span>';
    
    try {
        // 调用图像生成API
        const result = await generateDreamImage(currentDream, analysisResultText);
        
        // 显示生成的图像
        displayGeneratedImage(result.imageUrl);
        
        // 显示相应的消息
        if (result.message) {
            showNotification(result.message, 'info');
        } else {
            showNotification(getTranslation('success-image-generated'), 'success');
        }
        
    } catch (error) {
        console.error('图像生成失败:', error);
        showNotification(getTranslation('error-image-failed'), 'error');
    } finally {
        // 恢复按钮状态
        generateImageBtn.disabled = false;
        generateImageBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> <span data-translate="generate-image-btn">Generate Dream Image</span>';
        // 更新翻译
        updateTranslations();
    }
}

// 图像生成API调用
async function generateDreamImage(dreamText, analysis) {
    try {
        // 获取当前语言设置
        let language = 'en'; 
        if (typeof window.getCurrentLanguage !== 'undefined') {
            language = window.getCurrentLanguage();
        }
        
        console.log('===== 图像生成API调用 =====');
        console.log('检测到的当前语言:', language);
        console.log('梦境内容:', dreamText.substring(0, 50) + '...');
        console.log('========================');
        
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                dream: dreamText,
                analysis: analysis,
                language: language
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '图像生成失败');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('图像生成API错误:', error);
        throw error;
    }
}

// 显示生成的图像
function displayGeneratedImage(imageUrl) {
    imageContainer.innerHTML = `
        <img src="${imageUrl}" alt="梦境图像" class="generated-image" onload="this.style.opacity='1'">
    `;
    
    // 添加到Dream Gallery
    addToDreamGallery(currentDream, imageUrl);
}

// 添加到Dream Gallery
function addToDreamGallery(dreamText, imageUrl, customDate = null) {
    // 隐藏占位符
    galleryPlaceholder.style.display = 'none';
    
    // 创建画廊项目
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    const dreamTitle = dreamText.length > 50 ? dreamText.substring(0, 50) + '...' : dreamText;
    const currentDate = customDate || new Date().toLocaleDateString();
    
    galleryItem.innerHTML = `
        <img src="${imageUrl}" alt="Dream Image" class="gallery-item-image" onerror="this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop'">
        <div class="gallery-item-content">
            <div class="gallery-item-title">${dreamTitle}</div>
            <div class="gallery-item-dream">${dreamText}</div>
            <div class="gallery-item-date">${currentDate}</div>
        </div>
    `;
    
    // 添加到画廊开头
    galleryGrid.insertBefore(galleryItem, galleryGrid.firstChild);
    
    // 限制画廊项目数量（最多显示12个）
    const items = galleryGrid.querySelectorAll('.gallery-item');
    if (items.length > 12) {
        items[items.length - 1].remove();
    }
}

// 初始化Dream Gallery
function initDreamGallery() {
    // 添加一些示例梦境
    const sampleDreams = [
        {
            dream: "I was flying over a beautiful purple flower field with rainbow clouds",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
            date: "2024-01-15"
        },
        {
            dream: "梦见我在一片紫色的花海中漫步，天空中有彩虹",
            image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
            date: "2024-01-14"
        },
        {
            dream: "Soñé que estaba en un jardín mágico lleno de mariposas doradas",
            image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop",
            date: "2024-01-13"
        },
        {
            dream: "梦见自己在星空下漫步，周围是闪烁的萤火虫",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
            date: "2024-01-12"
        },
        {
            dream: "I dreamed of a crystal palace floating in the clouds",
            image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
            date: "2024-01-11"
        },
        {
            dream: "梦见自己变成了一只蝴蝶，在花丛中自由飞翔",
            image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop",
            date: "2024-01-10"
        },
        {
            dream: "Soñé que nadaba en un océano de estrellas brillantes",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
            date: "2024-01-09"
        },
        {
            dream: "梦见自己在一个充满魔法森林的世界里探险",
            image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
            date: "2024-01-08"
        },
        {
            dream: "I was walking through a corridor of mirrors reflecting infinite possibilities",
            image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop",
            date: "2024-01-07"
        },
        {
            dream: "梦见自己坐在月亮上，俯瞰着整个地球",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
            date: "2024-01-06"
        }
    ];
    
    if (sampleDreams.length > 0) {
        galleryPlaceholder.style.display = 'none';
        
        sampleDreams.forEach(dream => {
            addToDreamGallery(dream.dream, dream.image, dream.date);
        });
    } else {
        galleryPlaceholder.style.display = 'block';
    }
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#B399D4' : type === 'error' ? '#E2C4F7' : '#8A7CBF'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(93, 53, 135, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        font-family: 'Playfair Display', serif;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter 或 Cmd+Enter 提交梦境分析
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleDreamAnalysis();
    }
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面DOM加载完成，开始初始化...');
    
    // 获取DOM元素
    dreamInput = document.getElementById('dream-input');
    analyzeBtn = document.getElementById('analyze-btn');
    resultsSection = document.getElementById('results-section');
    loadingSpinner = document.getElementById('loading-spinner');
    analysisResult = document.getElementById('analysis-result');
    analysisContent = document.getElementById('analysis-content');
    imageGeneration = document.getElementById('image-generation');
    imageContainer = document.getElementById('image-container');
    generateImageBtn = document.getElementById('generate-image-btn');
    inputHint = document.getElementById('input-hint');
    
    console.log('主要DOM元素获取完成:', {
        dreamInput: !!dreamInput,
        analyzeBtn: !!analyzeBtn,
        generateImageBtn: !!generateImageBtn
    });
    
    // 语言下拉菜单元素
    languageDropdown = document.querySelector('.language-dropdown');
    languageDropdownBtn = document.getElementById('language-dropdown-btn');
    languageDropdownContent = document.getElementById('language-dropdown-content');
    currentLanguageSpan = document.getElementById('current-language');
    
    console.log('语言切换元素获取完成:', {
        languageDropdown: !!languageDropdown,
        languageDropdownBtn: !!languageDropdownBtn,
        languageDropdownContent: !!languageDropdownContent
    });
    
    // 画廊元素
    dreamGallery = document.getElementById('dream-gallery');
    galleryGrid = document.getElementById('gallery-grid');
    galleryPlaceholder = document.getElementById('gallery-placeholder');
    
    // 初始化语言
    initLanguage();
    
    // 初始化语言下拉菜单事件
    if (languageDropdownBtn) {
        console.log('正在绑定语言切换按钮事件...');
        languageDropdownBtn.addEventListener('click', (e) => {
            console.log('语言切换按钮被点击');
            toggleLanguageDropdown(e);
        });
        document.addEventListener('click', handleLanguageDropdownClick);
        
        const languageOptions = document.querySelectorAll('.language-option');
        console.log('找到语言选项数量:', languageOptions.length);
        
        languageOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                console.log('语言选项被点击:', option.dataset.lang);
                e.preventDefault();
                e.stopPropagation();
                selectLanguage(option.dataset.lang);
            });
        });
    } else {
        console.error('语言切换按钮未找到！');
    }
    
    // 初始化Dream Gallery
    initDreamGallery();
    
    // 绑定事件监听器 - 在语言初始化之后
    if (analyzeBtn) {
        console.log('正在绑定分析按钮事件...');
        // 先移除可能存在的旧事件监听器
        analyzeBtn.removeEventListener('click', handleDreamAnalysis);
        
        // 添加新的事件监听器
        analyzeBtn.addEventListener('click', (e) => {
            console.log('分析按钮被点击');
            handleDreamAnalysis();
        });
        
        // 确保按钮可以点击
        analyzeBtn.style.pointerEvents = 'auto';
        analyzeBtn.style.cursor = 'pointer';
        
        console.log('分析按钮事件绑定完成，按钮样式:', {
            pointerEvents: analyzeBtn.style.pointerEvents,
            cursor: analyzeBtn.style.cursor,
            disabled: analyzeBtn.disabled
        });
    } else {
        console.error('找不到analyze按钮！');
    }
    
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', handleImageGeneration);
    } else {
        console.error('找不到generate按钮！');
    }
    
    // 输入框事件
    dreamInput.addEventListener('input', handleDreamInput);
    dreamInput.addEventListener('focus', showInputHint);
    dreamInput.addEventListener('blur', hideInputHint);
    
    // 添加按钮点击效果（排除analyze按钮和generate按钮，因为它们已经有自己的事件处理）
    const buttons = document.querySelectorAll('button:not(#analyze-btn):not(#generate-image-btn)');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});

// 语言下拉菜单切换
function toggleLanguageDropdown(e) {
    e.stopPropagation();
    languageDropdown.classList.toggle('active');
}

// 处理语言下拉菜单点击
function handleLanguageDropdownClick(e) {
    if (!languageDropdown.contains(e.target)) {
        languageDropdown.classList.remove('active');
    }
}

// 处理语言选择
function selectLanguage(lang) {
    console.log('正在切换语言到:', lang);
    
    // 调用translations.js中的switchLanguage函数来处理语言切换
    switchLanguage(lang);
    languageDropdown.classList.remove('active');
    
    // 验证语言是否正确切换
    setTimeout(() => {
        const currentLang = getCurrentLanguage();
        console.log('语言切换后，当前语言:', currentLang);
    }, 100);
    
    // 更新当前语言显示
    const languageNames = {
        'en': 'English',
        'es': 'Español',
        'zh': '中文'
    };
    currentLanguageSpan.textContent = languageNames[lang];
    
    // 更新选项状态
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.lang === lang) {
            option.classList.add('active');
        }
    });
}

// 处理梦境输入
function handleDreamInput() {
    const dreamText = dreamInput.value.trim();
    if (dreamText.length > 0) {
        showInputHint();
    } else {
        hideInputHint();
    }
}

// 显示输入提示
function showInputHint() {
    inputHint.classList.add('show');
}

// 隐藏输入提示
function hideInputHint() {
    setTimeout(() => {
        inputHint.classList.remove('show');
    }, 300);
} 