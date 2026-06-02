import os
import logging
from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessageChunk
from dotenv import load_dotenv

from tools.pp_ocrv5 import pp_ocrv5_tool
from tools.pp_structurev3 import pp_structurev3_tool
from tools.paddleocr_vl import paddleocr_vl_tool

load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Ocr2TextAgent")

# 扩展 ChatOpenAI 以支持在流式输出中捕获并传递 reasoning_content (如 DeepSeek 系列模型的思考过程)
class ReasoningChatOpenAI(ChatOpenAI):
    def _convert_chunk_to_generation_chunk(
        self,
        chunk: dict,
        default_chunk_class: type,
        base_generation_info: dict | None,
    ):
        generation_chunk = super()._convert_chunk_to_generation_chunk(
            chunk, default_chunk_class, base_generation_info
        )
        if generation_chunk is None:
            return None
        
        try:
            # 兼容 OpenAI 格式的流式输出中，choices[0].delta 可能包含 reasoning_content
            choices = chunk.get("choices", []) or chunk.get("chunk", {}).get("choices", [])
            if choices:
                delta = choices[0].get("delta", {})
                reasoning = delta.get("reasoning_content") or delta.get("reasoning")
                if reasoning and generation_chunk.message:
                    # 将思考内容保存到 additional_kwargs 中，供外部流式解析使用
                    generation_chunk.message.additional_kwargs["reasoning_content"] = reasoning
        except Exception:
            pass
            
        return generation_chunk

# 初始化 LLM (支持 OpenAI 或 兼容 OpenAI 格式的本地/在线模型)
def get_llm():
    api_key = os.getenv("OPENAI_API_KEY", "EMPTY")
    base_url = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    model_name = os.getenv("MODEL_NAME", "gpt-4o")
    
    return ReasoningChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        temperature=0.1,
        streaming=True
    )

# 封装为 Langchain Tools
tools = [
    Tool(
        name="PP-OCRv5",
        func=pp_ocrv5_tool.run,
        description="高精度 OCR 识别工具。输入必须是文件路径或文件URL。适用于提取纯文本，支持多语言、竖排、手写体等。"
    ),
    Tool(
        name="PP-StructureV3",
        func=pp_structurev3_tool.run,
        description="文档版面解析工具。输入必须是文件路径或文件URL。适用于提取表格、公式和一般文档，将其转换为结构化 Markdown。"
    ),
    Tool(
        name="PaddleOCR-VL",
        func=paddleocr_vl_tool.run,
        description="视觉语言模型版面解析工具。输入必须是文件路径或文件URL。适用于复杂的文档版面理解，输出格式化的 Markdown，支持跨页表格合并。"
    )
]

def create_ocr_agent():
    llm = get_llm()
    
    system_prompt = """你是一个智能文档分析助手 Ocr2TextAgent。
你可以使用以下三种 OCR 工具来提取图片或 PDF 中的文本内容：
1. PP-OCRv5: 适合纯文本识别。
2. PP-StructureV3: 适合包含表格、公式的文档解析。
3. PaddleOCR-VL: 适合复杂版面和视觉语言理解。

用户会提供文件的路径或 URL，并给出他们的具体需求。
你需要：
1. 根据用户的需求，自主选择最合适的 OCR 工具调用。
2. 将文件路径或 URL 传给选中的工具，获取 OCR 结果。
3. 根据工具返回的 OCR 结果，结合用户的需求进行分析、总结或信息抽取。
4. 将最终分析得出的结果返回给用户。

如果解析出错，请告知用户。"""

    # 使用 langgraph 创建 react agent
    agent_executor = create_react_agent(llm, tools, prompt=system_prompt)
    return agent_executor

# 单例 Agent
ocr_agent = create_ocr_agent()

def process_document(file_input: str, user_prompt: str) -> str:
    """
    处理文档，供外部服务调用
    :param file_input: 文件路径或 URL
    :param user_prompt: 用户需求
    :return: 分析结果
    """
    try:
        content = f"文件：{file_input}\n需求：{user_prompt}"
        logger.info(f"开始处理文档: {file_input}")
        logger.info(f"用户需求: {user_prompt}")
        
        final_answer = ""
        print("\n\n" + "="*40 + " Agent 实时思考过程 " + "="*40)
        
        for event in ocr_agent.stream(
            {"messages": [HumanMessage(content=content)]},
            stream_mode=["messages", "values"]
        ):
            event_type = event[0]
            
            # token 级别的实时流
            if event_type == "messages":
                msg_chunk, metadata = event[1]
                
                # 兼容判断：只要是 AIMessageChunk 实例或 type 属性为 'ai' 均代表 AI 的流式数据
                if isinstance(msg_chunk, AIMessageChunk) or getattr(msg_chunk, 'type', None) == 'ai':
                    # 1. 如果是支持深度思考的本地模型 (如 DeepSeek R1)，它会将过程放在 reasoning_content 中
                    reasoning = msg_chunk.additional_kwargs.get("reasoning_content", "")
                    if reasoning:
                        # 灰色字体打印大模型内部真实的思考链 (CoT)
                        print(f"\033[90m{reasoning}\033[0m", end="", flush=True)
                        
                    # 2. 打印普通的回复内容 (此时如果是调用工具的 JSON，由于在 tool_calls 里，content 为空，因此不会被打印)
                    if msg_chunk.content and isinstance(msg_chunk.content, str):
                        print(msg_chunk.content, end="", flush=True)
                        
                elif msg_chunk.type == 'tool':
                    print(f"\n\n🛠️  [内部系统] 工具 '{msg_chunk.name}' 执行完毕，结果已返回给大模型...\n")
            
            # 状态级别的更新，用于捕获最终结果
            elif event_type == "values":
                state = event[1]
                if state and "messages" in state:
                    last_msg = state["messages"][-1]
                    # 如果最后一条是 AI 发出的，并且不是在调工具，就是最终回答
                    if last_msg.type == "ai" and not getattr(last_msg, 'tool_calls', None):
                        final_answer = last_msg.content
                        
        print("\n" + "="*100 + "\n")
        logger.info("[处理完成]")
        return final_answer
    except Exception as e:
        logger.error(f"分析过程发生错误: {str(e)}", exc_info=True)
        return f"分析过程发生错误: {str(e)}"
