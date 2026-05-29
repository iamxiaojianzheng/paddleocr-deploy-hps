对于服务提供的主要操作：

- HTTP请求方法为POST。
- 请求体和响应体均为JSON数据（JSON对象）。
- 当请求处理成功时，响应状态码为`200`，响应体的属性如下：

| 名称        | 类型      | 含义                          |
| :---------- | :-------- | :---------------------------- |
| `logId`     | `string`  | 请求的UUID。                  |
| `errorCode` | `integer` | 错误码。固定为`0`。           |
| `errorMsg`  | `string`  | 错误说明。固定为`"Success"`。 |
| `result`    | `object`  | 操作结果。                    |

- 当请求处理未成功时，响应体的属性如下：

| 名称        | 类型      | 含义                       |
| :---------- | :-------- | :------------------------- |
| `logId`     | `string`  | 请求的UUID。               |
| `errorCode` | `integer` | 错误码。与响应状态码相同。 |
| `errorMsg`  | `string`  | 错误说明。                 |

## 服务提供的主要操作如下

### 进行版面解析

```http
POST /layout-parsing
```

#### 请求体的属性如下

| 名称                        | 类型                                   | 含义                                                         | 是否必填 |
| :-------------------------- | :------------------------------------- | :----------------------------------------------------------- | :------- |
| `file`                      | `string`                               | 服务器可访问的图像文件或PDF文件的URL，或上述类型文件内容的Base64编码结果。 | 是       |
| `fileType`                  | `integer`、`null`                      | 文件类型。`0`表示PDF文件，`1`表示图像文件。若请求体无此属性，则将根据URL推断文件类型。 | 否       |
| `useDocOrientationClassify` | `boolean` 、`null` | **含义：**是否在推理时使用文档方向分类模块。<br/>**说明：** 设置为`None`表示使用实例化参数，否则该参数优先级更高。 | 否 |
| `useDocUnwarping`           | `boolean` 、`null` | **含义：**是否加载并使用文本图像矫正模块。<br/>**说明：**如果不设置，将使用初始化的默认值，默认初始化为`False`。 | 否 |
| `useLayoutDetection`        | `boolean` 、`null` | **含义：**是否加载并使用版面分析模块。<br/>**说明：**如果不设置，将使用初始化的默认值，默认初始化为`True`。 | 否 |
| `useChartRecognition`       | `boolean` 、`null` | **含义：**是否使用图表解析功能。<br/>**说明：**如果不设置，将使用初始化的默认值，默认初始化为`False`。 | 否 |
| `useSealRecognition`        | `boolean` 、`null` | **含义：**是否使用印章识别功能。<br/>**说明：**如果不设置，将使用初始化的默认值，默认初始化为`False`。 | 否 |
| `useOcrForImageBlock`       | `boolean` 、`null` | **含义：**是否对图片中的文字进行识别。<br/>**说明：**如果不设置，将使用初始化的默认值，默认初始化为`False`。 | 否 |
| `layoutThreshold`           | `number`、`object` 、`null` | **含义：**版面模型得分阈值。 <br />**说明：**<br />**float**：`0-1` 之间的任意浮点数； <br />**dict**： `{0:0.1}` key为类别ID，value为该类别的阈值； <br />**None**：如果设置为`None`，将使用初始化的默认值。 | 否 |
| `layoutNms`                 | `boolean` 、`null` | **含义：**参数含义与实例化参数基本相同。<br/>**说明：** 设置为`None`表示使用实例化参数，否则该参数优先级更高。<br />**float**：`0-1` 之间的任意浮点数； <br />**dict**： `{0:0.1}` key为类别ID，value为该类别的阈值； <br />**None**：如果设置为`None`，将使用初始化的默认值。 | 否 |
| `layoutUnclipRatio`         | `number`、`array`、`object` | **含义：**版面区域检测模型检测框的扩张系数。<br />**说明：**<br />**float**：任意大于 `0` 浮点数； <br />**Tuple[float,float]**：在横纵两个方向各自的扩张系数； <br />**dict**，dict的key为**int**类型，代表`cls_id`, value为**tuple**类型，如`{0: (1.1, 2.0)}`，表示将模型输出的第0类别检测框中心不变，宽度扩张1.1倍，高度扩张2.0倍；<br /> **None**：如果设置为`None`，将使用初始化的默认值。 | 否 |
| `layoutMergeBboxesMode`     | `string`、`object` 、`null` | **含义：**版面区域检测的重叠框过滤方式。<br/>**说明：**<br />**str**：`large`，`small`，`union`，分别表示重叠框过滤时选择保留大框，小框还是同时保留； <br />**dict**： dict的key为**int**类型，代表`cls_id`，value为**str**类型，如`{0: "large", 2: "small"}`，表示对第0类别检测框使用large模式，对第2类别检测框使用small模式； <br />**None**：如果设置为`None`，将使用初始化的默认值。 | 否 |
| `layoutShapeMode`           | `string`                               | **含义：**用于指定版面分析结果的几何形状表示模式。该参数决定了检测区域（如文本块、图片、表格等）边界的计算方式及展示形态。 <br />**说明：**取值说明：<br />**rect (矩形)**: 输出水平正向的边界框（包含 x1, y1, x2, y2）。适用于标准的水平排版版面。<br />**quad (四边形)**: 输出由四个顶点组成的任意四边形。适用于存在倾斜、透视变形的区域。<br />**poly (多边形)**: 输出由多个坐标点组成的闭合轮廓。适用于形状不规则或具有弧度的版面元素，精度最高。<br />**auto (自动)**: 系统根据检测目标的复杂程度和置信度，自动选择最合适的形状表达方式。 | 否       |
| `promptLabel`               | `string` 、`null`                      | **含义：**VL模型的 prompt 类型设置。<br/>**说明：**当且仅当 `use_layout_detection=False` 时生效。 |否|
| `formatBlockContent`        | `boolean` 、`null`                     | **含义：**控制是否将 `block_content` 中的内容格式化为Markdown格式。<br/>**说明：**如果不设置，将使用初始化的默认值，默认初始化为`False`。 |否|
| `repetitionPenalty`         | `number` 、`null`                      | **含义：**VL模型采样使用的重复惩罚参数。                     |否|
| `temperature`               | `number` 、`null`                      | **含义：**VL模型采样使用的温度参数。                         |否|
| `topP`                      | `number` 、`null`                      | **含义：**VL模型采样使用的top-p参数。                        |否|
| `minPixels`                 | `number` 、`null`                      | **含义：**VL模型预处理图像时允许的最小像素数。               |否|
| `maxPixels`                 | `number` 、`null`                      | **含义：**VL模型预处理图像时允许的最大像素数。               |否|
| `maxNewTokens`              | `number` 、`null`                      | **含义：**VL模型生成的最大token数。                          |否|
| `mergeLayoutBlocks`         | `boolean` 、`null`                     | **含义：**控制是否对跨栏或上下交错分栏的版面分析框进行合并。 |否|
| `markdownIgnoreLabels`      | `array` 、`null`                       | **含义：**需要在Markdown中忽略的版面标签。                   | 否       |
| `vlmExtraArgs`              | `object` 、`null` | **含义：**VLM额外配置参数。 **说明：**目前支持的自定义参数如下：<br />`ocr_min_pixels`：OCR 最小分辨率 <br />`ocr_max_pixels`：OCR 最大分辨率<br />`table_min_pixels`：表格最小分辨率<br /> `table_max_pixels`：表格最大分辨率<br /> `chart_min_pixels`：图表最小分辨率<br /> `chart_max_pixels`：图表最大分辨率<br /> `formula_min_pixels`：公式最小分辨率<br /> `formula_max_pixels`：公式最大分辨率<br /> `seal_min_pixels`：印章最小分辨率<br /> `seal_max_pixels`：印章最大分辨率 | 否 |
| `prettifyMarkdown`          | `boolean`                              | 是否输出美化后的 Markdown 文本。默认为 `true`。              | 否       |
| `showFormulaNumber`         | `boolean`                              | 输出的 Markdown 文本中是否包含公式编号。默认为 `false`。     | 否       |
| `restructurePages`          | `boolean`                              | 是否重构多页结果。默认为 `false`。                           | 否       |
| `mergeTables`               | `boolean`                              | **含义：**控制是否进行跨页表格合并。仅当`restructurePages`为`true`时生效。 | 否       |
| `relevelTitles`             | `boolean`                              | **含义：**控制是否进行多级标题分级仅当`restructurePages`为`true`时生效。 | 否       |
| `outputFormats`             | `array` 、`null` | 可选。需要额外返回的文档格式列表。默认不返回任何附加格式。当前仅支持 `"docx"`。 | 否 |
| `visualize`                 | `boolean` 、`null` | 是否返回可视化结果图以及处理过程中的中间图像等。传入 `true`：返回图像。传入 `false`：不返回图像。若请求体中未提供该参数或传入 `null`：遵循配置文件`Serving.visualize` 的设置。 例如，在配置文件中添加如下字段： `Serving:  visualize: False `将默认不返回图像，通过请求体中的`visualize`参数可以覆盖默认行为。如果请求体和配置文件中均未设置（或请求体传入`null`、配置文件中未设置），则默认返回图像。 | 否 |

