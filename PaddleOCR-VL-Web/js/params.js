/**
 * 处理表单参数收集与格式转换
 */
const ParamCollector = {
    // 保存当前选中的 Base64 文件数据
    currentFileBase64: null,
    currentFileName: '',
    
    /**
     * 收集 /layout-parsing 接口的请求体
     * @returns {Object} 请求体 JSON
     */
    collectLayoutParsingParams() {
        const payload = {};

        // 1. 文件处理 (file)
        const fileUrl = document.getElementById('fileUrl').value.trim();
        if (this.currentFileBase64) {
            payload.file = this.currentFileBase64;
        } else if (fileUrl) {
            payload.file = fileUrl;
        } else {
            throw new Error('请上传文件或提供文件 URL');
        }

        // 2. 文件类型 (fileType)
        const fileTypeVal = document.getElementById('fileType').value;
        if (fileTypeVal !== '') {
            payload.fileType = parseInt(fileTypeVal, 10);
        }

        // 3. 核心开关
        // 特殊处理：有些字段未选则不传，或传 null/boolean。
        // 根据文档：设置为 null 表示使用默认，因此如果未修改或为默认，我们可选择不传或允许覆盖。
        // 这里我们主要根据复选框状态直接搜集，没有勾选的在需要默认的地方传 null 或不传。
        const switches = [
            'useDocOrientationClassify',
            'useDocUnwarping',
            'useLayoutDetection',
            'useChartRecognition',
            'useSealRecognition',
            'useOcrForImageBlock',
            'formatBlockContent',
            'prettifyMarkdown',
            'restructurePages',
            'mergeTables',
            'relevelTitles',
            'layoutNms',
            'showFormulaNumber',
            'mergeLayoutBlocks',
            'returnMarkdownImages'
            // visualize 三态处理，不在这里
        ];

        switches.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                // 统一显式传递 true 或 false
                payload[key] = element.checked;
            }
        });

        // 4. 高级参数 (如果为空则不传)
        // 单独处理 visualize 三态：true / false / 不传（跟随服务端默认）
        const visualizeVal = document.getElementById('visualize').value;
        if (visualizeVal === 'true') payload.visualize = true;
        else if (visualizeVal === 'false') payload.visualize = false;
        // visualizeVal === '' 时不传该字段
        const layoutShapeMode = document.getElementById('layoutShapeMode').value;
        if (layoutShapeMode) payload.layoutShapeMode = layoutShapeMode;

        const layoutMergeBboxesMode = document.getElementById('layoutMergeBboxesMode').value;
        if (layoutMergeBboxesMode) payload.layoutMergeBboxesMode = layoutMergeBboxesMode;

        const promptLabel = document.getElementById('promptLabel').value.trim();
        if (promptLabel) payload.promptLabel = promptLabel;

        // 数字参数解析辅助
        const parseNumberField = (id) => {
            const val = document.getElementById(id).value.trim();
            return val !== '' ? parseFloat(val) : null;
        };

        const temp = parseNumberField('temperature');
        if (temp !== null) payload.temperature = temp;

        const topP = parseNumberField('topP');
        if (topP !== null) payload.topP = topP;

        const repPenalty = parseNumberField('repetitionPenalty');
        if (repPenalty !== null) payload.repetitionPenalty = repPenalty;

        const maxNew = parseNumberField('maxNewTokens');
        if (maxNew !== null) payload.maxNewTokens = parseInt(maxNew, 10);

        const minPixels = parseNumberField('minPixels');
        if (minPixels !== null) payload.minPixels = parseInt(minPixels, 10);

        const maxPixels = parseNumberField('maxPixels');
        if (maxPixels !== null) payload.maxPixels = parseInt(maxPixels, 10);

        // 处理复杂类型：layoutThreshold, layoutUnclipRatio
        const thresholdVal = document.getElementById('layoutThreshold').value.trim();
        if (thresholdVal) {
            payload.layoutThreshold = this.tryParseJsonOrNumber(thresholdVal);
        }

        const unclipVal = document.getElementById('layoutUnclipRatio').value.trim();
        if (unclipVal) {
            payload.layoutUnclipRatio = this.tryParseJsonOrNumber(unclipVal);
        }

        // 处理导出格式
        const outputDocx = document.getElementById('outputFormatDocx').checked;
        if (outputDocx) {
            payload.outputFormats = ['docx'];
        }

        // 处理 vlmExtraArgs
        const vlmArgsVal = document.getElementById('vlmExtraArgs').value.trim();
        if (vlmArgsVal) {
            try {
                payload.vlmExtraArgs = JSON.parse(vlmArgsVal);
            } catch (err) {
                throw new Error('VLM 额外参数必须是合法的 JSON 对象格式');
            }
        }

        // 处理 markdownIgnoreLabels
        const ignoreLabelsVal = document.getElementById('markdownIgnoreLabels').value.trim();
        if (ignoreLabelsVal) {
            try {
                const parsed = JSON.parse(ignoreLabelsVal);
                if (Array.isArray(parsed)) {
                    payload.markdownIgnoreLabels = parsed;
                } else {
                    throw new Error('过滤标签(markdownIgnoreLabels)必须是合法的 JSON 数组');
                }
            } catch (err) {
                throw new Error('过滤标签(markdownIgnoreLabels)必须是合法的 JSON 数组，例如: ["header", "footer"]');
            }
        }

        return payload;
    },

    /**
     * 收集 /restructure-pages 接口的请求体
     * @returns {Object}
     */
    collectRestructurePagesParams() {
        const payload = {};

        // 1. pages 页面数组参数 (必填)
        const pagesJson = document.getElementById('pagesData').value.trim();
        if (!pagesJson) {
            throw new Error('“页面数据(pages)” 不能为空，请提供合法的 JSON 数组');
        }

        try {
            payload.pages = JSON.parse(pagesJson);
            if (!Array.isArray(payload.pages)) {
                throw new Error('“页面数据(pages)” 必须是一个 JSON 数组');
            }
        } catch (err) {
            throw new Error(`页面数据 JSON 解析失败: ${err.message}`);
        }

        // 2. 其它重构开关
        const switches = [
            { id: 'restructureMergeTables', key: 'mergeTables' },
            { id: 'restructureRelevelTitles', key: 'relevelTitles' },
            { id: 'concatenatePages', key: 'concatenatePages' },
            { id: 'restructurePrettify', key: 'prettifyMarkdown' },
            { id: 'restructureFormulaNum', key: 'showFormulaNumber' }
        ];

        switches.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                // 统一显式传递 true 或 false
                payload[item.key] = el.checked;
            }
        });

        // 导出格式
        const outputDocx = document.getElementById('restructureOutputDocx').checked;
        if (outputDocx) {
            payload.outputFormats = ['docx'];
        }

        return payload;
    },

    /**
     * 尝试将字符串解析为 JSON，如果失败则返回原始数值或字符串
     * 用于处理如 0.5 或 {0: 0.1} 的输入
     */
    tryParseJsonOrNumber(str) {
        if (!str) return null;
        
        // 尝试解析为纯数字
        const num = Number(str);
        if (!isNaN(num)) return num;

        // 尝试解析为 JSON
        try {
            // 支持类似于 python 字典的 {0: 0.1}
            // 标准 JSON 要求 key 为双引号，自动转换一下简易格式
            let formattedStr = str
                .replace(/'/g, '"') // 单引号转双引号
                .replace(/([{,]\s*)(\d+)(\s*:)/g, '$1"$2"$3'); // 无引号的数字 key 转双引号
            return JSON.parse(formattedStr);
        } catch (e) {
            // 解析失败则返回原始字符串
            return str;
        }
    }
};
