const Jimp = require("jimp");
const { CELL_SIZE, HEAT_COLOR } = require("./constants");

function buildHeatMap(devImage, diffGrid, heatOpacity, threshold) {
  const image = devImage.clone();
  const { data } = image.bitmap;
  const width = image.bitmap.width;
  const minScore = Math.max(0.16, threshold * 0.8);

  for (let row = 0; row < diffGrid.rows; row += 1) {
    for (let col = 0; col < diffGrid.cols; col += 1) {
      const score = diffGrid.scores[row * diffGrid.cols + col];
      if (score < minScore) continue;

      const alpha = Math.min(heatOpacity, score * 1.4);
      const startX = col * CELL_SIZE;
      const startY = row * CELL_SIZE;
      const endX = Math.min(width, startX + CELL_SIZE);
      const endY = Math.min(image.bitmap.height, startY + CELL_SIZE);

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const idx = (y * width + x) * 4;
          data[idx] = Math.round(data[idx] * (1 - alpha) + HEAT_COLOR.r * alpha);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha) + HEAT_COLOR.g * alpha);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha) + HEAT_COLOR.b * alpha);
        }
      }
    }
  }

  return image;
}

module.exports = { buildHeatMap };
