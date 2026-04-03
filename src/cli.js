const fs = require("fs").promises;
const path = require("path");
const { loadImage } = require("./image/loader");
const { normalizeImages } = require("./image/normalizer");
const { computeDiffGrid } = require("./core/pixel-diff");
const { buildIssues } = require("./core/issue-detector");
const { buildHeatMap } = require("./core/heat-map");
const { buildOverlay } = require("./core/overlay");
const { buildIssueAssets } = require("./core/issue-assets");
const { generateHtmlReport } = require("./report/html-report");
const { generateWordReport } = require("./report/word-report");
const {
  DEFAULT_THRESHOLD,
  DEFAULT_MIN_REGION_CELLS,
  DEFAULT_HEAT_OPACITY,
  DEFAULT_OVERLAY_OPACITY,
} = require("./core/constants");

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".bmp", ".gif"];

function parseArgs(argv) {
  const args = {
    design: null,
    dev: null,
    designDir: null,
    devDir: null,
    output: "./ui-review-output",
    threshold: DEFAULT_THRESHOLD,
    minRegion: DEFAULT_MIN_REGION_CELLS,
    pageName: "UI 走查报告",
    version: "",
    reviewer: "",
    notes: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === "--design" && val) { args.design = val; i += 1; }
    else if (key === "--dev" && val) { args.dev = val; i += 1; }
    else if (key === "--design-dir" && val) { args.designDir = val; i += 1; }
    else if (key === "--dev-dir" && val) { args.devDir = val; i += 1; }
    else if (key === "--output" && val) { args.output = val; i += 1; }
    else if (key === "--threshold" && val) { args.threshold = Number(val); i += 1; }
    else if (key === "--min-region" && val) { args.minRegion = Number(val); i += 1; }
    else if (key === "--page-name" && val) { args.pageName = val; i += 1; }
    else if (key === "--version" && val) { args.version = val; i += 1; }
    else if (key === "--reviewer" && val) { args.reviewer = val; i += 1; }
    else if (key === "--notes" && val) { args.notes = val; i += 1; }
  }

  return args;
}

async function listImages(dirPath) {
  const entries = await fs.readdir(dirPath);
  return entries
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort();
}

async function runSingleReview(options) {
  const {
    designPath, devPath,
    designBuffer, devBuffer,
    threshold = DEFAULT_THRESHOLD,
    minRegion = DEFAULT_MIN_REGION_CELLS,
    heatOpacity = DEFAULT_HEAT_OPACITY,
    overlayOpacity = DEFAULT_OVERLAY_OPACITY,
    pageName = "",
  } = options;

  const designRaw = designBuffer ? (await require("jimp").read(designBuffer)) : (await loadImage(designPath));
  const devRaw = devBuffer ? (await require("jimp").read(devBuffer)) : (await loadImage(devPath));

  const normalized = normalizeImages(designRaw, devRaw);
  const diffGrid = computeDiffGrid(normalized.designImage, normalized.devImage, normalized.width, normalized.height);

  const issues = buildIssues(diffGrid, normalized.width, normalized.height, threshold, minRegion);
  issues.forEach((issue) => {
    const assets = buildIssueAssets(normalized.designImage, normalized.devImage, issue);
    Object.assign(issue, assets);
    issue.pageName = pageName;
  });

  const heatMapImage = buildHeatMap(normalized.devImage, diffGrid, heatOpacity, threshold);
  const overlayImage = buildOverlay(normalized.designImage, normalized.devImage, overlayOpacity);

  return {
    pageName,
    issues,
    designImage: normalized.designImage,
    devImage: normalized.devImage,
    heatMapImage,
    overlayImage,
    width: normalized.width,
    height: normalized.height,
  };
}

async function runReview(options) {
  const {
    designPath, devPath,
    designBuffer, devBuffer,
    threshold = DEFAULT_THRESHOLD,
    minRegion = DEFAULT_MIN_REGION_CELLS,
    heatOpacity = DEFAULT_HEAT_OPACITY,
    overlayOpacity = DEFAULT_OVERLAY_OPACITY,
    meta = {},
  } = options;

  console.log("[1/6] 加载图片...");
  const result = await runSingleReview({
    designPath, devPath, designBuffer, devBuffer,
    threshold, minRegion, heatOpacity, overlayOpacity,
    pageName: meta.pageName || "UI 走查报告",
  });

  console.log("[2/6] 归一化尺寸...");
  console.log("[3/6] 计算像素差异...");
  console.log("[4/6] 检测问题区域...");
  console.log("[5/6] 生成可视化图...");
  console.log("[6/6] 生成报告...");

  const reportMeta = {
    pageName: meta.pageName || "UI 走查报告",
    version: meta.version || "",
    reviewer: meta.reviewer || "",
    notes: meta.notes || "",
    threshold,
  };

  const htmlContent = await generateHtmlReport({ pages: [result] }, reportMeta);
  const wordContent = await generateWordReport({ pages: [result] }, reportMeta);

  const { issues } = result;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  return {
    htmlContent,
    wordContent,
    summary: { totalIssues: issues.length, highCount, mediumCount, lowCount },
    issues: issues.map((i) => ({
      id: i.id, type: i.type, severity: i.severity,
      title: i.title, summary: i.summary, bbox: i.bbox, score: i.score,
    })),
  };
}

