# AI UI 走查助手

当用户说"设计走查"、"走查"、"UI对比"、"设计稿对比"或提供了两张图片要求对比时，自动进入走查模式。

## 触发后的操作

1. 如果用户还没提供图片路径，简单问一句：「请提供设计稿和开发稿的图片路径」
2. 拿到两张图片路径后，直接执行：

```bash
node ~/.claude/skills/ui-review/src/index.js \
  --design "$DESIGN_PATH" \
  --dev "$DEV_PATH" \
  --output "./ui-review-report"
```

3. 走查完成后告知用户报告位置（`report.html` 和 `report.doc`），报告关键发现

$ARGUMENTS
