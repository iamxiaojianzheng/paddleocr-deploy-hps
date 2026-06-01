/**
 * PP-StructureV3 API 客户端封装
 */
const ApiClient = {
    /**
     * 发送 POST 请求到 API
     * @param {string} baseUrl - API 的基础 URL (如 http://localhost:8082)
     * @param {string} endpoint - API 端点 (如 /layout-parsing)
     * @param {Object} payload - 请求体 JSON 对象
     * @returns {Promise<{status: number, data: Object, duration: number}>}
     */
    async sendRequest(baseUrl, endpoint, payload) {
        const url = `${baseUrl.replace(/\/+$/, '')}${endpoint}`;
        const startTime = performance.now();
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            let data;
            
            try {
                data = await response.json();
            } catch (err) {
                // 如果返回不是 JSON
                data = {
                    errorCode: response.status,
                    errorMsg: `无法解析服务端返回的 JSON 数据。原始状态: ${response.statusText}`
                };
            }
            
            return {
                status: response.status,
                data: data,
                duration: parseFloat(duration)
            };
            
        } catch (error) {
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            return {
                status: 0,
                data: {
                    errorCode: -1,
                    errorMsg: `请求失败: ${error.message}。请确保 API 服务正常运行，并检查是否已允许跨域请求 (CORS)。`
                },
                duration: parseFloat(duration)
            };
        }
    },

    /**
     * 将文件转换为 Base64 字符串
     * @param {File} file 
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // 去除 Data URL 的前缀 (例如 "data:image/png;base64,")
                const base64Str = reader.result.split(',')[1];
                resolve(base64Str);
            };
            reader.onerror = error => reject(error);
        });
    },

    /**
     * 下载 Base64 编码的文件
     * @param {string} base64Data - 纯 Base64 数据 
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME 类型 
     */
    downloadBase64File(base64Data, filename, mimeType) {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