async function runBatchReview(options) {
  const {
    pairs,
    threshold = DEFAULT_THRESHOLD,
    minRegion = DEFAULT_MIN_REGION_CELLS,
    heatOpacity = DEFAULT_HEAT_OPACITY,
    overlayOpacity = DEFAULT_OVERLAY_OPACITY,
    meta = {},
  } = options;

  const pages = [];
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i];
    console.log(`[${i + 1}/${pairs.length}] 正在走查：${pair.name}...`);
    const result = await runSingleReview({
      designPath: pair.designPath,
      devPath: pair.devPath,
      threshold, minRegion, heatOpacity, overlayOpacity,
      pageName: pair.name,
    });
    pages.push(result);
  }

  console.log("[合并] 生成合并报告...");
  const reportMeta = {
    pageName: meta.pageName || "UI 走查报告",
    version: meta.version || "",
    reviewer: meta.reviewer || "",
    notes: meta.notes || "",
    threshold,
  };

  const htmlContent = await generateHtmlReport({ pages }, reportMeta);
  const wordContent = await generateWordReport({ pages }, reportMeta);

  const allIssues = pages.flatMap((p) => p.issues);
  const highCount = allIssues.filter((i) => i.severity === "high").length;
  const mediumCount = allIssues.filter((i) => i.severity === "medium").length;
  const lowCount = allIssues.filter((i) => i.severity === "low").length;

  return {
    htmlContent,
    wordContent,
    summary: { totalIssues: allIssues.length, highCount, mediumCount, lowCount },
    issues: allIssues.map((i) => ({
      id: i.id, type: i.type, severity: i.severity,
      title: i.title, summary: i.summary, bbox: i.bbox, score: i.score,
      pageName: i.pageName,
    })),
  };
}

async function runCli(argv) {
  const args = parseArgs(argv);

  if (args.designDir && args.devDir) {
    const designFiles = await listImages(path.resolve(args.designDir));
    const devFiles = await listImages(path.resolve(args.devDir));

    if (!designFiles.length || !devFiles.length) {
      console.log("设计稿或开发稿文件夹中没有找到图片文件。");
      process.exit(1);
    }

    const pairs = [];
    for (let i = 0; i < Math.min(designFiles.length, devFiles.length); i += 1) {
      pairs.push({
        name: path.basename(designFiles[i], path.extname(designFiles[i])),
        designPath: path.join(path.resolve(args.designDir), designFiles[i]),
        devPath: path.join(path.resolve(args.devDir), devFiles[i]),
      });
    }

    console.log(`找到 ${pairs.length} 组图片，开始批量走查...\n`);
    const result = await runBatchReview({
      pairs,
      threshold: args.threshold,
      minRegion: args.minRegion,
      meta: {
        pageName: args.pageName,
        version: args.version,
        reviewer: args.reviewer,
        notes: args.notes,
      },
    });

    await fs.mkdir(args.output, { recursive: true });
    const htmlPath = path.join(args.output, "report.html");
    const wordPath = path.join(args.output, "report.doc");
    await fs.writeFile(htmlPath, result.htmlContent, "utf-8");
    await fs.writeFile(wordPath, result.wordContent);

    console.log("");
    console.log("=== 批量走查完成 ===");
    console.log(`走查页面数：${pairs.length}`);
    console.log(`总问题数：${result.summary.totalIssues}`);
    console.log(`  高：${result.summary.highCount}  中：${result.summary.mediumCount}  低：${result.summary.lowCount}`);
    console.log(`HTML 报告：${htmlPath}`);
    console.log(`Word 报告：${wordPath}`);
    return;
  }

  if (!args.design || !args.dev) {
    console.log(`
用法：node src/index.js --design <设计稿> --dev <开发稿> [选项]
      node src/index.js --design-dir <设计稿目录> --dev-dir <开发稿目录> [选项]

单组走查：
  --design <path>      设计稿图片路径
  --dev <path>         开发稿图片路径

批量走查（按文件名顺序配对，合并为一份报告）：
  --design-dir <dir>   设计稿文件夹
  --dev-dir <dir>      开发稿文件夹

可选：
  --output <dir>       输出目录（默认 ./ui-review-output）
  --threshold <n>      检测灵敏度 0-1（默认 0.23）
  --min-region <n>     最小问题区域格数（默认 10）
  --page-name <name>   报告页面名称
  --version <ver>      版本号
  --reviewer <name>    走查人员
  --notes <text>       备注

示例：
  node src/index.js --design design.png --dev dev.png --output ./report
  node src/index.js --design-dir ./设计稿 --dev-dir ./测试图 --output ./report
`);
    process.exit(1);
  }

  const result = await runReview({
    designPath: path.resolve(args.design),
    devPath: path.resolve(args.dev),
    threshold: args.threshold,
    minRegion: args.minRegion,
    meta: {
      pageName: args.pageName,
      version: args.version,
      reviewer: args.reviewer,
      notes: args.notes,
    },
  });

  await fs.mkdir(args.output, { recursive: true });
  const htmlPath = path.join(args.output, "report.html");
  const wordPath = path.join(args.output, "report.doc");
  await fs.writeFile(htmlPath, result.htmlContent, "utf-8");
  await fs.writeFile(wordPath, result.wordContent);

  console.log("");
  console.log("=== 走查完成 ===");
  console.log(`总问题数：${result.summary.totalIssues}`);
  console.log(`  高：${result.summary.highCount}  中：${result.summary.mediumCount}  低：${result.summary.lowCount}`);
  console.log(`HTML 报告：${htmlPath}`);
  console.log(`Word 报告：${wordPath}`);
}

module.exports = { runReview, runBatchReview, runCli };
