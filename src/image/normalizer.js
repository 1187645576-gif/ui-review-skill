const Jimp = require("jimp");
const { MAX_WIDTH, MAX_HEIGHT, MIN_WIDTH, MIN_HEIGHT } = require("../core/constants");

function normalizeImages(designImage, devImage) {
  const width = Math.max(MIN_WIDTH, Math.round(Math.min(
    designImage.bitmap.width,
    devImage.bitmap.width,
    MAX_WIDTH
  )));

  const designScale = width / designImage.bitmap.width;
  const devScale = width / devImage.bitmap.width;
  const height = Math.max(MIN_HEIGHT, Math.round(Math.min(
    designImage.bitmap.height * designScale,
    devImage.bitmap.height * devScale,
    MAX_HEIGHT
  )));

  const design = new Jimp(width, height, 0xFFFFFFFF);
  const dev = new Jimp(width, height, 0xFFFFFFFF);

  const designResized = designImage.clone().resize(width, Math.round(designImage.bitmap.height * designScale));
  const devResized = devImage.clone().resize(width, Math.round(devImage.bitmap.height * devScale));

  design.composite(designResized, 0, 0);
  dev.composite(devResized, 0, 0);

  return { width, height, designImage: design, devImage: dev };
}

module.exports = { normalizeImages };
