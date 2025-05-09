# SCRIPT 

[DEEPWIKI](https://deepwiki.com/shuakami/script)

其用途大概就是发卡、给客户执行一次性、需要加密的脚本。

本套系统借鉴了 ISO 27002 / ISO 27002 A.10 / NIST SP 800 的相关理念。

## 模块说明

### `server/`
这块是后端服务，用 Node.js 写的。
处理 API 请求、用户登录、脚本管理、激活、下载这些功能的。

### `client/`
前端界面，用 Next.js (React) 做的。
给管理员操作的管理后台。

### `client_tools/`
这里面放了一些客户端相关的工具，有个`activator` 目录负责激活、解密和执行。


未经许可，禁止擅自二次修改、使用此系统。

