const { toBase64DataUrl } = require("../image/exporter");
const { escapeHtml, severityText, formatDate } = require("./utils");
const { ISSUE_TITLE_MAP } = require("../core/constants");

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
.type-section { margin-bottom: 32px; }
.type-section h2 { font-size: 18px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
.type-count { font-size: 14px; color: #9ca3af; font-weight: normal; margin-left: 8px; }
.issue-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #fff; }
.issue-card.card-high { border-left: 4px solid #ef4444; }
.issue-card.card-medium { border-left: 4px solid #f59e0b; }
.issue-card.card-low { border-left: 4px solid #3b82f6; }
.issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.issue-index { font-weight: 700; color: #374151; }
.badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.page-badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; background: #f3f4f6; color: #6b7280; }
.issue-title { font-size: 16px; }
.issue-summary { font-size: 14px; color: #4b5563; margin-bottom: 10px; }
.issue-meta { display: flex; gap: 16px; font-size: 12px; color: #9ca3af; margin-bottom: 12px; flex-wrap: wrap; }
.comparison-row { display: flex; gap: 12px; flex-wrap: wrap; }
.comparison-row > div > h4 { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.comparison-row img { max-width: 280px; border-radius: 6px; border: 1px solid #e5e7eb; }
.page-overview { margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
.page-overview h3 { font-size: 16px; margin-bottom: 12px; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.overview-item h4 { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.overview-item img { width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
.footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
@media print { body { padding: 16px; } .page-overview { break-inside: avoid; } .issue-card { break-inside: avoid; } }
`;

const TYPE_ORDER = ["color", "font", "spacing", "radius", "layout"];
const TYPE_ICON = { color: "\uD83C\uDFA8", font: "\uD83D\uDD24", spacing: "\uD83D\uDCCF", radius: "\u2B55", layout: "\uD83D\uDCDA" };

async function generateHtmlReport(data, meta) {
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

  // 生成按类型分组的问题卡片
  const typeSectionsHtml = [];
  let globalIndex = 0;
  for (const type of TYPE_ORDER) {
    const typeIssues = issuesByType[type];
    if (!typeIssues.length) continue;

    const icon = TYPE_ICON[type] || "";
    const typeName = ISSUE_TITLE_MAP[type] || type;
    typeSectionsHtml.push(`<div class="type-section"><h2>${icon} ${escapeHtml(typeName)}<span class="type-count">${typeIssues.length} 个问题</span></h2>`);

    for (const issue of typeIssues) {
      globalIndex += 1;
      const designCropB64 = await toBase64DataUrl(issue.designCrop);
      const devCropB64 = await toBase64DataUrl(issue.devCrop);
      const severityCls = `card-${issue.severity}`;
      const badgeCls = `severity-${issue.severity}`;

      typeSectionsHtml.push(`
        <div class="issue-card ${severityCls}">
          <div class="issue-header">
            <span class="issue-index">#${globalIndex}</span>
            <span class="badge ${badgeCls}">${severityText(issue.severity)}</span>
            ${isMultiPage ? `<span class="page-badge">${escapeHtml(issue.pageName || "")}</span>` : ""}
            <strong class="issue-title">${escapeHtml(issue.title)}</strong>
          </div>
          <p class="issue-summary">${escapeHtml(issue.summary)}</p>
          <div class="issue-meta">
            <span>\u533A\u57DF\uFF1A${issue.bbox.w} \u00D7 ${issue.bbox.h}</span>
            <span>\u5DEE\u5F02\u5F3A\u5EA6\uFF1A${Math.round(issue.score * 100)}%</span>
            <span>\u4F4D\u7F6E\uFF1A(${issue.bbox.x}, ${issue.bbox.y})</span>
          </div>
          <div class="comparison-row">
            <div><h4>\u8BBE\u8BA1\u7A3F\u5C40\u90E8</h4><img src="${designCropB64}" alt="\u8BBE\u8BA1\u7A3F\u5C40\u90E8"></div>
            <div><h4>\u5F00\u53D1\u7A3F\u5C40\u90E8</h4><img src="${devCropB64}" alt="\u5F00\u53D1\u7A3F\u5C40\u90E8"></div>
          </div>
        </div>`);
    }
    typeSectionsHtml.push("</div>");
  }

  // 生成各页面的全局视图
  const pageOverviewsHtml = [];
  for (const page of pages) {
    const dB64 = await toBase64DataUrl(page.designImage);
    const vB64 = await toBase64DataUrl(page.devImage);
    const hB64 = await toBase64DataUrl(page.heatMapImage);
    const oB64 = await toBase64DataUrl(page.overlayImage);
    const pageTitle = isMultiPage ? page.pageName || "页面" : "全局视图";

    pageOverviewsHtml.push(`
      <div class="page-overview">
        <h3>${escapeHtml(pageTitle)}</h3>
        <div class="overview-grid">
          <div class="overview-item"><h4>\u8BBE\u8BA1\u7A3F</h4><img src="${dB64}" alt="\u8BBE\u8BA1\u7A3F"></div>
          <div class="overview-item"><h4>\u5F00\u53D1\u7A3F</h4><img src="${vB64}" alt="\u5F00\u53D1\u7A3F"></div>
          <div class="overview-item"><h4>\u5DEE\u5F02\u70ED\u529B\u56FE</h4><img src="${hB64}" alt="\u5DEE\u5F02\u70ED\u529B\u56FE"></div>
          <div class="overview-item"><h4>\u91CD\u53E0\u5BF9\u6BD4</h4><img src="${oB64}" alt="\u91CD\u53E0\u5BF9\u6BD4"></div>
        </div>
      </div>`);
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.pageName || "UI \u8D70\u67E5\u62A5\u544A")}</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <header class="report-header">
    <h1>${escapeHtml(meta.pageName || "UI \u8D70\u67E5\u62A5\u544A")}</h1>
    <div class="meta-grid">
      <div><strong>\u7248\u672C\uFF1A</strong>${escapeHtml(meta.version || "")}</div>
      <div><strong>\u8D70\u67E5\u4EBA\u5458\uFF1A</strong>${escapeHtml(meta.reviewer || "")}</div>
      <div><strong>\u751F\u6210\u65F6\u95F4\uFF1A</strong>${escapeHtml(timestamp)}</div>
      <div><strong>\u68C0\u6D4B\u7075\u654F\u5EA6\uFF1A</strong>${meta.threshold || 0.23}</div>
      ${isMultiPage ? `<div><strong>\u8D70\u67E5\u9875\u9762\u6570\uFF1A</strong>${pages.length}</div>` : ""}
    </div>
    ${meta.notes ? `<p style="margin-top:8px;font-size:14px;color:#6b7280;">\u5907\u6CE8\uFF1A${escapeHtml(meta.notes)}</p>` : ""}
  </header>

  <section class="summary-section">
    <h2>\u8D70\u67E5\u603B\u7ED3</h2>
    <div class="summary-bar">
      <div class="stat">\u603B\u95EE\u9898\u6570\uFF1A<strong>${allIssues.length}</strong></div>
      <div class="stat severity-high">\u9AD8\u4F18\u5148\u7EA7\uFF1A<strong>${highCount}</strong></div>
      <div class="stat severity-medium">\u4E2D\u4F18\u5148\u7EA7\uFF1A<strong>${mediumCount}</strong></div>
      <div class="stat severity-low">\u4F4E\u4F18\u5148\u7EA7\uFF1A<strong>${lowCount}</strong></div>
    </div>
  </section>

  ${typeSectionsHtml.join("\n")}

  ${allIssues.length === 0 ? "<p>\u672A\u8BC6\u522B\u5230\u660E\u663E\u5DEE\u5F02\u95EE\u9898\u3002</p>" : ""}

  <h2 style="font-size:18px;margin:32px 0 16px;padding-bottom:6px;border-bottom:2px solid #e5e7eb;">\u5404\u9875\u9762\u5168\u5C40\u89C6\u56FE</h2>
  ${pageOverviewsHtml.join("\n")}

  <footer class="footer">
    <p>\u7531 AI UI \u8D70\u67E5\u52A9\u624B v2.1.0 \u81EA\u52A8\u751F\u6210 | ${escapeHtml(timestamp)}</p>
  </footer>
</body>
</html>`;

  return html;
}

module.exports = { generateHtmlReport };
