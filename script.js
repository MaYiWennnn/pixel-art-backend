// DOM 元素
const dropBox = document.getElementById('dropBox');
const fileInput = document.getElementById('fileInput');
const createBtn = document.getElementById('createBtn');
const resultBox = document.getElementById('resultBox');
const downloadBtn = document.getElementById('downloadBtn');

// 全局变量：存储原图 Base64（不含前缀）
let originalImageBase64 = null;

// 拖拽上传逻辑（保持原有）
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropBox.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropBox.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropBox.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropBox.style.borderColor = '#0078ff';
    dropBox.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
}

function unhighlight() {
    dropBox.style.borderColor = '#ccc';
    dropBox.style.backgroundColor = 'transparent';
}

dropBox.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const file = e.dataTransfer.files[0];
    if (file) {
        handleFile(file);
    }
}

// 点击上传（保持原有）
dropBox.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// 处理文件：提取纯 Base64（关键！去掉 data:image/... 前缀）
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        // 提取 Base64 内容（去掉前缀）
        originalImageBase64 = e.target.result.split(',')[1];
        // 预览原图
        dropBox.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
    };
    reader.readAsDataURL(file);
}

// 调用后端代理生成像素画（关键！避免跨域）
createBtn.addEventListener('click', async () => {
    if (!originalImageBase64) {
        alert('请先上传图片');
        return;
    }

    try {
        // 显示加载状态
        resultBox.innerHTML = '<p style="color:white;">生成中，请等待...</p>';

        // 调用后端代理接口（而非直接调 SD3）
        const response = await fetch('https://pixel-art-backend-lwcd.onrender.com/generate-pixel-art', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: '转换为 8-bit 像素画风格，复古游戏画面质感，色彩鲜明',
                init_image: originalImageBase64,
                output_format: 'jpeg'
            })
        });

        const data = await response.json();
        if (data.success && data.imageUrl) {
            // 显示生成的像素画
            resultBox.innerHTML = `<img src="${data.imageUrl}" alt="像素画">`;
            downloadBtn.disabled = false;
            downloadBtn.dataset.downloadUrl = data.imageUrl;
        } else {
            resultBox.innerHTML = `<p style="color:red;">生成失败：${data.error}</p>`;
        }
    } catch (err) {
        console.error('请求失败:', err);
        resultBox.innerHTML = `<p style="color:red;">网络错误，请重试</p>`;
    }
});

// 下载功能
downloadBtn.addEventListener('click', () => {
    const url = downloadBtn.dataset.downloadUrl;
    if (url) {
        const link = document.createElement('a');
        link.download = 'pixel-art.jpg';
        link.href = url;
        link.click();
    }
});