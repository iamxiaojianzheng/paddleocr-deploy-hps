from tools.base import BaseOcrTool, config

class PPStructureV3Tool(BaseOcrTool):
    """
    PP-StructureV3 文档版面解析接口
    """
    def __init__(self):
        super().__init__(config.pp_structurev3_url)

    def run(self, file_path_or_url: str) -> str:
        """
        执行版面解析并返回 Markdown 结果
        :param file_path_or_url: 文件路径或URL
        :return: 提取的 Markdown 文本
        """
        response = self.call_api(
            file_path_or_url, 
            useTableRecognition=True, 
            useFormulaRecognition=True,
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
pp_structurev3_tool = PPStructureV3Tool()
