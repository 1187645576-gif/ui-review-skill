#!/usr/bin/env bash
set -e

REPO_RAW="https://raw.githubusercontent.com/1187645576-gif/ui-review-skill/main"
SKILL_DIR="$HOME/.claude/skills/ui-review"
COMMANDS_DIR="$HOME/.claude/commands"

echo "正在安装 AI UI 走查助手 v2.0.0..."

# 下载核心引擎
mkdir -p "$SKILL_DIR/src/core" "$SKILL_DIR/src/image" "$SKILL_DIR/src/report"

for f in package.json src/index.js src/cli.js src/server.js \
  src/core/constants.js src/core/pixel-diff.js src/core/issue-detector.js \
  src/core/heat-map.js src/core/overlay.js src/core/issue-assets.js \
  src/image/loader.js src/image/normalizer.js src/image/exporter.js \
  src/report/utils.js src/report/html-report.js src/report/word-report.js; do
  curl -fsSL "$REPO_RAW/$f" -o "$SKILL_DIR/$f"
done

# 安装依赖
cd "$SKILL_DIR" && npm install --production --silent

# 安装 Claude Code 命令
mkdir -p "$COMMANDS_DIR"
curl -fsSL "$REPO_RAW/platforms/claude-code.md" -o "$COMMANDS_DIR/ui-review.md"

echo ""
echo "安装完成！"
echo "  Claude Code：使用 /ui-review 命令"
echo "  CLI 模式：  node $SKILL_DIR/src/index.js --design a.png --dev b.png"
echo "  HTTP 模式： node $SKILL_DIR/src/index.js serve --port 3001"
echo ""
echo "其他平台："
echo "  Coze/豆包：部署 HTTP 服务后，使用 platforms/ 下的插件 manifest 配置"
echo "  Cursor：   复制 platforms/cursor.mdc 到 Cursor Rules"
