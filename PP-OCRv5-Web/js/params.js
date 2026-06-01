/**
 * 处理 PP-OCRv5 表单参数收集与格式转换
 */
const ParamCollector = {
    // 保存当前选中的 Base64 文件数据
    currentFileBase64: null,
    currentFileName: '',
    
    /**
     * 收集 /ocr 接口的请求体
     * @returns {Object} 请求体 JSON
     */
    collectOcrParams() {
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

        // 3. 核心功能开关 (选填参数，为保持简洁，勾选时传 true，未勾选不传让后端采用默认值，除 visualize 之外)
        const switches = [
            'useDocOrientationClassify',
            'useDocUnwarping',
            'useTextlineOrientation'
        ];

        switches.forEach(key => {
            const element = document.getElementById(key);
            if (element && element.checked) {
                payload[key] = true;
            }
        });

        // visualize 默认为 checked (true)。我们如果未选中则传 false。
        const visualizeEl = document.getElementById('visualize');
        if (visualizeEl) {
            payload.visualize = visualizeEl.checked;
        }

        // 4. 高级参数 (如果为空或合法输入则进行解析)
        const parseNumberField = (id, isInt = false) => {
            const val = document.getElementById(id).value.trim();
            if (val === '') return null;
            const num = isInt ? parseInt(val, 10) : parseFloat(val);
            if (isNaN(num)) {
                throw new Error(`${id} 必须是一个合法的数字`);
            }
            return num;
        };

        const textDetLimitSideLen = parseNumberField('textDetLimitSideLen', true);
        if (textDetLimitSideLen !== null) payload.textDetLimitSideLen = textDetLimitSideLen;

        const textDetLimitType = document.getElementById('textDetLimitType').value;
        if (textDetLimitType) payload.textDetLimitType = textDetLimitType;

        const textDetThresh = parseNumberField('textDetThresh');
        if (textDetThresh !== null) payload.textDetThresh = textDetThresh;

        const textDetBoxThresh = parseNumberField('textDetBoxThresh');
        if (textDetBoxThresh !== null) payload.textDetBoxThresh = textDetBoxThresh;

        const textDetUnclipRatio = parseNumberField('textDetUnclipRatio');
        if (textDetUnclipRatio !== null) payload.textDetUnclipRatio = textDetUnclipRatio;

        const textRecScoreThresh = parseNumberField('textRecScoreThresh');
        if (textRecScoreThresh !== null) payload.textRecScoreThresh = textRecScoreThresh;

        return payload;
    }
};
