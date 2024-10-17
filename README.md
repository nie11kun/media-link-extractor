# 媒体链接提取器项目

这是一个全栈媒体链接提取器应用，包含 Flask 后端和 React 前端。该应用允许用户输入媒体 URL，提取媒体信息，并提供下载选项。

## 后端 (Flask)

后端使用 Flask 框架，提供 API 用于提取媒体信息和处理下载请求。

### 设置与运行

1. 进入后端目录：
   ```
   cd backend
   ```

2. 创建并激活虚拟环境：
   ```
   python -m venv venv
   source venv/bin/activate  # 在 Windows 上使用 venv\Scripts\activate
   ```

3. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

4. 运行 Flask 应用：
   ```
   flask run
   ```

后端服务器将在 `http://localhost:5000` 上运行。

## 前端 (React)

前端使用 React 框架，提供用户界面来输入 URL、显示提取的媒体信息，并处理下载请求。

### 设置与运行

1. 进入前端目录：
   ```
   cd frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 运行开发服务器：
   ```
   npm start
   ```

前端应用将在 `http://localhost:3000` 上运行。

## 环境变量

- 前端：在 `frontend/.env` 文件中设置环境变量，例如 API URL：
  ```
  REACT_APP_API_BASE_URL=http://localhost:5000
  ```

## 使用说明

1. 确保后端和前端服务器都在运行。
2. 在浏览器中打开 `http://localhost:3000`。
3. 在输入框中输入媒体 URL。
4. 点击"提取"按钮获取媒体信息。
5. 选择所需的格式和质量，然后点击"下载"。

## 开发

- 后端：主要逻辑在 `backend/app.py` 文件中。
- 前端：主要组件在 `frontend/src` 目录中。

## 注意事项

- 确保您有权下载您请求的内容。
- 下载的文件会暂时存储在后端服务器上，并会定期清理。

## 贡献

欢迎贡献！请查看各个目录中的 README 文件以获取更多详细信息。

## 许可证

本项目采用 MIT 许可证。详情请见 [LICENSE](LICENSE) 文件。