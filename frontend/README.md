# 媒体链接提取器前端

这是一个基于 React 的媒体链接提取器应用程序的前端项目。它允许用户输入 URL 并提取媒体信息，同时提供各种格式的下载选项。

## 功能特性

- 从 URL 中提取媒体信息
- 支持视频、音频、图片和播放列表链接
- 支持多种格式和质量的媒体下载
- 响应式设计，适配桌面和移动设备

## 前置要求

在开始之前，请确保您满足以下要求：

- 您已安装最新版本的 [Node.js 和 npm](https://nodejs.org/)
- 您使用的是 Windows/Linux/Mac 操作系统

## 安装媒体链接提取器前端

按照以下步骤安装媒体链接提取器前端：

1. 克隆仓库：
   ```
   git clone https://github.com/nie11kun/media-link-extractor.git
   ```
2. 进入项目目录：
   ```
   cd frontend
   ```
3. 安装依赖：
   ```
   npm install
   ```

## 配置应用

本应用使用环境变量来配置 API 基础 URL。您可以通过以下方式设置：

1. 在项目根目录创建一个 `.env` 文件，并添加：
   ```
   REACT_APP_API_BASE_URL=http://your-api-url.com
   ```
2. 或者，在启动应用时设置：
   ```
   REACT_APP_API_BASE_URL=http://your-api-url.com npm start
   ```

如果未设置，默认值为 `http://localhost:5000`。

## 使用媒体链接提取器前端

按照以下步骤使用媒体链接提取器前端：

1. 启动开发服务器：
   ```
   npm start
   ```
2. 打开您的网页浏览器，访问 `http://localhost:3000`
3. 在输入框中输入媒体 URL，然后点击"提取"
4. 信息提取后，您可以查看可用的格式和下载选项

## 贡献到媒体链接提取器前端

如果您想为媒体链接提取器前端贡献代码，请遵循以下步骤：

1. Fork 这个仓库
2. 创建您的特性分支：`git checkout -b <branch_name>`
3. 提交您的更改：`git commit -m '<commit_message>'`
4. 将更改推送到远程分支：`git push origin <project_name>/<location>`
5. 创建一个 Pull Request

或者，您可以查看 GitHub 文档中关于[创建 Pull Request](https://help.github.com/cn/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)的部分。

## 联系方式

如果您想联系项目维护者，可以发送邮件至 [me@niekun.net](mailto:me@niekun.net)。

## 许可证

本项目使用以下许可证：[MIT 许可证](https://opensource.org/licenses/MIT)。