const { toBase64DataUrl } = require("../image/exporter");
const { escapeHtml, severityText, formatDate } = require("./utils");

const REPORT_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Microsoft YaHei","Segoe UI",sans-serif; padding: 32px; color: #1a1a2e; background: #f8fafd; line-height: 1.6; }
.report-header { margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
.report-header h1 { font-size: 24px; margin-bottom: 12px; }
.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 14px; color: #4b5563; }
.summary-section { margin-bottom: 24px; }
.summary-section h2 { font-size: 18px; margin-bottom: 12px; }
.summary-bar { display: flex; gap: 16px; flex-wrap: wrap; }
.stat { padding: 8px 16px; border-radius: 8px; background: #f3f4f6; font-size: 14px; }
.stat strong { font-size: 20px; margin-left: 4px; }
.severity-high { background: #fee2e2; color: #b91c1c; }
.severity-medium { background: #fef3c7; color: #92400e; }
.severity-low { background: #dbeafe; color: #1e40af; }
.overview-section { margin-bottom: 32px; }
.overview-section h2 { font-size: 18px; margin-bottom: 12px; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.overview-item h3 { font-size: 14px; color: #6b7280; margin-bottom: 6px; }
.overview-item img { width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
.issue-section { margin-bottom: 24px; }
.issue-section h2 { font-size: 18px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
.issue-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #fff; }
.issue-card.card-high { border-left: 4px solid #ef4444; }
.issue-card.card-medium { border-left: 4px solid #f59e0b; }
.issue-card.card-low { border-left: 4px solid #3b82f6; }
.issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.issue-index { font-weight: 700; color: #374151; }
.badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.issue-title { font-size: 16px; }
.issue-summary { font-size: 14px; color: #4b5563; margin-bottom: 10px; }
.issue-meta { display: flex; gap: 16px; font-size: 12px; color: #9ca3af; margin-bottom: 12px; flex-wrap: wrap; }
.comparison-row { display: flex; gap: 12px; flex-wrap: wrap; }
.comparison-row > div > h4 { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.comparison-row img { max-width: 280px; border-radius: 6px; border: 1px solid #e5e7eb; }
.footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
@media print { body { padding: 16px; } .overview-grid { break-inside: avoid; } .issue-card { break-inside: avoid; } }
`;

async function generateHtmlReport(analysisResult, meta) {
  const { issues, designImage, devImage, heatMapImage, overlayImage } = analysisResult;
  const timestamp = formatDate();

  const highIssues = issues.filter((i) => i.severity === "high");
  const mediumIssues = issues.filter((i) => i.severity === "medium");
  const lowIssues = issues.filter((i) => i.severity === "low");

  const designB64 = await toBase64DataUrl(designImage);
  const devB64 = await toBase64DataUrl(devImage);
  const heatB64 = await toBase64DataUrl(heatMapImage);
  const overlayB64 = await toBase64DataUrl(overlayImage);

  const issueCardsHtml = [];
  for (const group of [
    { title: "高优先级问题（影响功能或核心视觉）", items: highIssues, cls: "card-high", badge: "severity-high" },
    { title: "中优先级问题（影响视觉还原）", items: mediumIssues, cls: "card-medium", badge: "severity-medium" },
    { title: "低优先级问题（细节优化）", items: lowIssues, cls: "card-low", badge: "severity-low" },
  ]) {
    if (!group.items.length) continue;
    issueCardsHtml.push(`<h2>${escapeHtml(group.title)}</h2>`);
    for (let idx = 0; idx < group.items.length; idx += 1) {
      const issue = group.items[idx];
      const designCropB64 = await toBase64DataUrl(issue.designCrop);
      const devCropB64 = await toBase64DataUrl(issue.devCrop);
      issueCardsHtml.push(`
        <div class="issue-card ${group.cls}">
          <div class="issue-header">
            <span class="issue-index">#${issues.indexOf(issue) + 1}</span>
            <span class="badge ${group.badge}">${severityText(issue.severity)}</span>
            <strong class="issue-title">${escapeHtml(issue.title)}</strong>
          </div>
          <p class="issue-summary">${escapeHtml(issue.summary)}</p>
          <div class="issue-meta">
            <span>类型：${escapeHtml(issue.type)}</span>
            <span>区域：${issue.bbox.w} × ${issue.bbox.h}</span>
            <span>差异强度：${Math.round(issue.score * 100)}%</span>
            <span>位置：(${issue.bbox.x}, ${issue.bbox.y})</span>
          </div>
          <div class="comparison-row">
            <div><h4>设计稿局部</h4><img src="${designCropB64}" alt="设计稿局部"></div>
            <div><h4>开发稿局部</h4><img src="${devCropB64}" alt="开发稿局部"></div>
          </div>
        </div>`);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.pageName || "UI 走查报告")}</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <header class="report-header">
    <h1>${escapeHtml(meta.pageName || "UI 走查报告")}</h1>
    <div class="meta-grid">
      <div><strong>版本：</strong>${escapeHtml(meta.version || "")}</div>
      <div><strong>走查人员：</strong>${escapeHtml(meta.reviewer || "")}</div>
      <div><strong>生成时间：</strong>${escapeHtml(timestamp)}</div>
      <div><strong>检测灵敏度：</strong>${meta.threshold || 0.23}</div>
    </div>
    ${meta.notes ? `<p style="margin-top:8px;font-size:14px;color:#6b7280;">备注：${escapeHtml(meta.notes)}</p>` : ""}
  </header>

  <section class="summary-section">
    <h2>走查总结</h2>
    <div class="summary-bar">
      <div class="stat">总问题数：<strong>${issues.length}</strong></div>
      <div class="stat severity-high">高优先级：<strong>${highIssues.length}</strong></div>
      <div class="stat severity-medium">中优先级：<strong>${mediumIssues.length}</strong></div>
      <div class="stat severity-low">低优先级：<strong>${lowIssues.length}</strong></div>
    </div>
  </section>

  <section class="issue-section">
    ${issueCardsHtml.join("\n")}
    ${issues.length === 0 ? "<p>未识别到明显差异问题。</p>" : ""}
  </section>

  <section class="overview-section">
    <h2>全局视图</h2>
    <div class="overview-grid">
      <div class="overview-item"><h3>设计稿</h3><img src="${designB64}" alt="设计稿"></div>
      <div class="overview-item"><h3>开发稿</h3><img src="${devB64}" alt="开发稿"></div>
      <div class="overview-item"><h3>差异热力图</h3><img src="${heatB64}" alt="差异热力图"></div>
      <div class="overview-item"><h3>重叠对比</h3><img src="${overlayB64}" alt="重叠对比"></div>
    </div>
  </section>

  <footer class="footer">
    <p>由 AI UI 走查助手 v2.0.0 自动生成 | ${escapeHtml(timestamp)}</p>
  </footer>
</body>
</html>`;

  return html;
}

module.exports = { generateHtmlReport };
