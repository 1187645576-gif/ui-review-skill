const { toBase64DataUrl } = require("../image/exporter");
const { escapeHtml, severityText, formatDate } = require("./utils");

const WORD_CSS = `
body { font-family: "Microsoft YaHei","Segoe UI",sans-serif; padding: 24px; color: #10233f; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { border: 1px solid #cfd9e6; padding: 10px; vertical-align: top; }
th { background: #eef5ff; text-align: left; }
img { max-width: 260px; border-radius: 8px; border: 1px solid #dbe6f4; }
ul { margin: 0 0 16px 18px; }
h1, h2, p { margin: 0 0 12px; }
span { font-size: 12px; color: #567; }
.badge-high { color: #b91c1c; font-weight: bold; }
.badge-medium { color: #92400e; font-weight: bold; }
.badge-low { color: #1e40af; font-weight: bold; }
`;

async function generateWordReport(analysisResult, meta) {
  const { issues, designImage, devImage, heatMapImage } = analysisResult;
  const timestamp = formatDate();

  const highIssues = issues.filter((i) => i.severity === "high");
  const mediumIssues = issues.filter((i) => i.severity === "medium");
  const lowIssues = issues.filter((i) => i.severity === "low");

  const designB64 = await toBase64DataUrl(designImage);
  const devB64 = await toBase64DataUrl(devImage);
  const heatB64 = await toBase64DataUrl(heatMapImage);

  const rows = [];
  for (const issue of issues) {
    const designCropB64 = await toBase64DataUrl(issue.designCrop);
    const devCropB64 = await toBase64DataUrl(issue.devCrop);
    const badgeClass = `badge-${issue.severity}`;
    rows.push(`<tr>
      <td><span class="${badgeClass}">${severityText(issue.severity)}</span></td>
      <td><strong>${escapeHtml(issue.title)}</strong><br>${escapeHtml(issue.summary)}</td>
      <td><img src="${designCropB64}" alt="设计稿"><br><img src="${devCropB64}" alt="开发稿"></td>
    </tr>`);
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(meta.pageName || "UI 走查报告")}</title>
<style>${WORD_CSS}</style></head><body>
<h1>${escapeHtml(meta.pageName || "UI 走查报告")}</h1>
<ul>
  <li>版本：${escapeHtml(meta.version || "")}</li>
  <li>走查人：${escapeHtml(meta.reviewer || "")}</li>
  <li>生成时间：${escapeHtml(timestamp)}</li>
  ${meta.notes ? `<li>备注：${escapeHtml(meta.notes)}</li>` : ""}
  <li>问题总数：${issues.length}（高 ${highIssues.length} / 中 ${mediumIssues.length} / 低 ${lowIssues.length}）</li>
</ul>

<h2>问题详情</h2>
${issues.length ? `<table><thead><tr><th>优先级</th><th>问题描述</th><th>截图对比</th></tr></thead><tbody>${rows.join("")}</tbody></table>` : "<p>未识别到明显差异问题。</p>"}

<h2>全局视图</h2>
<table><tr>
  <td><strong>设计稿</strong><br><img src="${designB64}" alt="设计稿"></td>
  <td><strong>开发稿</strong><br><img src="${devB64}" alt="开发稿"></td>
</tr><tr>
  <td colspan="2"><strong>差异热力图</strong><br><img src="${heatB64}" alt="差异热力图"></td>
</tr></table>

<p style="margin-top:24px;font-size:12px;color:#9ca3af;">由 AI UI 走查助手 v2.0.0 自动生成 | ${escapeHtml(timestamp)}</p>
</body></html>`;

  return Buffer.from(html, "utf-8");
}

module.exports = { generateWordReport };
