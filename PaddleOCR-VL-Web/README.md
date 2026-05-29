# PaddleOCR-VL API 测试预览客户端 (API Studio)

这是一个用于 **PaddleOCR-VL** 服务化 API 接口测试与结果预览的前端网页客户端。本项目采用纯原生 HTML/CSS/JS 开发，集成了现代玻璃拟态（Glassmorphism）视觉设计，提供直观、美观的参数配置与多维度结果可视化展示，帮助开发者快速进行版面解析和多页重构的 API 联调工作。

---

## 🌟 核心特性

- 🎨 **现代化 UI 设计**：采用高级渐变色和玻璃拟态（Glassmorphism）质感，支持一键切换**浅色 (Light) / 暗色 (Dark)** 双主题模式。
- 📤 **多功能文件上传**：支持通过点击、拖拽上传图片（PNG, JPG, JPEG）及 PDF 文档，并能够自动根据文件后缀识别文件类型。
- ⚙️ **完整的参数配置系统**：
  - **核心功能开关**：支持版面分析、文档方向分类、文本图像矫正、图表解析、印章识别、识别图片文字、格式化为 Markdown、美化 Markdown 等配置。
  - **高级推理参数**：版面几何形状模式（矩形/四边形/多边形/自动）、重叠框过滤方式、版面模型阈值、检测框扩张系数、采样温度、采样参数（Top-P/重复惩罚）、最大 Token 数、导出 Word (docx) 格式等。
- 🔄 **智能数据自动接力 (Data Relay)**：
  - 版面解析（`/layout-parsing`）请求成功后，会自动提取并缓存返回的页面数据结果（`prunedResult` 和 `images`）。
  - 当切换到多页重构（`/restructure-pages`）Tab 时，系统将自动就绪接力，并将数据自动填充进请求参数中，无需手动复制粘贴 JSON。
- 📊 **多维度结果渲染**：
  - **Markdown 预览**：集成 `marked.js` 并结合 `github-markdown-css` 样式，支持结果直接渲染预览，可一键下载生成的 Word (docx) 文件。
  - **可视化图**：直观展示服务端返回的版面分析定位检测图、关键元素图表等。
  - **输入图像**：展示用于识别的原始输入图像。
  - **JSON 结果**：美化输出完整 API 原始 JSON 响应，并支持一键复制。

---

## 📁 目录结构

```text
web/
├── css/
│   ├── main.css          # 全局基础样式、调色盘、布局与暗色模式变量
│   └── components.css    # 各种 UI 组件样式（卡片、开关、表单、按钮等）
├── js/
│   ├── api.js            # 封装 PaddleOCR-VL API 客户端请求与文件 Base64 转换
│   ├── params.js         # 负责两类接口的表单数据收集、验证与格式转换
│   ├── results.js        # 控制 API 响应状态、Markdown/图片/JSON 结果渲染与 Word 下载
│   ├── relay.js          # 实现版面解析到多页重构的“数据自动接力”机制
│   └── app.js            # 客户端事件绑定、交互逻辑及主题切换主入口
├── index.html            # 客户端单页应用主入口 HTML
└── README.md             # 本说明文档
```

---

## 🚀 快速启动

由于浏览器存在同源策略限制，当前端直接向部署在 Docker 或远程服务器的 PaddleOCR-VL API 发送请求时可能会触发 **CORS 跨域错误**。您可以通过以下两种方案之一来避免跨域限制：

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

1. **直接双击打开**：直接在浏览器中双击运行 `web/index.html`。
2. **使用 Node.js 静态服务器**（推荐，更稳定）：
   ```bash
   npx serve web
   # 或者全局安装后运行
   npm install -g serve
   serve web
   ```
3. **使用 VS Code Live Server 插件**：在 VS Code 中右键 `web/index.html`，选择 "Open with Live Server"。

### 第三步：配置与使用

1. 打开浏览器访问客户端页面。
2. 在右上角的 **API Base URL** 中输入本机的代理服务地址：
   ```text
   http://localhost:8081
   ```
3. 上传您的图片或 PDF 文档，或者填写远程文件 URL，并根据需要配置核心功能开关与高级参数。
4. 点击 **“发送 API 请求”**。
5. 请求成功后，右侧面板会自动显示当前页面的 Markdown 渲染结果、版面检测可视化图、以及原始 JSON 响应。

---

## 🛠️ 参数说明

有关 PaddleOCR-VL 服务接口返回的数据格式与参数含义的完整说明，请参考根目录下的文档：
👉 [PaddleOCR-VL服务化客户端调用API参考.md](./PaddleOCR-VL服务化客户端调用API参考.md)
