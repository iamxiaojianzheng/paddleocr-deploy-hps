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
        const switches = [
            'useTableRecognition',
            'useFormulaRecognition',
            'useRegionDetection',
            'useDocOrientationClassify',
            'useDocUnwarping',
            'useTextlineOrientation',
            'useSealRecognition',
            'useChartRecognition',
            'useWiredTableCellsTransToHtml',
            'useWirelessTableCellsTransToHtml',
            'useTableOrientationClassify',
            'useOcrResultsWithTableCells',
            'useE2eWiredTableRecModel',
            'useE2eWirelessTableRecModel',
            'layoutNms'
        ];
        
        switches.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                payload[key] = element.checked;
            }
        });

        // 4. 下拉选择框参数
        const selectFields = [
            'layoutMergeBboxesMode',
            'textDetLimitType',
            'sealDetLimitType'
        ];

        selectFields.forEach(id => {
            const val = document.getElementById(id).value;
            if (val !== '') {
                payload[id] = val;
            }
        });

        // 5. 单独处理 visualize 三态：true / false / 不传（跟随服务端默认）
        const visualizeVal = document.getElementById('visualize').value;
        if (visualizeVal === 'true') payload.visualize = true;
        else if (visualizeVal === 'false') payload.visualize = false;

        // 6. 数字参数解析辅助 (空字符串时不传)
        const parseNumberField = (id) => {
            const val = document.getElementById(id).value.trim();
            return val !== '' ? parseFloat(val) : null;
        };

        const numFields = [
            'layoutThreshold',
            'layoutUnclipRatio',
            'textDetLimitSideLen',
            'textDetThresh',
            'textDetBoxThresh',
            'textDetUnclipRatio',
            'textRecScoreThresh',
            'sealDetLimitSideLen',
            'sealDetThresh',
            'sealDetBoxThresh',
            'sealDetUnclipRatio',
            'sealRecScoreThresh'
        ];

        numFields.forEach(id => {
            const val = parseNumberField(id);
            if (val !== null) {
                // 如果是需要整型的参数，做转换
                if (id === 'textDetLimitSideLen' || id === 'sealDetLimitSideLen') {
                    payload[id] = parseInt(val, 10);
                } else {
                    payload[id] = val;
                }
            }
        });

        return payload;
    }
};