- 请求处理成功时，响应体的`result`具有如下属性：

| 名称                   | 类型     | 含义                                                         |
| :--------------------- | :------- | :----------------------------------------------------------- |
| `layoutParsingResults` | `array`  | 版面解析结果。数组长度为1（对于图像输入）或实际处理的文档页数（对于PDF输入）。对于PDF输入，数组中的每个元素依次表示PDF文件中实际处理的每一页的结果。 |
| `dataInfo`             | `object` | 输入数据信息。                                               |

`layoutParsingResults`中的每个元素为一个`object`，具有如下属性：

| 名称           | 类型              | 含义                                                         |
| :------------- | :---------------- | :----------------------------------------------------------- |
| `prunedResult` | `object`          | 对象的 `predict` 方法生成结果的 JSON 表示中 `res` 字段的简化版本，其中去除了 `input_path` 和 `page_index` 字段。 |
| `markdown`     | `object`          | Markdown结果。                                               |
| `outputImages` | `object` 、`null` | 参见预测结果的 `img` 属性说明。图像为JPEG格式，使用Base64编码。 |
| `inputImage`   | `string` 、`null` | 输入图像。图像为JPEG格式，使用Base64编码。                   |
| `exports`      | `object` 、`null` | 可选的附加导出结果。仅当请求体中包含 `outputFormats` 且列出相应格式时出现。例如 `{"docx": {"content": "..."}}`，其中 `content` 为文件内容的Base64编码。 |

