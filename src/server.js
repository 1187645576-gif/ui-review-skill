const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { runReview } = require("./cli");

function createServer(port) {
  const app = express();
  const uploadDir = path.join(__dirname, "..", "uploads");

  app.use(cors());
  app.use(express.json());

  const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 80 * 1024 * 1024 },
  });

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, status: "ok", port, timestamp: new Date().toISOString() });
  });

  app.post("/api/review", upload.fields([
    { name: "design", maxCount: 1 },
    { name: "dev", maxCount: 1 },
  ]), async (req, res) => {
    const designFile = req.files?.design?.[0];
    const devFile = req.files?.dev?.[0];

    if (!designFile || !devFile) {
      return res.status(400).json({ success: false, message: "请上传 design 和 dev 两张图片" });
    }

    try {
      const designBuffer = await fs.readFile(designFile.path);
      const devBuffer = await fs.readFile(devFile.path);

      const threshold = Number(req.body?.threshold) || 0.23;
      const minRegion = Number(req.body?.minRegionCells) || 10;

      const result = await runReview({
        designBuffer,
        devBuffer,
        threshold,
        minRegion,
        meta: {
          pageName: req.body?.pageName || "UI 走查报告",
          version: req.body?.version || "",
          reviewer: req.body?.reviewer || "",
          notes: req.body?.notes || "",
        },
      });

      await fs.unlink(designFile.path).catch(() => {});
      await fs.unlink(devFile.path).catch(() => {});

      res.json({
        success: true,
        summary: result.summary,
        issues: result.issues,
        reportHtmlBase64: Buffer.from(result.htmlContent, "utf-8").toString("base64"),
        reportWordBase64: result.wordContent.toString("base64"),
      });
    } catch (error) {
      await fs.unlink(designFile.path).catch(() => {});
      await fs.unlink(devFile.path).catch(() => {});
      res.status(500).json({ success: false, message: error.message || "分析失败" });
    }
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, message: "文件过大，请压缩到 80MB 以内" });
    }
    res.status(500).json({ success: false, message: error.message || "服务内部错误" });
  });

  return app;
}

function startServer(port) {
  const p = port || Number(process.env.PORT) || 3001;
  const app = createServer(p);
  app.listen(p, () => {
    console.log(`UI 走查 API 已启动：http://127.0.0.1:${p}`);
    console.log(`POST /api/review  - 上传 design + dev 图片进行走查`);
    console.log(`GET  /api/health  - 健康检查`);
  });
}

module.exports = { createServer, startServer };
