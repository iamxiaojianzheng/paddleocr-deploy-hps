from tools.base import BaseOcrTool, config

class PPOcrV5Tool(BaseOcrTool):
    """
    PP-OCRv5 高精度 OCR 识别工具
    """
    def __init__(self):
        super().__init__(config.pp_ocrv5_url)

    def run(self, file_path_or_url: str) -> str:
        """
        执行 OCR 识别并返回文本结果
        :param file_path_or_url: 文件路径或URL
        :return: 提取的文本
        """
        # 可以根据需要传入参数，比如 visualize=False
        response = self.call_api(file_path_or_url, visualize=False)
        
        if response.get("errorCode") != 0:
            return f"Error: {response.get('errorMsg')}"
            
        result = response.get("result", {})
        ocr_results = result.get("ocrResults", [])
        
        extracted_text = []
        for page in ocr_results:
            pruned = page.get("prunedResult", {})
            # prunedResult 可能是一个包含文本、置信度等信息的结构
            # 根据 API 文档，这里提取内容，具体结构视返回结果而定
            # 假设其结构中直接包含文本列表或可以通过迭代获取
            # 如果是字典，我们转化为字符串展示
            extracted_text.append(str(pruned))
            
        return "\n".join(extracted_text)

# 实例化单例供 Agent 使用
pp_ocrv5_tool = PPOcrV5Tool()
