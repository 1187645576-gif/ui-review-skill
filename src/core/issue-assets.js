const Jimp = require("jimp");
const { CROP_WIDTH, CROP_HEIGHT, CROP_PAD } = require("./constants");

function drawRect(image, x, y, w, h, hexColor, lineWidth) {
  const color = Jimp.cssColorToHex(hexColor);
  const bw = image.bitmap.width;
  const bh = image.bitmap.height;

  for (let i = 0; i < lineWidth; i += 1) {
    for (let px = x; px < Math.min(x + w, bw); px += 1) {
      if (y + i >= 0 && y + i < bh) image.setPixelColor(color, px, y + i);
      if (y + h - 1 - i >= 0 && y + h - 1 - i < bh) image.setPixelColor(color, px, y + h - 1 - i);
    }
    for (let py = y; py < Math.min(y + h, bh); py += 1) {
      if (x + i >= 0 && x + i < bw) image.setPixelColor(color, x + i, py);
      if (x + w - 1 - i >= 0 && x + w - 1 - i < bw) image.setPixelColor(color, x + w - 1 - i, py);
    }
  }
}

function buildCropImage(sourceImage, cropBox, highlightBox, accentColor) {
  const canvas = new Jimp(CROP_WIDTH, CROP_HEIGHT, 0xFFFFFFFF);

  const cropped = sourceImage.clone().crop(
    cropBox.x, cropBox.y,
    Math.min(cropBox.w, sourceImage.bitmap.width - cropBox.x),
    Math.min(cropBox.h, sourceImage.bitmap.height - cropBox.y)
  );

  const scale = Math.min(CROP_WIDTH / cropBox.w, CROP_HEIGHT / cropBox.h);
  const drawWidth = Math.round(cropBox.w * scale);
  const drawHeight = Math.round(cropBox.h * scale);
  cropped.resize(drawWidth, drawHeight);

  const dx = Math.round((CROP_WIDTH - drawWidth) / 2);
  const dy = Math.round((CROP_HEIGHT - drawHeight) / 2);
  canvas.composite(cropped, dx, dy);

  const rx = Math.round(dx + (highlightBox.x - cropBox.x) * scale);
  const ry = Math.round(dy + (highlightBox.y - cropBox.y) * scale);
  const rw = Math.round(highlightBox.w * scale);
  const rh = Math.round(highlightBox.h * scale);
  drawRect(canvas, rx, ry, rw, rh, accentColor, 3);

  return canvas;
}

function buildIssueAssets(designImage, devImage, issue) {
  const pad = CROP_PAD;
  const imgW = designImage.bitmap.width;
  const imgH = designImage.bitmap.height;

  const cropBox = {
    x: Math.max(0, issue.bbox.x - pad),
    y: Math.max(0, issue.bbox.y - pad),
    w: Math.min(imgW - Math.max(0, issue.bbox.x - pad), issue.bbox.w + pad * 2),
    h: Math.min(imgH - Math.max(0, issue.bbox.y - pad), issue.bbox.h + pad * 2),
  };

  const designCrop = buildCropImage(designImage, cropBox, issue.bbox, "#67b7ff");
  const devCrop = buildCropImage(devImage, cropBox, issue.bbox, "#ff7a7a");

  return { cropBox, designCrop, devCrop };
}

module.exports = { buildIssueAssets, buildCropImage, drawRect };
