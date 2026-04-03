const { CELL_SIZE, RGB_WEIGHT, LUM_WEIGHT } = require("./constants");

function pixelDiff(a, b, index) {
  const dr = Math.abs(a[index] - b[index]) / 255;
  const dg = Math.abs(a[index + 1] - b[index + 1]) / 255;
  const db = Math.abs(a[index + 2] - b[index + 2]) / 255;
  const lumA = (a[index] * 0.299 + a[index + 1] * 0.587 + a[index + 2] * 0.114) / 255;
  const lumB = (b[index] * 0.299 + b[index + 1] * 0.587 + b[index + 2] * 0.114) / 255;
  return ((dr + dg + db) / 3) * RGB_WEIGHT + Math.abs(lumA - lumB) * LUM_WEIGHT;
}

function computeDiffGrid(designImage, devImage, width, height) {
  const designData = designImage.bitmap.data;
  const devData = devImage.bitmap.data;
  const cols = Math.ceil(width / CELL_SIZE);
  const rows = Math.ceil(height / CELL_SIZE);
  const scores = new Float32Array(cols * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let total = 0;
      let count = 0;
      const startX = col * CELL_SIZE;
      const startY = row * CELL_SIZE;
      const endX = Math.min(width, startX + CELL_SIZE);
      const endY = Math.min(height, startY + CELL_SIZE);
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          total += pixelDiff(designData, devData, (y * width + x) * 4);
          count += 1;
        }
      }
      scores[row * cols + col] = count ? total / count : 0;
    }
  }

  return { width, height, cols, rows, scores: smoothScores(scores, cols, rows) };
}

function smoothScores(scores, cols, rows) {
  const result = new Float32Array(scores.length);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let total = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = col + dx;
          const ny = row + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          total += scores[ny * cols + nx];
          count += 1;
        }
      }
      result[row * cols + col] = total / Math.max(count, 1);
    }
  }
  return result;
}

module.exports = { pixelDiff, computeDiffGrid, smoothScores };
