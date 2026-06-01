/**
 * 应用主流程初始化与事件绑定
 */
document.addEventListener('DOMContentLoaded', () => {

    // ==================== A. 响应结果展示 Tab 切换 ====================
    const resultFormatTabs = document.getElementById('resultFormatTabs');
    const resultViews = {
        markdown: document.getElementById('viewMarkdown'),
        images: document.getElementById('viewImages'),
        input: document.getElementById('viewInput'),
        json: document.getElementById('viewJson')
    };

    resultFormatTabs.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-btn')) return;

        // 切换 Tab Class
        Array.from(resultFormatTabs.children).forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // 切换 View 展示
        const viewKey = e.target.getAttribute('data-tab');
        Object.keys(resultViews).forEach(key => {
            if (key === viewKey) {
                resultViews[key].classList.add('active');
            } else {
                resultViews[key].classList.remove('active');
            }
        });
    });

    // ==================== B. 文件上传拖拽处理 ====================
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadPlaceholder = uploadArea.querySelector('.upload-placeholder');
    const uploadPreview = uploadArea.querySelector('.upload-preview');
    const previewFilename = uploadArea.querySelector('.preview-filename');
    const btnClearFile = uploadArea.querySelector('.btn-clear-file');
    const fileTypeSelect = document.getElementById('fileType');

    // 点击拖拽区触发 input[type="file"]
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== btnClearFile && !btnClearFile.contains(e.target)) {
            fileInput.click();
        }
    });

    // 文件拖拽效果
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        }, false);
    });

    // 拖拽放入文件
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleUploadedFile(files[0]);
        }
    });

    // 选择文件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFile(e.target.files[0]);
        }
    });

    // 清除文件
    btnClearFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileInput();
    });

    // 处理文件数据
    async function handleUploadedFile(file) {
        try {
            // 自动推断并修改 fileType 下拉框
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                fileTypeSelect.value = '0'; // PDF
            } else if (file.type.startsWith('image/')) {
                fileTypeSelect.value = '1'; // Image
            }

            // 转为 Base64
            ParamCollector.currentFileBase64 = await ApiClient.fileToBase64(file);
            ParamCollector.currentFileName = file.name;

            // 更新界面显示
            previewFilename.textContent = file.name;
            uploadPlaceholder.style.display = 'none';
            uploadPreview.style.display = 'flex';
            
            // 可视化类型图标切换
            const typeIcon = uploadPreview.querySelector('.preview-type-icon');
            const docSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
            const imageSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
            typeIcon.innerHTML = fileTypeSelect.value === '0' ? docSvg : imageSvg;

            showToast('已加载文件: ' + file.name);
        } catch (err) {
            showToast('处理文件出错: ' + err.message);
            resetFileInput();
        }
    }

    function resetFileInput() {
        ParamCollector.currentFileBase64 = null;
        ParamCollector.currentFileName = '';
        fileInput.value = '';
        uploadPlaceholder.style.display = 'flex';
        uploadPreview.style.display = 'none';
        fileTypeSelect.value = ''; // 恢复自动
        showToast('已移除文件');
    }

    // ==================== C. API 发送请求处理 ====================
    const btnSend = document.getElementById('btnSend');
    const btnText = btnSend.querySelector('.btn-text');
    const spinner = btnSend.querySelector('.spinner');
    const apiUrlInput = document.getElementById('apiUrl');

    btnSend.addEventListener('click', async () => {
        const baseUrl = apiUrlInput.value.trim();
        if (!baseUrl) {
            showToast('请输入有效的 API Base URL');
            return;
        }

        let endpoint = '/layout-parsing';
        let payload = {};

        // 收集参数与字段校验
        try {
            payload = ParamCollector.collectLayoutParsingParams();
        } catch (err) {
            showToast(err.message);
            return;
        }

        // 进入 Loading 状态
        btnSend.disabled = true;
        btnText.textContent = '请求发送中...';
        spinner.style.display = 'inline-block';

        // 发送 API 请求
        const response = await ApiClient.sendRequest(baseUrl, endpoint, payload);

        // 恢复按钮状态
        btnSend.disabled = false;
        btnText.textContent = '发送 API 请求';
        spinner.style.display = 'none';

        // 渲染请求结果
        ResultRenderer.render(response.data, response.status, response.duration);
    });

    // ==================== D. 主题切换交互 ====================
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    // 初始化主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        showToast(`已切换至 ${newTheme === 'dark' ? '暗色' : '浅色'}模式`);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
        } else {
            themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
        }
    }

    // ==================== E. API 状态检测 ====================
    const apiStatusDot = document.getElementById('apiStatusDot');

    // 更新指示灯状态和提示信息
    function updateApiStatus(status) {
        if (!apiStatusDot) return;
        apiStatusDot.className = 'status-dot';
        if (status === 'online') {
            apiStatusDot.classList.add('online');
            apiStatusDot.title = 'API 服务可用';
        } else if (status === 'offline') {
            apiStatusDot.classList.add('offline');
            apiStatusDot.title = 'API 服务不可用';
        } else {
            apiStatusDot.classList.add('checking');
            apiStatusDot.title = '正在检测 API 状态...';
        }
    }

    // 探测 URL 连通性
    async function checkUrlAccessibility(url) {
        if (!url) return false;
        try {
            const targetUrl = url.replace(/\/+$/, '');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            // 优先使用 OPTIONS 请求探测连通性
            await fetch(targetUrl, {
                method: 'OPTIONS',
                signal: controller.signal,
                mode: 'cors'
            });
            clearTimeout(timeoutId);
            return true;
        } catch (err) {
            // 若 OPTIONS 失败，改用 no-cors 模式的 GET 再次探测，规避跨域限制
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500);
                await fetch(targetUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    let checkTimeout = null;
    // 执行状态检测
    async function triggerStatusCheck() {
        const url = apiUrlInput.value.trim();
        if (!url) {
            updateApiStatus('offline');
            return;
        }
        updateApiStatus('checking');
        const isAccessible = await checkUrlAccessibility(url);
        updateApiStatus(isAccessible ? 'online' : 'offline');
    }

    // 输入防抖检测
    function debouncedCheck() {
        if (checkTimeout) clearTimeout(checkTimeout);
        checkTimeout = setTimeout(triggerStatusCheck, 800);
    }

    if (apiUrlInput) {
        apiUrlInput.addEventListener('input', debouncedCheck);
        apiUrlInput.addEventListener('change', triggerStatusCheck);
        
        // 首次加载立即执行检测
        triggerStatusCheck();
        
        // 开启 10 秒轮询心跳检测
        setInterval(triggerStatusCheck, 10000);
    }
});
