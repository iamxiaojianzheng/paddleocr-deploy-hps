import base64
import os
import mimetypes

def get_file_type(file_path: str) -> int:
    """
    根据文件路径获取文件类型
    :param file_path: 文件路径
    :return: 0 = PDF, 1 = 图像
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return 0
    elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
        return 1
    
    # Try guessing via mimetypes
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        if 'pdf' in mime_type:
            return 0
        elif 'image' in mime_type:
            return 1
    
    # 默认回退为图像
    return 1

def encode_file_to_base64(file_path: str) -> str:
    """
    将文件内容编码为 Base64 字符串
    :param file_path: 文件路径
    :return: base64 字符串
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件未找到: {file_path}")
        
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")

def save_base64_to_file(base64_str: str, output_path: str):
    """
    将 Base64 字符串保存为文件
    :param base64_str: Base64 字符串
    :param output_path: 输出路径
    """
    if not base64_str:
        return
        
    # Remove prefix if present (e.g. data:image/jpeg;base64,)
    if "," in base64_str and base64_str.startswith("data:"):
        base64_str = base64_str.split(",")[1]
        
    with open(output_path, "wb") as f:
        f.write(base64.b64decode(base64_str))
