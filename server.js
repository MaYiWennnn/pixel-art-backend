const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const bodyParser = require('body-parser'); // 引入 body-parser
const app = express();
const PORT = process.env.PORT || 3000;

// Midjourney 代理 API 配置
const MIDJOURNEY_API_KEY = '5f924ee542664623825696b0b46511e1';
const MIDJOURNEY_BASE_URL = 'https://api.acedata.cloud/midjourney/imagine';

// 中间件：允许跨域请求
app.use(cors());

// 使用 body-parser 中间件，设置合适的请求体大小限制，这里设置为 50MB（50 * 1024 * 1024 字节）
// 你可以根据实际需求调整这个值，例如 10MB 就是 10 * 1024 * 1024
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// 解析 JSON 格式的请求体（这里原本的 express.json() 可以注释掉或者删除，因为 body-parser 已经包含了相关功能）
// app.use(express.json()); 

// 生成像素画的核心接口
app.post('/generate-pixel-art', async (req, res) => {
    try {
        const { prompt, init_image } = req.body;

        // 校验必填参数
        if (!prompt || !init_image) {
            return res.status(400).json({
                success: false,
                error: '缺少参数：prompt（生成描述）和 init_image（原图 Base64）为必填项'
            });
        }

        // 构造 Midjourney 代理 API 请求体
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('image', init_image);
        formData.append('model', 'Midjourney');
        formData.append('api_key', MIDJOURNEY_API_KEY);

        // 调用 Midjourney 代理 API
        const response = await axios.post(
            MIDJOURNEY_BASE_URL,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
                responseType: 'json'
            }
        );

        // 处理 API 响应
        if (response.data && response.data.success && response.data.image_url) {
            return res.json({
                success: true,
                imageUrl: response.data.image_url
            });
        } else {
            return res.json({
                success: false,
                error: `Midjourney 代理错误: ${response.data?.error || '未知错误'}`
            });
        }

    } catch (error) {
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