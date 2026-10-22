"""一個指令啟動投影片與三個可試玩的場景（只需要 Python 3，不用 Node）。

用法：在 slides 資料夾執行 `python3 start.py`，然後開 http://localhost:8730
  投影片在根目錄，三個試玩版在 live/main、live/codex2、live/opus（tools/build_live.sh 打包，路徑都是相對的，
  所以同一個資料夾也能直接放上 GitHub Pages）。
按 Ctrl+C 結束。
"""
import functools
import http.server
import threading
import webbrowser
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITES = [(8730, HERE)]
LIVE = [HERE / "live" / name for name in ("main", "codex2", "opus")]


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".mjs": "text/javascript", ".glb": "model/gltf-binary", ".wasm": "application/wasm"}

    def log_message(self, format, *args):  # 不洗版
        pass


def serve(port, root):
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(root)))
    except OSError:
        raise SystemExit(f"port {port} 已被其他程式使用，請先關掉它再執行")
    threading.Thread(target=server.serve_forever, daemon=True).start()


if __name__ == "__main__":
    for root in LIVE:
        if not root.exists():
            raise SystemExit(f"找不到 {root}，請先在專案根目錄執行 tools/build_live.sh")
    for port, root in SITES:
        if not root.exists():
            raise SystemExit(f"找不到 {root}，請先在專案根目錄執行 tools/build_live.sh")
        serve(port, root)
        print(f"http://localhost:{port}  ←  {root.relative_to(HERE.parent)}")
    print("投影片：http://localhost:8730（Ctrl+C 結束）")
    webbrowser.open("http://localhost:8730")
    threading.Event().wait()
