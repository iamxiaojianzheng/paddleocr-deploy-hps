# Ocr2TextAgent 📄🤖

Ocr2TextAgent 是一个基于大语言模型（LLM）与 PaddleOCR 系列接口的智能文档分析 Agent。它可以接受用户上传的 PDF 或图片文档，结合用户的自然语言需求（Prompt），智能选择最合适的 OCR 引擎提取文本，并利用 LLM 进行信息抽取、分析或总结。

## ✨ 核心特性

- **🧠 智能工具调度**：集成 `PP-OCRv5`（高精度文本提取）、`PP-StructureV3`（表格/公式版面解析）和 `PaddleOCR-VL`（复杂版面多模态理解），大模型会根据任务自动选择最佳解析引擎。
- **🔌 模型生态兼容**：基于 LangChain 架构封装。只需修改环境变量中的 Base URL 和 API Key，即可无缝对接 OpenAI、DeepSeek、千问等在线大模型，或基于 Ollama、vLLM 部署的本地大模型。
- **🚀 高并发 REST API**：底层基于 FastAPI 构建，提供稳定的接口供其他业务系统集成。
- **🖥️ 可视化调试面板**：内置 Gradio 交互界面，便于快速测试文档分析效果、优化 Prompt。
- **⚡ 现代包管理**：使用 [uv](https://github.com/astral-sh/uv) 进行极速依赖和环境管理。

---

## 🛠️ 环境准备

1. 安装 Python 3.10 或更高版本。
2. 安装极速 Python 包管理工具 `uv`：
   ```bash
   # Windows (PowerShell)
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
3. 确保 [paddleocr-deploy-hps](https://github.com/iamxiaojianzheng/paddleocr-deploy-hps) 项目中的三种 OCR API 服务已经成功启动。

---

## 📦 安装与配置

1. **进入项目目录**

   ```bash
   cd Ocr2TextAgent
   ```

2. **配置环境变量**

   复制环境变量模板并进行修改：

   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，填入您的实际配置：
   - **`OPENAI_API_KEY`**: 您的模型 API Key（如果使用本地免密模型，请保留占位符）。
   - **`OPENAI_API_BASE`**: 大模型接口地址，例如 OpenAI、DeepSeek 的地址，或者是本地 `http://localhost:11434/v1` 等。
   - **`MODEL_NAME`**: 使用的模型名称，如 `gpt-4o`。
   - 检查 `PP_OCRV5_URL`、`PP_STRUCTUREV3_URL`、`PADDLEOCR_VL_URL` 是否与您实际部署的 OCR 服务端口一致。

3. **同步环境依赖**

   ```bash
   uv sync
   ```

---

## 🚀 启动与使用

### 启动服务

```bash
uv run main.py
```
服务默认运行在 `http://0.0.0.0:8000`。

### 1. Web 可视化调试 (Gradio)
服务启动后，打开浏览器访问：**[http://localhost:8000/](http://localhost:8000/)**
您可以直接在页面上上传图片或 PDF，输入需求（如：“帮我提取图中的表格并转为 Markdown”），即可直观地看到大模型的分析结果。

### 2. REST API 调用 (FastAPI)
如果您需要将该 Agent 作为一个后台服务集成到其他项目中，可通过 HTTP POST 请求调用：

**上传文件进行分析**：
```bash
curl -X POST "http://localhost:8000/api/analyze/file" \
  -F "prompt=请提取本文档的发票金额与日期" \
  -F "file=@/path/to/your/invoice.pdf"
```

**传入文件 URL 进行分析**：
```bash
curl -X POST "http://localhost:8000/api/analyze/url" \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "http://example.com/document.png",
    "prompt": "总结文章的核心观点"
  }'
```

> **提示**：您可以访问 `http://localhost:8000/docs` 查看完整的交互式 API 文档。

---

## 📂 目录结构说明

```text
Ocr2TextAgent/
├── pyproject.toml            # uv 项目依赖与配置
├── .env.example              # 环境变量模板
├── main.py                   # FastAPI与Gradio入口文件
├── core/                     
│   └── agent.py              # LangChain Agent 核心逻辑
├── tools/                    
│   ├── base.py               # OCR调用基类 (处理Base64转换等)
│   ├── pp_ocrv5.py           # PP-OCRv5 工具封装
│   ├── pp_structurev3.py     # PP-StructureV3 工具封装
│   └── paddleocr_vl.py       # PaddleOCR-VL 工具封装
└── utils/                    
    └── file_utils.py         # 通用文件操作辅助类
```
