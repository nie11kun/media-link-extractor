# 媒体链接提取器后端

这是一个基于 Flask 的媒体链接提取器应用程序的后端项目。它提供了 API 端点用于从各种网站提取媒体信息并下载媒体文件。

## 功能特性

- 从 URL 中提取媒体信息（视频、音频、图片和播放列表）
- 支持多种格式和质量的媒体下载
- 使用 yt-dlp 库进行媒体信息提取和下载
- 临时文件管理和自动清理机制
- 详细的日志记录

## 前置要求

在开始之前，请确保您满足以下要求：

- Python 3.7 或更高版本
- pip（Python 包管理器）

## 安装

按照以下步骤安装媒体链接提取器后端：

1. 克隆仓库：
   ```
   git clone https://github.com/nie11kun/media-link-extractor.git
   ```
2. 进入项目目录：
   ```
   cd backend
   ```
3. 创建并激活虚拟环境（推荐）：
   ```
   python -m venv venv
   source venv/bin/activate  # 在 Windows 上使用 venv\Scripts\activate
   ```
4. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

## 运行应用

要启动后端服务器，请运行：

```
python ./app.py
```

默认情况下，服务器将在 `http://localhost:5000` 上运行。

## API 端点

### 1. 提取媒体信息

- **URL**: `/extract`
- **方法**: POST
- **数据格式**: JSON
- **参数**:
  - `url`: 要提取信息的媒体链接
- **响应**: 包含媒体信息的 JSON 对象

### 2. 下载媒体

- **URL**: `/download`
- **方法**: POST
- **数据格式**: JSON
- **参数**:
  - `url`: 媒体链接
  - `format_id`: 要下载的格式 ID
  - `title`: 媒体标题
- **响应**: 媒体文件

## 错误处理

该应用使用适当的 HTTP 状态码和错误消息进行错误处理。所有错误都会记录到日志文件中。

## 日志

日志文件 `app.log` 位于项目根目录，使用循环日志处理器，最大大小为 10MB，保留 10 个备份文件。

## 贡献指南

如果您想为媒体链接提取器后端贡献代码，请遵循以下步骤：

1. Fork 这个仓库
2. 创建您的特性分支：`git checkout -b feature/AmazingFeature`
3. 提交您的更改：`git commit -m 'Add some AmazingFeature'`
4. 将更改推送到分支：`git push origin feature/AmazingFeature`
5. 开启一个 Pull Request

## 注意事项

- 这个应用程序创建了一个临时目录来存储下载的文件。确保您的系统有足够的磁盘空间。
- 下载的文件会在一小时后自动删除。
- 请遵守版权法，仅下载您有权下载的内容。

## 联系方式

如果您有任何问题或建议，请发送邮件至 [your-email@example.com](mailto:your-email@example.com)。

## 许可证

本项目使用 [MIT 许可证](https://opensource.org/licenses/MIT)。