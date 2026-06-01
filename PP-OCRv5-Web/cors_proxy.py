import http.server
import urllib.request
import urllib.error

# 本地中转代理端口
PORT = 8081
# 目标 Docker 暴露的 PP-OCRv5 服务地址
TARGET_HOST = "http://localhost:8080"

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # 覆写日志，格式化输出
        print(f"[Proxy] {self.address_string()} - {format % args}")

    def do_OPTIONS(self):
        # 拦截 OPTIONS 预检请求，直接响应 204 并带上跨域头
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400") # 缓存预检结果 1 天
        self.end_headers()

    def do_POST(self):
        # 读取前端发来的请求体
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        # 构建转发到 Docker 服务的请求
        url = f"{TARGET_HOST}{self.path}"
        req = urllib.request.Request(
            url,
            data=post_data,
            headers={
                "Content-Type": "application/json"
            },
            method="POST"
        )

        try:
            # 服务端之间请求没有 CORS 限制
            with urllib.request.urlopen(req) as response:
                response_data = response.read()
                
                # 成功时将结果及跨域头返回给前端
                self.send_response(response.status)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(response_data)
        except urllib.error.HTTPError as e:
            # 目标服务报错时（如 400/500），也将错误原样转发并加上跨域头
            response_data = e.read()
            self.send_response(e.code)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response_data)
        except Exception as e:
            # 代理服务器本身报错
            self.send_response(500)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

if __name__ == "__main__":
    server = http.server.HTTPServer(("", PORT), CORSProxyHandler)
    print(f"============================================================")
    print(f" PP-OCRv5 CORS 跨域代理服务器已启动!")
    print(f" 代理服务监听地址: http://localhost:{PORT}")
    print(f" 请求将自动转发至 Docker 服务: {TARGET_HOST}")
    print(f" 请在前端页面的 'API Base URL' 中填写: http://localhost:{PORT}")
    print(f"============================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在停止代理服务器...")
