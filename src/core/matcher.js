const Jimp = require("jimp");

async function buildFeature(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const aspect = width / Math.max(height, 1);
  const thumb = image.clone().contain(96, 96, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);

  const vector = [];
  for (let y = 0; y < 96; y += 4) {
    for (let x = 0; x < 96; x += 4) {
      const rgba = Jimp.intToRGBA(thumb.getPixelColor(x, y));
      vector.push(rgba.r / 255, rgba.g / 255, rgba.b / 255);
    }
  }

  return { vector, aspect };
}

function compareFeatures(a, b) {
  let diff = 0;
  for (let i = 0; i < a.vector.length; i += 1) {
    diff += Math.abs(a.vector[i] - b.vector[i]);
  }
  const normalized = diff / Math.max(a.vector.length, 1);
  const similarity = Math.max(0, 1 - normalized);
  const aspectPenalty = Math.max(0, 1 - Math.min(Math.abs(Math.log((a.aspect || 1) / (b.aspect || 1))), 1.1));
  return similarity * 0.82 + aspectPenalty * 0.18;
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

  const usedDev = new Set();
  const pairs = [];

  for (const design of designFeatures) {
    let bestScore = -1;
    let bestDev = null;

    for (const dev of devFeatures) {
      if (usedDev.has(dev.path)) continue;
      const score = compareFeatures(design.feature, dev.feature);
      if (score > bestScore) {
        bestScore = score;
        bestDev = dev;
      }
    }

    if (bestDev) {
      usedDev.add(bestDev.path);
      pairs.push({
        name: design.name,
        designPath: design.path,
        devPath: bestDev.path,
        devName: bestDev.name,
        matchScore: bestScore,
      });
    }
  }

  return pairs.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { buildFeature, compareFeatures, autoMatchPairs };
