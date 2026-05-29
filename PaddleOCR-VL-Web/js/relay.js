/**
 * 实现 /layout-parsing 结果到 /restructure-pages 接口的数据“接力”
 */
const DataRelay = {
    // 缓存上一步成功解析的页面数组
    lastParsedPages: null,

    /**
     * 当 /layout-parsing 请求成功时调用，将结果提取并缓存
     * @param {Object} responseData 
     */
    cacheFromParsingResponse(responseData) {
        if (!responseData || responseData.errorCode !== 0 || !responseData.result) {
            this.clearCache();
            return;
        }

        const results = responseData.result.layoutParsingResults;
        if (Array.isArray(results) && results.length > 0) {
            // 根据规范：pages 包含 prunedResult 和 markdownImages (即 markdown.images)
            this.lastParsedPages = results.map(item => ({
                prunedResult: item.prunedResult || {},
                markdownImages: item.markdown ? item.markdown.images : null
            }));

            // 显示接力状态提示栏
            this.updateAlertUI(true);
        } else {
            this.clearCache();
        }
    },

    /**
     * 将缓存的数据填入 /restructure-pages 接口的文本框中
     */
    applyRelayData() {
        const pagesTextarea = document.getElementById('pagesData');
        if (this.lastParsedPages && pagesTextarea) {
            // 格式化输出为 JSON 字符串
            pagesTextarea.value = JSON.stringify(this.lastParsedPages, null, 2);
            showToast('已自动从“版面解析”同步 ' + this.lastParsedPages.length + ' 页的缓存数据');
        }
    },

    /**
     * 清空缓存
     */
    clearCache() {
        this.lastParsedPages = null;
        this.updateAlertUI(false);
        const pagesTextarea = document.getElementById('pagesData');
        if (pagesTextarea) {
            pagesTextarea.value = '';
        }
    },

    /**
     * 更新接力提示 Alert 界面
     */
    updateAlertUI(hasData) {
        const alertEl = document.getElementById('relayStatusAlert');
        if (alertEl) {
            alertEl.style.display = hasData ? 'flex' : 'none';
        }
    },

    /**
     * 初始化事件监听
     */
    init() {
        const btnClear = document.getElementById('btnClearRelay');
        if (btnClear) {
            btnClear.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearCache();
                showToast('已清空缓存页面数据');
            });
        }
    }
};