`markdown`为一个`object`，具有如下属性：

| 名称     | 类型     | 含义                                           |
| :------- | :------- | :--------------------------------------------- |
| `text`   | `string` | Markdown文本。                                 |
| `images` | `object` | Markdown图片相对路径和Base64编码图像的键值对。 |

- **`restructurePages`**

### 重构多页结果

```http
POST /restructure-pages
```

#### 请求体的属性如下

| 名称                | 类型             | 含义                                                         | 是否必填 |
| :------------------ | :--------------- | :----------------------------------------------------------- | :------- |
| `pages`             | `array`          | 页面数组。                                                   | 是       |
| `mergeTables`       | `boolean`        | **含义：**控制是否进行跨页表格合并。仅当`restructurePages`为`true`时生效。 | 否       |
| `relevelTitles`     | `boolean`        | **含义：**控制是否进行多级标题分级仅当`restructurePages`为`true`时生效。 | 否       |
| `concatenatePages`  | `boolean`        | **含义：**控制是否拼接多页结果为一页。                       | 否       |
| `prettifyMarkdown`  | `boolean`        | 是否输出美化后的 Markdown 文本。默认为 `true`。              | 否       |
| `showFormulaNumber` | `boolean`        | 输出的 Markdown 文本中是否包含公式编号。默认为 `false`。     | 否       |
| `outputFormats`     | `array` 、`null` | 可选。附加导出格式，含义与 `infer` 中的 `outputFormats` 相同。当前仅支持 `"docx"`。 | 否       |

`pages`中的每个元素为一个`object`，具有如下属性：

| 名称             | 类型            | 含义                                                |
| :--------------- | :-------------- | :-------------------------------------------------- |
| `prunedResult`   | `object`        | 对应`infer`操作返回的`prunedResult`对象。           |
| `markdownImages` | `object`、`null` |对应`infer`操作返回的`markdown`对象的`images`属性。 |

- 请求处理成功时，响应体的`result`具有如下属性：

| 名称                   | 类型    | 含义                                                         |
| :--------------------- | :------ | :----------------------------------------------------------- |
| `layoutParsingResults` | `array` | 重构后的版面解析结果。其中每个元素包含的字段请参见对 `infer` 操作返回结果的说明（不含可视化结果图和中间图像）。 |