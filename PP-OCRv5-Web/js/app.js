/**
 * 应用主流程初始化与事件绑定
 */
document.addEventListener('DOMContentLoaded', () => {

    // ==================== A. 响应结果展示 Tab 切换 ====================
    const resultFormatTabs = document.getElementById('resultFormatTabs');
    const resultViews = {
        text: document.getElementById('viewText'),
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

        let payload = {};

        // 收集参数与字段校验
        try {
            payload = ParamCollector.collectOcrParams();
        } catch (err) {
            showToast(err.message);
            return;
        }

        // 进入 Loading 状态
        btnSend.disabled = true;
        btnText.textContent = '请求发送中...';
        spinner.style.display = 'inline-block';

        // 发送 API 请求到 /ocr 端点
        const response = await ApiClient.sendRequest(baseUrl, '/ocr', payload);

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

    // ==================== F. 置信度双滑块范围筛选逻辑 ====================
    const minConfRange = document.getElementById('minConfRange');
    const maxConfRange = document.getElementById('maxConfRange');
    const minConfVal = document.getElementById('minConfVal');
    const maxConfVal = document.getElementById('maxConfVal');
    const sliderTrack = document.getElementById('sliderTrack');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const filterContainer = document.querySelector('.confidence-filter-container');

    // 缓存当前处于活动焦点的滑块，默认是最小置信度滑块
    let activeSlider = minConfRange;

    // 动态更新滑块轨道的激活进度条高亮背景
    function updateSliderTrack() {
        if (!minConfRange || !maxConfRange || !sliderTrack) return;
        const minPercent = minConfRange.value;
        const maxPercent = maxConfRange.value;
        
        // 利用 CSS linear-gradient 动态设置两滑块之间的高亮激活区间
        sliderTrack.style.background = `linear-gradient(to right, var(--switch-track) ${minPercent}%, var(--primary-color) ${minPercent}%, var(--primary-color) ${maxPercent}%, var(--switch-track) ${maxPercent}%)`;
    }

    // 动态调整滑块的层级 z-index，以确保当它们数值重合或接近时，鼠标依然能选中想要拖动的滑块
    function adjustZIndex() {
        if (!minConfRange || !maxConfRange) return;
        const minVal = parseInt(minConfRange.value);
        
        // 当最小置信度滑块值接近或到达最大值时，如果是最小值滑块被激活，让其层级变高，否则默认让最小值层级偏高
        if (minVal > 50) {
            minConfRange.style.zIndex = '5';
            maxConfRange.style.zIndex = '4';
        } else {
            minConfRange.style.zIndex = '4';
            maxConfRange.style.zIndex = '5';
        }
    }

    // 切换活动滑块，并为活动滑块添加 focused 类名以进行视觉高亮
    function setActiveSlider(slider) {
        if (!slider) return;
        activeSlider = slider;
        minConfRange.classList.toggle('focused', slider === minConfRange);
        maxConfRange.classList.toggle('focused', slider === maxConfRange);
    }

    // 统一处理滑块输入的联动校验与高亮刷新
    function handleSliderInput(e) {
        if (!minConfRange || !maxConfRange) return;

        let minVal = parseInt(minConfRange.value);
        let maxVal = parseInt(maxConfRange.value);

        // 越界校验：防交叉
        if (e && e.target === minConfRange) {
            if (minVal > maxVal) {
                minConfRange.value = maxVal;
                minVal = maxVal;
            }
            setActiveSlider(minConfRange);
        } else if (e && e.target === maxConfRange) {
            if (maxVal < minVal) {
                maxConfRange.value = minVal;
                maxVal = minVal;
            }
            setActiveSlider(maxConfRange);
        }

        // 更新数值标签
        if (minConfVal) minConfVal.textContent = minVal + '%';
        if (maxConfVal) maxConfVal.textContent = maxVal + '%';

        // 刷新轨道样式与 z-index 状态
        updateSliderTrack();
        adjustZIndex();

        // 触发文本结果面板的筛选（直接使用全局常量 ResultRenderer，避开 window 作用域局限）
        if (typeof ResultRenderer !== 'undefined' && typeof ResultRenderer.filterResults === 'function') {
            ResultRenderer.filterResults();
        }
    }

    // 支持鼠标滚轮在整个过滤器区域对当前活跃滑块的数值进行微调
    function handleSliderWheel(e) {
        if (!activeSlider) return;
        
        // 阻止页面整体滚动
        e.preventDefault();
        
        const step = 1; // 滚轮微调步长为 1%
        let currentVal = parseInt(activeSlider.value);
        
        // 向上滚动增加，向下滚动减少
        if (e.deltaY < 0) {
            currentVal = Math.min(currentVal + step, 100);
        } else {
            currentVal = Math.max(currentVal - step, 0);
        }
        
        activeSlider.value = currentVal;
        
        // 手动触发 input 事件以级联执行过滤逻辑
        const event = new Event('input', { bubbles: true });
        activeSlider.dispatchEvent(event);
    }

    if (minConfRange && maxConfRange) {
        // 绑定滑块拖动事件
        minConfRange.addEventListener('input', handleSliderInput);
        maxConfRange.addEventListener('input', handleSliderInput);

        // 绑定鼠标点击/获取焦点事件来切换活动滑块
        minConfRange.addEventListener('focus', () => setActiveSlider(minConfRange));
        maxConfRange.addEventListener('focus', () => setActiveSlider(maxConfRange));
        minConfRange.addEventListener('mousedown', () => setActiveSlider(minConfRange));
        maxConfRange.addEventListener('mousedown', () => setActiveSlider(maxConfRange));

        // 监听整个过滤器区域的 wheel 事件，避免鼠标脱离 Thumb 导致无法滚动
        if (filterContainer) {
            filterContainer.addEventListener('wheel', handleSliderWheel, { passive: false });
        }

        // 绑定重置按钮
        if (btnResetFilter) {
            btnResetFilter.addEventListener('click', () => {
                minConfRange.value = 0;
                maxConfRange.value = 100;
                if (minConfVal) minConfVal.textContent = '0%';
                if (maxConfVal) maxConfVal.textContent = '100%';
                setActiveSlider(minConfRange);
                updateSliderTrack();
                adjustZIndex();
                if (typeof ResultRenderer !== 'undefined' && typeof ResultRenderer.filterResults === 'function') {
                    ResultRenderer.filterResults();
                }
                showToast('已重置置信度筛选范围');
            });
        }

        // 默认将最小置信度滑块作为活跃滑块高亮展示
        setActiveSlider(minConfRange);

        // 初始化滑块轨道背景和层级
        updateSliderTrack();
        adjustZIndex();
    }
});
