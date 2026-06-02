from tools.base import BaseOcrTool, config

class PaddleOCRVLTool(BaseOcrTool):
    """
    PaddleOCR-VL 视觉语言模型版面解析接口
    """
    def __init__(self):
        super().__init__(config.paddleocr_vl_url)

    def run(self, file_path_or_url: str) -> str:
        """
        执行视觉语言模型版面解析并返回格式化的 Markdown 结果
        :param file_path_or_url: 文件路径或URL
        :return: 提取的 Markdown 文本
        """
        response = self.call_api(
            file_path_or_url, 
            useLayoutDetection=True, 
            prettifyMarkdown=True,
            visualize=False
        )
        
        if response.get("errorCode") != 0:
            return f"Error: {response.get('errorMsg')}"
            
        result = response.get("result", {})
        layout_results = result.get("layoutParsingResults", [])
        
        extracted_md = []
        for page in layout_results:
            markdown = page.get("markdown", {})
            text = markdown.get("text", "")
            extracted_md.append(text)
            
        return "\n\n".join(extracted_md)

# 实例化单例供 Agent 使用
paddleocr_vl_tool = PaddleOCRVLTool()
