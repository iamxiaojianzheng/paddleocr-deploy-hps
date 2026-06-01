# PP-OCRv5 API 测试预览客户端 (API Studio)

这是一个用于 **PP-OCRv5** 服务化 API 接口测试与结果预览的前端网页客户端。本项目采用纯原生 HTML/CSS/JS 开发，集成了现代玻璃拟态（Glassmorphism）视觉设计，提供直观、美观的参数配置与多维度结果可视化展示，帮助开发者快速进行文本识别和图像检测的 API 联调工作。

---

## 🌟 核心特性

- 🎨 **现代化 UI 设计**：采用高级渐变色和玻璃拟态（Glassmorphism）质感，支持一键切换**浅色 (Light) / 暗色 (Dark)** 双主题模式。
- 📤 **多功能文件上传**：支持通过点击、拖拽上传图片（PNG, JPG, JPEG）及 PDF 文档，并能够自动根据文件后缀识别文件类型。
- ⚙️ **完整的参数配置系统**：
  - **核心功能开关**：支持文档方向分类（自动校正旋转）、文本图像矫正（扭曲/倾斜矫正）、文本行方向识别、以及可视化标注图返回配置。
  - **高级推理参数**：图片尺寸约束限制（textDetLimitSideLen）、约束类型（textDetLimitType: min/max）、检测像素阈值（textDetThresh）、检测框置信度阈值（textDetBoxThresh）、文本区域扩展系数（textDetUnclipRatio）、以及识别置信度最低阈值（textRecScoreThresh）等。
- 📊 **多维度结果渲染**：
  - **识别文本**：清晰展示经过置信度筛选的文本行识别结果，支持行定位序号与文本高亮显示。
  - **检测可视化**：直观展示服务端返回的标有文本检测框定位的结果标注图。
  - **输入图像**：展示用于识别的原始输入图像。
  - **JSON 结果**：美化输出完整 API 原始 JSON 响应，并支持一键复制与折叠。

---

## 📁 目录结构

```text
PP-OCRv5-Web/
├── css/
│   ├── main.css          # 全局基础样式、调色盘、布局与暗色模式变量
│   └── components.css    # 各种 UI 组件样式（卡片、开关、表单、按钮等）
├── js/
│   ├── api.js            # 封装 PP-OCRv5 API 客户端请求与文件 Base64 转换
│   ├── params.js         # 负责 /ocr 接口的表单数据收集、验证与格式转换
│   ├── results.js        # 控制 API 响应状态、文字列表/图片/JSON 结果渲染与放大
│   └── app.js            # 客户端事件绑定、交互逻辑及主题切换主入口
├── index.html            # 客户端单页应用主入口 HTML
├── cors_proxy.py         # 跨域中转代理服务器
└── README.md             # 本说明文档
```

---

## 🚀 快速启动

由于浏览器存在同源策略限制，当前端直接向部署在 Docker 或远程服务器的 PP-OCRv5 API 发送请求时可能会触发 **CORS 跨域错误**。您可以通过以下两种方案之一来避免跨域限制：

### 方案 A：使用配套的跨域代理服务

在项目根目录下，运行提供的 Python 代理服务器（该代理会自动加上跨域响应头）：

```bash
python cors_proxy.py
```

- 默认代理服务器会监听在：`http://localhost:8081`
- 代理会自动将请求转发至 Docker 容器服务：`http://localhost:8080`（可在 `cors_proxy.py` 中修改 `TARGET_HOST` 变量配置为实际部署的宿主机 IP）。
- 此时前端页面的 **API Base URL** 应填写：`http://localhost:8081`。

### 方案 B：禁用浏览器安全策略进行调试（支持前端直连 API）

如果不想运行 Python 代理服务，而希望浏览器能够直接向 `http://localhost:8080` 发送请求，可以启动一个临时禁用安全策略的 Chrome 浏览器实例：

在 Windows 命令行或“运行”窗口（Win + R）中执行以下命令：

```cmd
chrome.exe --disable-web-security --user-data-dir="C:/ChromeDev"
```

- 启动后，该 Chrome 实例将忽略跨域限制。
- 此时前端页面的 **API Base URL** 可直接填写实际的 API 地址（例如：`http://localhost:8080`）。

---

### 第二步：运行前端客户端

前端为纯静态网页，无需复杂的构建打包步骤。您可以通过以下几种方式运行：

1. **直接双击打开**：直接在浏览器中双击运行 `PP-OCRv5-Web/index.html`。
2. **使用 Node.js 静态服务器**（推荐，更稳定）：
   ```bash
   npx serve PP-OCRv5-Web
   # 或者全局安装后运行
   npm install -g serve
   serve PP-OCRv5-Web
   ```
3. **使用 VS Code Live Server 插件**：在 VS Code 中右键 `PP-OCRv5-Web/index.html`，选择 "Open with Live Server"。

### 第三步：配置与使用

1. 打开浏览器访问客户端页面。
2. 在右上角的 **API Base URL** 中输入本机的代理服务地址：
   ```text
   http://localhost:8081
   ```
3. 上传您的图片或 PDF 文档，或者填写远程文件 URL，并根据需要配置核心功能开关与高级参数。
4. 点击 **“发送 API 请求”**。
5. 请求成功后，右侧面板会自动显示当前页面的文本识别结果、检测定位标注图、以及原始 JSON 响应。
