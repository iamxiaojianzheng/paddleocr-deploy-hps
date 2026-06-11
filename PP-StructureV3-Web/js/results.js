/**
 * HTML 特殊字符转义，防止 XSS 注入
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * 处理 API 响应结果的展示与渲染
 */
const ResultRenderer = {
    // 缓存当前的响应数据和页码状态
    currentResults: null,
    currentPageIndex: 0,

    /**
     * 主渲染入口
     * @param {Object} responseData - API 完整响应体
     * @param {number} statusCode - HTTP 状态码
     * @param {number} duration - 耗时(秒)
     */
    render(responseData, statusCode, duration) {
        this.currentResults = responseData;
        this.currentPageIndex = 0;

        // 1. 隐藏空状态，显示结果面板
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'flex';

        // 重置结果面板 Tab 到默认的 Markdown 预览
        const resultFormatTabs = document.getElementById('resultFormatTabs');
        if (resultFormatTabs) {
            Array.from(resultFormatTabs.children).forEach(btn => btn.classList.remove('active'));
            const defaultTab = resultFormatTabs.querySelector('[data-tab="markdown"]');
            if (defaultTab) defaultTab.classList.add('active');
        }
        ['viewMarkdown', 'viewImages', 'viewInput', 'viewJson'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', id === 'viewMarkdown');
        });

        // 2. 渲染状态栏 (Status Bar)
        const statusBar = document.getElementById('statusBar');
        const statusBadge = document.getElementById('statusBadge');
        const timeBadge = document.getElementById('timeBadge');
        const logIdValue = document.getElementById('logIdValue');

        statusBar.style.display = 'flex';
        statusBadge.textContent = `${statusCode} ${statusCode === 200 ? 'OK' : 'Error'}`;
        statusBadge.className = `status-badge ${statusCode === 200 ? 'success' : 'error'}`;
        timeBadge.textContent = `${duration}s`;
        logIdValue.textContent = responseData.logId || 'N/A';

        // 如果 errorCode 不为 0，展示错误消息
        if (responseData.errorCode !== 0) {
            this.renderError(responseData);
            return;
        }

        // 3. 解析并展示结果数据
        const resultsArray = responseData.result ? responseData.result.layoutParsingResults : null;

        if (resultsArray && resultsArray.length > 0) {
            // 配置多页导航
            this.setupPageSelector(resultsArray.length);
            // 渲染当前页数据
            this.renderPageData(resultsArray[this.currentPageIndex]);
        } else {
            // 没有版面解析结果（例如某些异常响应但 errorCode 为 0）
            document.getElementById('pageSelector').style.display = 'none';
            document.getElementById('markdownRendered').innerHTML = '<div style="color: var(--text-muted)">无版面解析结果数据</div>';
            document.getElementById('visualizeImagesGrid').innerHTML = '';
        }

        // 4. 渲染 JSON 源码
        this.renderJson(responseData);
    },

    /**
     * 渲染错误信息
     */
    renderError(data) {
        document.getElementById('pageSelector').style.display = 'none';
        
        // 转义 errorMsg 防止 XSS 注入
        const safeMsg = escapeHtml(data.errorMsg || '未知错误');
        const safeCode = escapeHtml(String(data.errorCode));
        const errorHtml = `
            <div style="padding: 20px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); border-radius: 8px;">
                <h4 style="color: var(--error); margin-bottom: 8px; font-weight: 600;">API 调用返回错误 (errorCode: ${safeCode})</h4>
                <p style="color: var(--text-secondary); font-size: 13px;">${safeMsg}</p>
            </div>
        `;
        document.getElementById('markdownRendered').innerHTML = errorHtml;
        
        // 其它 tab 重置为空
        document.getElementById('visualizeImagesGrid').innerHTML = '<div style="color: var(--text-muted); padding:20px;">无可视化图像</div>';
        document.getElementById('inputImagePreview').src = '';
        document.getElementById('viewInput').querySelector('.input-image-container').style.display = 'none';
        
        this.renderJson(data);
    },

    /**
     * 动态生成并设置分页切换按钮
     * @param {number} totalPages 
     */
    setupPageSelector(totalPages) {
        const pageSelector = document.getElementById('pageSelector');
        const pageButtons = document.getElementById('pageButtons');
        pageButtons.innerHTML = '';

        if (totalPages <= 1) {
            pageSelector.style.display = 'none';
            return;
        }

        pageSelector.style.display = 'flex';
        for (let i = 0; i < totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === this.currentPageIndex ? 'active' : ''}`;
            btn.textContent = i + 1;
            btn.addEventListener('click', () => {
                // 切换激活按钮
                Array.from(pageButtons.children).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 渲染选中页
                this.currentPageIndex = i;
                const resultsArray = this.currentResults.result.layoutParsingResults;
                this.renderPageData(resultsArray[i]);
            });
            pageButtons.appendChild(btn);
        }
    },

    /**
     * 渲染单页结果数据 (Markdown、可视化图像等)
     * @param {Object} pageData - layoutParsingResults 中的单个元素
     */
    renderPageData(pageData) {
        if (!pageData) return;

        // 1. 渲染 Markdown
        const markdownObj = pageData.markdown || {};
        let mdText = markdownObj.text || '';
        const mdImages = markdownObj.images || {};

        // 重要：将 Markdown 中的相对图片路径(如 images/page_0_0.png) 替换为 Base64 编码
        for (const [imgPath, imgBase64] of Object.entries(mdImages)) {
            // 构建正则匹配 ![](images/page_0_0.png) 或 ![alt](images/page_0_0.png)
            // 转义特殊路径字符
            const escapedPath = imgPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(!\\[.*?\\]\\()${escapedPath}(\\))`, 'g');
            mdText = mdText.replace(regex, `$1data:image/jpeg;base64,${imgBase64}$2`);
        }

        // 使用 marked.js 渲染 HTML
        if (typeof marked !== 'undefined' && mdText) {
            document.getElementById('markdownRendered').innerHTML = marked.parse(mdText);
        } else {
            document.getElementById('markdownRendered').textContent = mdText || '无文本内容';
        }

        // 2. 可视化图处理 (outputImages)
        const visualizeGrid = document.getElementById('visualizeImagesGrid');
        visualizeGrid.innerHTML = '';
        const outputImages = pageData.outputImages || {};

        if (outputImages && Object.keys(outputImages).length > 0) {
            for (const [key, base64] of Object.entries(outputImages)) {
                if (base64) {
                    const card = document.createElement('div');
                    card.className = 'visualize-card';
                    const safeKey = escapeHtml(key);
                    const titleEl = document.createElement('div');
                    titleEl.className = 'visualize-card-title';
                    titleEl.textContent = key;
                    const img = document.createElement('img');
                    img.src = `data:image/jpeg;base64,${base64}`;
                    img.alt = safeKey;
                    img.addEventListener('click', () => showImagePreview(img.src));
                    card.appendChild(titleEl);
                    card.appendChild(img);
                    visualizeGrid.appendChild(card);
                }
            }
        } else {
            visualizeGrid.innerHTML = '<div style="color: var(--text-muted); padding: 20px;">接口未返回可视化图（请确认是否开启了 visualize 参数）</div>';
        }

        // 3. 输入图像处理 (inputImage)
        const inputImgPreview = document.getElementById('inputImagePreview');
        const inputImgContainer = document.getElementById('viewInput').querySelector('.input-image-container');
        if (pageData.inputImage) {
            inputImgPreview.src = `data:image/jpeg;base64,${pageData.inputImage}`;
            inputImgContainer.style.display = 'flex';
        } else {
            inputImgPreview.src = '';
            inputImgContainer.style.display = 'none';
        }
    },

    /**
     * 将任意 JS 对象渲染为支持折叠的高亮 HTML 字符串
     */
    jsonToHtml(value, key = null, isLast = true) {
        const type = typeof value;
        let html = '';
        
        // 渲染 key
        let keyHtml = '';
        if (key !== null) {
            keyHtml = `<span class="json-key">"${escapeHtml(key)}"</span>: `;
        }
        
        const commaHtml = isLast ? '' : '<span class="json-comma">,</span>';
        
        if (value === null) {
            html += `<div class="json-row">${keyHtml}<span class="json-null">null</span>${commaHtml}</div>`;
        } else if (type === 'number') {
            html += `<div class="json-row">${keyHtml}<span class="json-number">${value}</span>${commaHtml}</div>`;
        } else if (type === 'boolean') {
            html += `<div class="json-row">${keyHtml}<span class="json-boolean">${value}</span>${commaHtml}</div>`;
        } else if (type === 'string') {
            html += `<div class="json-row">${keyHtml}<span class="json-string">"${escapeHtml(value)}"</span>${commaHtml}</div>`;
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                html += `<div class="json-row">${keyHtml}<span class="json-bracket">[]</span>${commaHtml}</div>`;
            } else {
                html += `<div class="json-row json-complex">` +
                            `<span class="json-toggle">▼</span>` +
                            `${keyHtml}<span class="json-bracket">[</span>` +
                            `<span class="json-ellipsis">...</span>` +
                            `<div class="json-collapsible">`;
                value.forEach((item, index) => {
                    html += this.jsonToHtml(item, null, index === value.length - 1);
                });
                html +=     `</div>` +
                            `<span class="json-bracket">]</span>${commaHtml}` +
                        `</div>`;
            }
        } else if (type === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                html += `<div class="json-row">${keyHtml}<span class="json-bracket">{}</span>${commaHtml}</div>`;
            } else {
                html += `<div class="json-row json-complex">` +
                            `<span class="json-toggle">▼</span>` +
                            `${keyHtml}<span class="json-bracket">{</span>` +
                            `<span class="json-ellipsis">...</span>` +
                            `<div class="json-collapsible">`;
                keys.forEach((k, index) => {
                    html += this.jsonToHtml(value[k], k, index === keys.length - 1);
                });
                html +=     `</div>` +
                            `<span class="json-bracket">}</span>${commaHtml}` +
                        `</div>`;
            }
        }
        
        return html;
    },

    /**
     * 渲染格式化高亮且支持展开折叠的 JSON 源码
     */
    renderJson(data) {
        const jsonCodeElement = document.getElementById('jsonRaw');
        jsonCodeElement.innerHTML = this.jsonToHtml(data);

        // 使用事件委托绑定折叠和展开事件
        if (!jsonCodeElement.dataset.eventBound) {
            jsonCodeElement.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('json-toggle') || target.classList.contains('json-ellipsis')) {
                    const parentRow = target.closest('.json-row');
                    if (parentRow) {
                        parentRow.classList.toggle('json-collapsed');
                    }
                }
            });
            jsonCodeElement.dataset.eventBound = "true";
        }

        const btnCopy = document.getElementById('btnCopyJson');
        const newBtnCopy = btnCopy.cloneNode(true);
        btnCopy.parentNode.replaceChild(newBtnCopy, btnCopy);
        
        const jsonString = JSON.stringify(data, null, 2);
        newBtnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(jsonString).then(() => {
                showToast('JSON 数据已复制到剪贴板');
            }).catch(err => {
                showToast('复制失败: ' + err);
            });
        });
    }
};

