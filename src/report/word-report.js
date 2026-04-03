const { toBase64DataUrl } = require("../image/exporter");
const { escapeHtml, severityText, formatDate } = require("./utils");
const { ISSUE_TITLE_MAP } = require("../core/constants");

const WORD_CSS = `
body { font-family: "Microsoft YaHei","Segoe UI",sans-serif; padding: 24px; color: #10233f; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { border: 1px solid #cfd9e6; padding: 10px; vertical-align: top; }
th { background: #eef5ff; text-align: left; }
img { max-width: 260px; border-radius: 8px; border: 1px solid #dbe6f4; }
ul { margin: 0 0 16px 18px; }
h1, h2, h3, p { margin: 0 0 12px; }
span { font-size: 12px; color: #567; }
.badge-high { color: #b91c1c; font-weight: bold; }
.badge-medium { color: #92400e; font-weight: bold; }
.badge-low { color: #1e40af; font-weight: bold; }
.page-tag { color: #6b7280; font-size: 12px; }
`;

const TYPE_ORDER = ["color", "font", "spacing", "radius", "layout"];

async function generateWordReport(data, meta) {
  const { pages } = data;
  const timestamp = formatDate();
  const isMultiPage = pages.length > 1;

  const allIssues = pages.flatMap((p) => p.issues);
  const highCount = allIssues.filter((i) => i.severity === "high").length;
  const mediumCount = allIssues.filter((i) => i.severity === "medium").length;
  const lowCount = allIssues.filter((i) => i.severity === "low").length;

  // 按类型分组
  const issuesByType = {};
  TYPE_ORDER.forEach((t) => { issuesByType[t] = []; });
  allIssues.forEach((issue) => {
    if (!issuesByType[issue.type]) issuesByType[issue.type] = [];
    issuesByType[issue.type].push(issue);
  });

  // 各类型问题表格
  const typeTables = [];
  for (const type of TYPE_ORDER) {
    const typeIssues = issuesByType[type];
    if (!typeIssues.length) continue;

    const typeName = ISSUE_TITLE_MAP[type] || type;
    const rows = [];
    for (const issue of typeIssues) {
      const designCropB64 = await toBase64DataUrl(issue.designCrop);
      const devCropB64 = await toBase64DataUrl(issue.devCrop);
      const badgeClass = `badge-${issue.severity}`;
      const pageTag = isMultiPage ? `<br><span class="page-tag">来源：${escapeHtml(issue.pageName || "")}</span>` : "";
      rows.push(`<tr>
        <td><span class="${badgeClass}">${severityText(issue.severity)}</span></td>
        <td><strong>${escapeHtml(issue.title)}</strong><br>${escapeHtml(issue.summary)}${pageTag}</td>
        <td><img src="${designCropB64}" alt="设计稿"><br><img src="${devCropB64}" alt="开发稿"></td>
      </tr>`);
    }

    typeTables.push(`<h2>${escapeHtml(typeName)}（${typeIssues.length} 个）</h2>
    <table><thead><tr><th>优先级</th><th>问题描述</th><th>截图对比</th></tr></thead><tbody>${rows.join("")}</tbody></table>`);
  }

  // 全局视图
  const pageViews = [];
  for (const page of pages) {
    const dB64 = await toBase64DataUrl(page.designImage);
    const vB64 = await toBase64DataUrl(page.devImage);
    const hB64 = await toBase64DataUrl(page.heatMapImage);
    const pageTitle = isMultiPage ? page.pageName || "页面" : "全局视图";
    pageViews.push(`<h3>${escapeHtml(pageTitle)}</h3>
    <table><tr>
      <td><strong>设计稿</strong><br><img src="${dB64}" alt="设计稿"></td>
      <td><strong>开发稿</strong><br><img src="${vB64}" alt="开发稿"></td>
    </tr><tr>
      <td colspan="2"><strong>差异热力图</strong><br><img src="${hB64}" alt="热力图"></td>
    </tr></table>`);
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
  <li>问题总数：${allIssues.length}（高 ${highCount} / 中 ${mediumCount} / 低 ${lowCount}）</li>
  ${isMultiPage ? `<li>走查页面数：${pages.length}</li>` : ""}
</ul>

${typeTables.length ? typeTables.join("\n") : "<p>未识别到明显差异问题。</p>"}

<h2>各页面全局视图</h2>
${pageViews.join("\n")}

<p style="margin-top:24px;font-size:12px;color:#9ca3af;">由 AI UI 走查助手 v2.1.0 自动生成 | ${escapeHtml(timestamp)}</p>
</body></html>`;

  return Buffer.from(html, "utf-8");
}

module.exports = { generateWordReport };
