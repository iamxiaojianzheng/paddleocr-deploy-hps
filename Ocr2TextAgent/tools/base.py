import os
import requests
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from utils.file_utils import encode_file_to_base64, get_file_type

load_dotenv()

class OcrConfig(BaseSettings):
    pp_ocrv5_url: str = os.getenv("PP_OCRV5_URL", "http://localhost:8080/ocr")
    pp_structurev3_url: str = os.getenv("PP_STRUCTUREV3_URL", "http://localhost:8081/layout-parsing")
    paddleocr_vl_url: str = os.getenv("PADDLEOCR_VL_URL", "http://localhost:8080/layout-parsing")

config = OcrConfig()

class BaseOcrTool:
    def __init__(self, api_url: str):
        self.api_url = api_url

    def _prepare_payload(self, file_path_or_url: str, **kwargs) -> dict:
        """
        准备请求的 payload
        """
        payload = kwargs.copy()
        
        # 简单判断是否是 URL
        if file_path_or_url.startswith("http://") or file_path_or_url.startswith("https://"):
            payload["file"] = file_path_or_url
            if "fileType" not in payload:
                payload["fileType"] = None # 让后端推断
        else:
            # 本地文件
            payload["file"] = encode_file_to_base64(file_path_or_url)
            if "fileType" not in payload:
                payload["fileType"] = get_file_type(file_path_or_url)
                
        return payload

    def call_api(self, file_path_or_url: str, **kwargs) -> dict:
        """
        发起 API 请求
        """
        payload = self._prepare_payload(file_path_or_url, **kwargs)
        try:
            response = requests.post(
                self.api_url, 
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"errorCode": 500, "errorMsg": f"API调用失败: {str(e)}", "result": None}