/**
 * 全局简易消息提示 (Toast)
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 全局状态变量用于控制预览图的缩放与拖动
let zoomScale = 1;
let translateX = 0;
let translateY = 0;
let rotateDeg = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

/**
 * 图像放大预览功能
 * @param {string} src - 图像的 Base64 编码或 URL
 */
function showImagePreview(src) {
    const modal = document.getElementById('imagePreviewModal');
    const modalImg = document.getElementById('modalPreviewImage');
    if (modal && modalImg) {
        modalImg.src = src;
        
        // 重置所有的缩放、位移和旋转状态
        zoomScale = 1;
        translateX = 0;
        translateY = 0;
        rotateDeg = 0;
        
        modalImg.style.transition = 'none';
        modalImg.style.transform = 'translate(0px, 0px) scale(0.95) rotate(0deg)';
        modal.style.display = 'flex';
        
        requestAnimationFrame(() => {
            modal.classList.add('show');
            setTimeout(() => {
                modalImg.style.transition = 'transform 0.15s ease-out';
                modalImg.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
            }, 50);
        });
    }
}

// 统一绑定预览 Modal 的交互及事件
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imagePreviewModal');
    const modalImg = document.getElementById('modalPreviewImage');
    
    if (modal && modalImg) {
        const closeBtn = modal.querySelector('.modal-close-btn');
        const backdrop = modal.querySelector('.modal-backdrop');

        const applyTransform = () => {
            modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomScale}) rotate(${rotateDeg}deg)`;
        };

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (!modal.classList.contains('show')) {
                    modal.style.display = 'none';
                    modalImg.src = '';
                    zoomScale = 1;
                    translateX = 0;
                    translateY = 0;
                    rotateDeg = 0;
                    applyTransform();
                }
            }, 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });

        // 绑定底部工具栏事件
        const btnZoomIn = modal.querySelector('#btnZoomIn');
        const btnZoomOut = modal.querySelector('#btnZoomOut');
        const btnRotateLeft = modal.querySelector('#btnRotateLeft');
        const btnRotateRight = modal.querySelector('#btnRotateRight');
        const btnReset = modal.querySelector('#btnReset');

        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', (e) => {
                e.stopPropagation();
                zoomScale = Math.min(zoomScale + 0.2, 5.0);
                applyTransform();
            });
        }
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', (e) => {
                e.stopPropagation();
                zoomScale = Math.max(zoomScale - 0.2, 0.5);
                applyTransform();
            });
        }
        if (btnRotateLeft) {
            btnRotateLeft.addEventListener('click', (e) => {
                e.stopPropagation();
                rotateDeg = (rotateDeg - 90) % 360;
                applyTransform();
            });
        }
        if (btnRotateRight) {
            btnRotateRight.addEventListener('click', (e) => {
                e.stopPropagation();
                rotateDeg = (rotateDeg + 90) % 360;
                applyTransform();
            });
        }
        if (btnReset) {
            btnReset.addEventListener('click', (e) => {
                e.stopPropagation();
                zoomScale = 1;
                translateX = 0;
                translateY = 0;
                rotateDeg = 0;
                applyTransform();
            });
        }

        // 1. 滚轮缩放事件
        modalImg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomIntensity = 0.1;
            const delta = e.deltaY < 0 ? 1 : -1;
            const newScale = Math.min(Math.max(zoomScale + delta * zoomIntensity * zoomScale, 0.5), 5.0);
            
            zoomScale = newScale;
            applyTransform();
        }, { passive: false });

        // 2. 双击快速切换缩放 (1.0 <-> 2.5)
        modalImg.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (zoomScale > 1.1) {
                zoomScale = 1;
                translateX = 0;
                translateY = 0;
            } else {
                zoomScale = 2.5;
                translateX = 0;
                translateY = 0;
            }
            modalImg.style.transition = 'transform 0.2s ease-out';
            applyTransform();
            setTimeout(() => {
                modalImg.style.transition = 'transform 0.15s ease-out';
            }, 200);
        });

        // 3. 鼠标拖动事件
        modalImg.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            modalImg.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            applyTransform();
        });

        const stopDrag = () => {
            if (isDragging) {
                isDragging = false;
                modalImg.style.transition = 'transform 0.15s ease-out';
            }
        };

        document.addEventListener('mouseup', stopDrag);
    }

    const inputImgPreview = document.getElementById('inputImagePreview');
    if (inputImgPreview) {
        inputImgPreview.addEventListener('click', () => {
            if (inputImgPreview.src) {
                showImagePreview(inputImgPreview.src);
            }
        });
    }
});
