import os
import shutil
import tempfile
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import gradio as gr

from core.agent import process_document

# --- FastAPI 接口 ---
app = FastAPI(
    title="Ocr2TextAgent",
    description="基于大语言模型与 OCR 接口的文档分析智能体",
    version="1.0.0"
)

# 跨域设置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    file_url: str = ""
    prompt: str

@app.post("/api/analyze/url")
async def analyze_url(request: AnalyzeRequest):
    """
    通过 URL 提供文件进行分析
    """
    if not request.file_url:
        raise HTTPException(status_code=400, detail="file_url 不能为空")
    
    result = process_document(request.file_url, request.prompt)
    return {"status": "success", "data": result}

@app.post("/api/analyze/file")
async def analyze_file(
    prompt: str = Form(...),
    file: UploadFile = File(...)
):
    """
    上传本地文件进行分析
    """
    try:
        # 将上传的文件保存到临时目录
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        result = process_document(tmp_path, prompt)
        
        # 清理临时文件
        os.remove(tmp_path)
        
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Gradio 可视化调试界面 ---
def gradio_interface(file_obj, url_input, prompt_input):
    if not prompt_input:
        return "请输入您的需求 (Prompt)。"
    
    if file_obj is not None:
        # file_obj 包含本地临时路径
        return process_document(file_obj, prompt_input)
    elif url_input:
        return process_document(url_input, prompt_input)
    else:
        return "请上传文件或提供文件 URL。"

def set_loading():
    return gr.Button(value="⏳ 正在分析，请稍候...", interactive=False)

def restore_button():
    return gr.Button(value="🚀 开始智能分析", interactive=True)


with gr.Blocks(title="Ocr2TextAgent 调试界面", theme=gr.themes.Soft()) as demo:
    
    # 顶部横幅：使用 HTML 让标题和副标题更紧凑、更有层次感
    gr.HTML("""
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 2.5rem; margin-bottom: 5px;">📄 Ocr2TextAgent 智能文档分析</h1>
            <p style="color: #666; font-size: 1.1rem;">自动选择最佳 OCR 接口，结合大模型精准提取与深度分析</p>
        </div>
    """)
    
    with gr.Row():
        # 左侧输入面板
        with gr.Column(scale=1):
            gr.Markdown("### 📥 输入源 (二选一)")
            file_in = gr.File(
                label="上传本地文件", 
                file_types=[".pdf", ".png", ".jpg", ".jpeg"],
                file_count="single"
            )
            url_in = gr.Textbox(
                label="或输入远程文件 URL", 
                placeholder="https://example.com",
                max_lines=1
            )
            
            gr.HTML("<div style='height: 10px;'></div>")  # 添加微小的垂直间距
            
            gr.Markdown("### ⚙️ 分析需求")
            prompt_in = gr.Textbox(
                label="提示词 (Prompt)", 
                placeholder="例如：提取发票中的表格，并用 Markdown 格式输出总计金额...", 
                lines=4,
                show_label=False # 隐藏原生标签，使用上面的 Markdown 作为标题
            )
            
            submit_btn = gr.Button("🚀 开始智能分析", variant="primary", size="lg")
            
        # 右侧输出面板
        with gr.Column(scale=1):
            gr.Markdown("### <div style='display: flex; align-items: center;'>📊 分析结果</div>")
            
            # 使用带有独立容器背景的 Markdown 组件，高度固定 500px 以免排版混乱
            output_text = gr.Markdown(
                value="*等待分析输入...*",
                container=True, # 赋予组件独立容器背景
                height=500,     # 固定高度，防止内容过长撑破页面
                rtl=False
            )
            
    # 交互行为：点击后按钮禁用并显示加载状态，分析完成后恢复正常状态
    submit_btn.click(
        fn=set_loading,
        outputs=submit_btn
    ).then(
        fn=gradio_interface,
        inputs=[file_in, url_in, prompt_in],
        outputs=output_text,
        concurrency_limit=1 # 限制并发，保护后端
    ).then(
        fn=restore_button,
        outputs=submit_btn
    )

# 启用队列（必须启用队列才能显示 Loading 动画以及使用 concurrency_limit）
demo.queue()

# 将 Gradio 挂载到 FastAPI 的根路径下
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    port = int(os.getenv("AGENT_PORT", 8000))
    uvicorn.run(app, host=host, port=port)
