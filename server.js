const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
const PORT = process.env.PORT || 3000; // 兼容本地和云部署

// Midjourney 代理 API 配置（替换为你的实际参数）
const MIDJOURNEY_API_KEY = '5f924ee542664623825696b0b46511e1'; // 你的 API Key
const MIDJOURNEY_BASE_URL = 'https://api.acedata.cloud/midjourney/imagine'; // 代理地址

// 中间件：允许跨域请求（解决前端调用限制）
app.use(cors());
// 解析 JSON 格式的请求体
app.use(express.json());

/**
 * 生成像素画的核心接口
 * 前端需传递：
 * - prompt: 生成描述（如"像素画风格，8-bit复古效果"）
 * - init_image: 原图的 Base64 字符串（不含 data:... 前缀）
 */
app.post('/generate-pixel-art', async (req, res) => {
    try {
        // 1. 从前端获取参数
        const { prompt, init_image } = req.body;

        // 校验必填参数
        if (!prompt || !init_image) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：prompt（生成描述）和 init_image（原图 Base64）为必填项'
            });
        }

        // 2. 构造 Midjourney 代理 API 请求体（需和代理文档匹配）
        // 假设代理 API 要求 FormData 格式，包含 prompt 和 image 参数
        const formData = new FormData();
        formData.append('prompt', prompt); // 生成描述（如"基于原图生成像素画，8-bit风格"）
        formData.append('image', init_image); // 原图 Base64（不含前缀）
        formData.append('model', 'Midjourney'); // 固定值，按你的 Python 示例
        formData.append('api_key', MIDJOURNEY_API_KEY); // 传递 API Key（或通过 Header）

        // 3. 调用 Midjourney 代理 API
        const response = await axios.post(
            MIDJOURNEY_BASE_URL,
            formData,
            {
                headers: {
                    ...formData.getHeaders(), // 自动添加 FormData 所需的 Content-Type
                    // 如果代理 API 需要 Header 传 Key，可替换下面的方式：
                    // 'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`
                },
                responseType: 'json' // 假设代理返回 JSON 格式（含图片 URL）
            }
        );

        // 4. 处理 API 响应（需和代理返回格式匹配）
        // 假设代理返回 { success: true, image_url: "https://..." }
        if (response.data && response.data.success && response.data.image_url) {
            return res.json({
                success: true,
                imageUrl: response.data.image_url // 前端可直接用此 URL 显示
            });
        } else {
            // 代理返回错误（如参数错误、配额不足等）
            return res.json({
                success: false,
                error: `Midjourney 代理错误: ${response.data?.error || '未知错误'}`
            });
        }

    } catch (error) {
        // 捕获网络错误或其他异常
        console.error('生成失败:', error);
        res.json({
            success: false,
            error: `服务器错误: ${error.message || '调用代理 API 失败'}`
        });
    }
});

// 测试接口（可选）
app.get('/health', (req, res) => {
    res.json({ status: 'running', port: PORT });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Midjourney 代理后端已启动：http://localhost:${PORT}`);
    console.log(`生成接口：POST http://localhost:${PORT}/generate-pixel-art`);
});