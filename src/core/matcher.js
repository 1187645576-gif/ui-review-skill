const Jimp = require("jimp");

async function buildFeature(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const aspect = width / Math.max(height, 1);

  // 放大到 192x192，采样间隔 2px → 96x96=9216 个采样点（原来 576 个的 16 倍）
  const thumb = image.clone().contain(192, 192, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);

  const vector = [];
  for (let y = 0; y < 192; y += 2) {
    for (let x = 0; x < 192; x += 2) {
      const rgba = Jimp.intToRGBA(thumb.getPixelColor(x, y));
      vector.push(rgba.r / 255, rgba.g / 255, rgba.b / 255);
    }
  }

  // 额外提取颜色直方图特征（增强区分度）
  const histogram = new Float32Array(48); // 16 bins × 3 channels
  const { data } = thumb.bitmap;
  const totalPixels = 192 * 192;
  for (let i = 0; i < data.length; i += 4) {
    const rBin = Math.min(15, Math.floor(data[i] / 16));
    const gBin = Math.min(15, Math.floor(data[i + 1] / 16));
    const bBin = Math.min(15, Math.floor(data[i + 2] / 16));
    histogram[rBin] += 1;
    histogram[16 + gBin] += 1;
    histogram[32 + bBin] += 1;
  }
  // 归一化
  for (let i = 0; i < 48; i += 1) {
    histogram[i] /= totalPixels;
  }

  return { vector, aspect, histogram };
}

function compareFeatures(a, b) {
  // 像素相似度
  let diff = 0;
  for (let i = 0; i < a.vector.length; i += 1) {
    diff += Math.abs(a.vector[i] - b.vector[i]);
  }
  const normalized = diff / Math.max(a.vector.length, 1);
  const pixelSimilarity = Math.max(0, 1 - normalized);

  // 颜色直方图相似度（直方图交叉法）
  let histOverlap = 0;
  if (a.histogram && b.histogram) {
    for (let i = 0; i < a.histogram.length; i += 1) {
      histOverlap += Math.min(a.histogram[i], b.histogram[i]);
    }
    histOverlap = histOverlap / 3; // 归一化到 0-1
  }

  // 宽高比惩罚
  const aspectPenalty = Math.max(0, 1 - Math.min(Math.abs(Math.log((a.aspect || 1) / (b.aspect || 1))), 1.1));

  // 综合得分：像素 55% + 直方图 30% + 宽高比 15%
  return pixelSimilarity * 0.55 + histOverlap * 0.30 + aspectPenalty * 0.15;
}

async function autoMatchPairs(designImages, devImages) {
  const designFeatures = [];
  for (const item of designImages) {
    const feature = await buildFeature(item.image);
    designFeatures.push({ ...item, feature });
  }

  const devFeatures = [];
  for (const item of devImages) {
    const feature = await buildFeature(item.image);
    devFeatures.push({ ...item, feature });
  }

  // 计算全部得分矩阵，用匈牙利算法思路贪心匹配
  const scoreMatrix = [];
  for (const design of designFeatures) {
    for (const dev of devFeatures) {
      scoreMatrix.push({
        design,
        dev,
        score: compareFeatures(design.feature, dev.feature),
      });
    }
  }

  // 按得分降序，贪心选最优配对
  scoreMatrix.sort((a, b) => b.score - a.score);
  const usedDesign = new Set();
  const usedDev = new Set();
  const pairs = [];

  for (const entry of scoreMatrix) {
    if (usedDesign.has(entry.design.path) || usedDev.has(entry.dev.path)) continue;
    usedDesign.add(entry.design.path);
    usedDev.add(entry.dev.path);
    pairs.push({
      name: entry.design.name,
      designPath: entry.design.path,
      devPath: entry.dev.path,
      devName: entry.dev.name,
      matchScore: entry.score,
    });
  }

  return pairs.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { buildFeature, compareFeatures, autoMatchPairs };
