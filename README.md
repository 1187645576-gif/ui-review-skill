# 设计走查助手 v2.0

像素级对比设计稿与开发实现，自动检测圆角、字号、间距、颜色、布局差异，生成包含热力图和问题截图的 HTML + Word 走查报告。

## 特性

- **像素级差异检测**：8x8 网格 + RGB/亮度加权对比 + 3x3 邻域平滑
- **5 类问题识别**：字号/文本、圆角/形状、间距/对齐、颜色/填充、布局结构
- **3 级严重度分级**：高（影响功能）/ 中（影响视觉）/ 低（细节优化）
- **可视化输出**：差异热力图、设计+开发重叠对比、问题区域裁切高亮
- **双格式报告**：自包含 HTML（base64 内嵌图片）+ Word（.doc）
- **双运行模式**：CLI 命令行 + HTTP API
- **多平台支持**：Claude Code、Coze、豆包、Cursor、GitHub Copilot

## 快速使用

### CLI 模式

```bash
# 安装依赖
npm install

# 运行走查
node src/index.js --design design.png --dev dev.png --output ./report

# 输出
# ./report/report.html  - 自包含 HTML 走查报告
# ./report/report.doc   - Word 走查报告
```

### HTTP API 模式

```bash
# 启动服务
node src/index.js serve --port 3001

# 调用 API
curl -X POST http://localhost:3001/api/review \
  -F "design=@design.png" \
  -F "dev=@dev.png"
```

### Claude Code

```bash
# 一键安装
curl -fsSL https://raw.githubusercontent.com/1187645576-gif/ui-review-skill/main/install.sh | bash

# 使用
# 在 Claude Code 中输入 /ui-review
```

## 支持平台

| 平台 | 类型 | 文件 |
|---|---|---|
| **Claude Code** | `/ui-review` 命令 | `platforms/claude-code.md` |
| **Coze** | API 插件 | `platforms/coze-plugin.json` |
| **豆包** | API 插件 | `platforms/doubao-plugin.json` |
| **Cursor** | Rules | `platforms/cursor.mdc` |
| **GitHub Copilot** | Instructions | `platforms/copilot.md` |
| **Claude.ai / GPT** | System Prompt | `platforms/universal.md` |

## CLI 参数

```
必填：
  --design <path>      设计稿图片路径
  --dev <path>         开发稿图片路径

可选：
  --output <dir>       输出目录（默认 ./ui-review-output）
  --threshold <n>      检测灵敏度 0-1（默认 0.23，越低越敏感）
  --min-region <n>     最小问题区域格数（默认 10）
  --page-name <name>   报告页面名称
  --version <ver>      版本号
  --reviewer <name>    走查人员
  --notes <text>       备注
```

## HTTP API

### POST /api/review

上传设计稿和开发截图，返回走查结果。

**请求**：`multipart/form-data`
- `design`（必填）：设计稿图片
- `dev`（必填）：开发截图
- `threshold`（可选）：检测灵敏度
- `pageName`（可选）：报告页面名称

**响应**：
```json
{
  "success": true,
  "summary": {
    "totalIssues": 7,
    "highCount": 2,
    "mediumCount": 3,
    "lowCount": 2
  },
  "issues": [...],
  "reportHtmlBase64": "...",
  "reportWordBase64": "..."
}
```

## 项目结构

```
ui-review-skill/
├── package.json
├── skill.json              # 多平台元数据
├── install.sh              # 一键安装脚本
├── src/
│   ├── index.js            # 统一入口（CLI / HTTP）
│   ├── cli.js              # CLI 流程编排
│   ├── server.js           # Express HTTP API
│   ├── core/
│   │   ├── constants.js    # 配置常量
│   │   ├── pixel-diff.js   # 像素差异计算引擎
│   │   ├── issue-detector.js # BFS 连通域问题检测
│   │   ├── heat-map.js     # 差异热力图
│   │   ├── overlay.js      # 重叠对比图
│   │   └── issue-assets.js # 问题区域裁切+高亮
│   ├── image/
│   │   ├── loader.js       # 图像加载
│   │   ├── normalizer.js   # 尺寸归一化
│   │   └── exporter.js     # base64 / Buffer 导出
│   └── report/
│       ├── html-report.js  # HTML 报告生成
│       ├── word-report.js  # Word 报告生成
│       └── utils.js        # 报告工具函数
└── platforms/
    ├── claude-code.md
    ├── coze-plugin.json
    ├── doubao-plugin.json
    ├── cursor.mdc
    ├── copilot.md
    └── universal.md
```

## License

MIT
