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

        // 重置结果面板 Tab 到默认的 识别文本
        const resultFormatTabs = document.getElementById('resultFormatTabs');
        if (resultFormatTabs) {
            Array.from(resultFormatTabs.children).forEach(btn => btn.classList.remove('active'));
            const defaultTab = resultFormatTabs.querySelector('[data-tab="text"]');
            if (defaultTab) defaultTab.classList.add('active');
        }
        ['viewText', 'viewImages', 'viewInput', 'viewJson'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', id === 'viewText');
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
        const resultsArray = responseData.result ? responseData.result.ocrResults : null;

        if (resultsArray && resultsArray.length > 0) {
            // 配置多页导航
            this.setupPageSelector(resultsArray.length);
            // 渲染当前页数据
            this.renderPageData(resultsArray[this.currentPageIndex]);
        } else {
            document.getElementById('pageSelector').style.display = 'none';
            document.getElementById('textResultsList').innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">无文本识别结果数据</div>';
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
        
        const safeMsg = escapeHtml(data.errorMsg || '未知错误');
        const safeCode = escapeHtml(String(data.errorCode));
        const errorHtml = `
            <div style="padding: 20px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); border-radius: 8px;">
                <h4 style="color: var(--error); margin-bottom: 8px; font-weight: 600;">API 调用返回错误 (errorCode: ${safeCode})</h4>
                <p style="color: var(--text-secondary); font-size: 13px;">${safeMsg}</p>
            </div>
        `;
        document.getElementById('textResultsList').innerHTML = errorHtml;
        document.getElementById('visualizeImagesGrid').innerHTML = '<div style="color: var(--text-muted); padding:20px; text-align: center;">无可视化图像</div>';
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
                Array.from(pageButtons.children).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentPageIndex = i;
                const resultsArray = this.currentResults.result.ocrResults;
                this.renderPageData(resultsArray[i]);
            });
            pageButtons.appendChild(btn);
        }
    },

    /**
     * 渲染单页结果数据 (识别文本、检测可视化、输入图像)
     * @param {Object} pageData - ocrResults 中的单个元素
     */
    renderPageData(pageData) {
        if (!pageData) return;

        // 1. 渲染文本结果列表
        const textResultsList = document.getElementById('textResultsList');
        textResultsList.innerHTML = '';

        let pruned = pageData.prunedResult;
        if (typeof pruned === 'string') {
            try {
                pruned = JSON.parse(pruned);
            } catch (err) {
                console.error("JSON 解析 prunedResult 失败:", err);
            }
        }

        const recTexts = pruned && pruned.rec_texts ? pruned.rec_texts : [];
        const recScores = pruned && pruned.rec_scores ? pruned.rec_scores : [];

        if (recTexts && recTexts.length > 0) {
            recTexts.forEach((text, idx) => {
                const item = document.createElement('div');
                item.className = 'text-result-item';
                
                const score = recScores[idx] !== undefined ? ` (置信度: ${(recScores[idx] * 100).toFixed(1)}%)` : '';
                item.textContent = `[${idx + 1}] ${text}${score}`;
                textResultsList.appendChild(item);
            });
        } else {
            textResultsList.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">此页未识别到文本</div>';
        }

        // 2. 检测可视化图渲染
        const visualizeGrid = document.getElementById('visualizeImagesGrid');
        visualizeGrid.innerHTML = '';

        if (pageData.ocrImage) {
            const card = document.createElement('div');
            card.className = 'visualize-card';
            
            const titleEl = document.createElement('div');
            titleEl.className = 'visualize-card-title';
            titleEl.textContent = `OCR 标注图`;
            
            const img = document.createElement('img');
            img.src = `data:image/jpeg;base64,${pageData.ocrImage}`;
            img.alt = 'OCR 标注图';
            img.addEventListener('click', () => showImagePreview(img.src));
            
            card.appendChild(titleEl);
            card.appendChild(img);
            visualizeGrid.appendChild(card);
        } else {
            visualizeGrid.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">接口未返回可视化图（请确认是否开启了 visualize 参数）</div>';
        }

        // 3. 输入图像渲染
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
     * 字符串最大显示长度，超出部分截断（Base64 图像字段可达数百万字符）
     */
    STR_TRUNCATE_LEN: 300,

    /**
     * 用 DOM 节点懒渲染方式创建 JSON 树节点
     * 折叠状态下子节点不创建 DOM，展开时才渲染，避免卡顿
     * @param {*}       value  - 当前节点值
     * @param {string|null} key - 对象 key（顶层为 null）
     * @param {boolean} isLast - 是否为父级最后一项（控制逗号）
     * @returns {HTMLElement}
     */
    createJsonNode(value, key, isLast) {
        const type = typeof value;
        const row = document.createElement('div');
        row.className = 'json-row';

        // 拼接 key 部分
        if (key !== null) {
            const keySpan = document.createElement('span');
            keySpan.className = 'json-key';
            keySpan.textContent = `"${key}"`;
            row.appendChild(keySpan);
            row.appendChild(document.createTextNode(': '));
        }

        if (value === null) {
            const s = document.createElement('span');
            s.className = 'json-null';
            s.textContent = 'null';
            row.appendChild(s);
        } else if (type === 'boolean') {
            const s = document.createElement('span');
            s.className = 'json-boolean';
            s.textContent = String(value);
            row.appendChild(s);
        } else if (type === 'number') {
            const s = document.createElement('span');
            s.className = 'json-number';
            s.textContent = String(value);
            row.appendChild(s);
        } else if (type === 'string') {
            const s = document.createElement('span');
            s.className = 'json-string';
            if (value.length > this.STR_TRUNCATE_LEN) {
                // 超长字符串（如 Base64 图像）截断显示
                s.textContent = `"${value.substring(0, this.STR_TRUNCATE_LEN)}`;
                const omit = document.createElement('span');
                omit.className = 'json-str-omitted';
                omit.textContent = ` …[已截断，共 ${value.length.toLocaleString()} 字符]`;
                s.appendChild(omit);
                s.appendChild(document.createTextNode('"'));
            } else {
                s.textContent = `"${value}"`;
            }
            row.appendChild(s);
        } else if (Array.isArray(value) || type === 'object') {
            // 复杂节点：懒渲染子内容
            this._buildComplexNode(row, value, Array.isArray(value));
        }

        // 末尾逗号
        if (!isLast) {
            const comma = document.createElement('span');
            comma.className = 'json-comma';
            comma.textContent = ',';
            row.appendChild(comma);
        }

        return row;
    },

    /**
     * 构建可折叠的复杂节点（对象或数组），子节点懒渲染
     * @param {HTMLElement} row   - 当前行元素
     * @param {Object|Array} value
     * @param {boolean} isArray
     */
    _buildComplexNode(row, value, isArray) {
        const openBr  = isArray ? '[' : '{';
        const closeBr = isArray ? ']' : '}';
        const keys    = isArray ? null : Object.keys(value);
        const count   = isArray ? value.length : keys.length;

        // 空对象/数组，直接渲染括号
        if (count === 0) {
            const s = document.createElement('span');
            s.className = 'json-bracket';
            s.textContent = openBr + closeBr;
            row.appendChild(s);
            return;
        }

        row.classList.add('json-complex');

        // 折叠箭头（插入到最前面）
        const toggle = document.createElement('span');
        toggle.className = 'json-toggle';
        toggle.textContent = '▼';
        row.prepend(toggle);

        // 左括号
        const openSpan = document.createElement('span');
        openSpan.className = 'json-bracket';
        openSpan.textContent = openBr;
        row.appendChild(openSpan);

        // 折叠时显示的省略摘要
        const ellipsis = document.createElement('span');
        ellipsis.className = 'json-ellipsis';
        ellipsis.textContent = isArray ? `${count} 项` : `${count} 属性`;
        row.appendChild(ellipsis);

        // 子内容容器（折叠时不可见）
        const container = document.createElement('div');
        container.className = 'json-collapsible';
        row.appendChild(container);

        // 右括号
        const closeSpan = document.createElement('span');
        closeSpan.className = 'json-bracket';
        closeSpan.textContent = closeBr;
        row.appendChild(closeSpan);

        // 懒渲染标记——展开时才填充子节点
        let childrenRendered = false;
        const renderChildren = () => {
            if (childrenRendered) return;
            childrenRendered = true;
            if (isArray) {
                value.forEach((item, i) => {
                    container.appendChild(this.createJsonNode(item, null, i === value.length - 1));
                });
            } else {
                keys.forEach((k, i) => {
                    container.appendChild(this.createJsonNode(value[k], k, i === keys.length - 1));
                });
            }
        };

        // 展开/折叠点击处理
        const handleToggle = () => {
            const willExpand = row.classList.contains('json-collapsed');
            row.classList.toggle('json-collapsed');
            if (willExpand) renderChildren(); // 展开时才渲染
        };
        toggle.addEventListener('click', handleToggle);
        ellipsis.addEventListener('click', handleToggle);

        // 初始渲染：展开第一层，其余折叠（平衡可见性与性能）
        renderChildren();
    },

    /**
     * 渲染 JSON 源码（DOM 懒加载版本）
     */
    renderJson(data) {
        const jsonCodeElement = document.getElementById('jsonRaw');

        // 清空旧内容（比 innerHTML = '' 更快）
        while (jsonCodeElement.firstChild) {
            jsonCodeElement.removeChild(jsonCodeElement.firstChild);
        }

        // 用 DocumentFragment 一次性挂载，减少重排次数
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.createJsonNode(data, null, true));
        jsonCodeElement.appendChild(fragment);

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

        modalImg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomIntensity = 0.1;
            const delta = e.deltaY < 0 ? 1 : -1;
            const newScale = Math.min(Math.max(zoomScale + delta * zoomIntensity * zoomScale, 0.5), 5.0);
            
            zoomScale = newScale;
            applyTransform();
        }, { passive: false });

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
