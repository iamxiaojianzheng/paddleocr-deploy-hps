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
| `file`                      | `string`                               | 服务器可访问的图像文件（含 TIFF，多页时按页处理）或 PDF 文件的 URL，或上述类型文件内容的 Base64 编码结果。 | 是       |
| `fileType`                  | `integer`｜`null`                      | 文件类型。`0` 表示 PDF 文件，`1` 表示图像文件（含 TIFF）。若请求体无此属性，则将根据URL推断文件类型。 | 否       |
| `useDocOrientationClassify` | `boolean` | `null`                     | 请参阅产线对象中 `predict` 方法的 `use_doc_orientation_classify` 参数相关说明。 | 否       |
| `useDocUnwarping`           | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `use_doc_unwarping` 参数相关说明。 | 否       |
| `useLayoutDetection`        | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `use_layout_detection` 参数相关说明。 | 否       |
| `useChartRecognition`       | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `use_chart_recognition` 参数相关说明。 | 否       |
| `useSealRecognition`        | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `use_seal_recognition` 参数相关说明。 | 否       |
| `useOcrForImageBlock`       | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `use_ocr_for_image_block` 参数相关说明。 | 否       |
| `layoutThreshold`           | `number` | `object` | `null`           | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `layout_threshold` 参数相关说明。 | 否       |
| `layoutNms`                 | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `layout_nms` 参数相关说明。 | 否       |
| `layoutUnclipRatio`         | `number` | `array` | `object` | `null` | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `layout_unclip_ratio` 参数相关说明。 | 否       |
| `layoutMergeBboxesMode`     | `string` | `object` | `null`           | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `layout_merge_bboxes_mode` 参数相关说明。 | 否       |
| `layoutShapeMode`           | `string`                               | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `layout_shape_mode` 参数相关说明。 | 否       |
| `promptLabel`               | `string` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `prompt_label` 参数相关说明。 | 否       |
| `formatBlockContent`        | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `format_block_content` 参数相关说明。 | 否       |
| `repetitionPenalty`         | `number` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `repetition_penalty` 参数相关说明。 | 否       |
| `temperature`               | `number` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `temperature` 参数相关说明。 | 否       |
| `topP`                      | `number` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `top_p` 参数相关说明。 | 否       |
| `minPixels`                 | `number` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `min_pixels` 参数相关说明。 | 否       |
| `maxPixels`                 | `number` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `max_pixels` 参数相关说明。 | 否       |
| `maxNewTokens`              | `number` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `max_new_tokens` 参数相关说明。 | 否       |
| `mergeLayoutBlocks`         | `boolean` | `null`                     | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `merge_layout_blocks` 参数相关说明。 | 否       |
| `markdownIgnoreLabels`      | `array` | `null`                       | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `markdown_ignore_labels` 参数相关说明。 | 否       |
| `vlmExtraArgs`              | `object` | `null`                      | 请参阅PaddleOCR-VL对象中 `predict` 方法的 `vlm_extra_args` 参数相关说明。 | 否       |
| `prettifyMarkdown`          | `boolean`                              | 是否输出美化后的 Markdown 文本。默认为 `true`。              | 否       |
| `showFormulaNumber`         | `boolean`                              | 输出的 Markdown 文本中是否包含公式编号。默认为 `false`。     | 否       |
| `restructurePages`          | `boolean`                              | 是否重构多页结果。默认为 `false`。                           | 否       |
| `mergeTables`               | `boolean`                              | 请参阅PaddleOCR-VL对象中 `restructure_pages` 方法的 `merge_tables` 参数相关说明。仅当`restructurePages`为`true`时生效。 | 否       |
| `relevelTitles`             | `boolean`                              | 请参阅PaddleOCR-VL对象中 `restructure_pages` 方法的 `relevel_titles` 参数相关说明。仅当`restructurePages`为`true`时生效。 | 否       |
| `returnMarkdownImages`      | `boolean`                              | 是否在响应中返回 Markdown 中引用的图片。默认为 `true`；设为 `false` 时 `markdown.images` 为 `null` 或不出现，且服务端跳过图片编码 / URL 上传。 | 否       |
| `outputFormats`             | `array` | `null`                       | 可选。需要额外返回的文档格式列表。默认不返回任何附加格式。当前仅支持 `"docx"`。 | 否       |
| `visualize`                 | `boolean` | `null`                     | 是否返回可视化结果图以及处理过程中的中间图像等。传入 `true`：返回图像。传入 `false`：不返回图像。若请求体中未提供该参数或传入 `null`：遵循配置文件`Serving.visualize` 的设置。 例如，在配置文件中添加如下字段： `Serving:  visualize: False `将默认不返回图像，通过请求体中的`visualize`参数可以覆盖默认行为。如果请求体和配置文件中均未设置（或请求体传入`null`、配置文件中未设置），则默认返回图像。 |          |
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