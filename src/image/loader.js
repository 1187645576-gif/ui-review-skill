const Jimp = require("jimp");

async function loadImage(filePath) {
  return Jimp.read(filePath);
}

async function loadImageFromBuffer(buffer) {
  return Jimp.read(buffer);
}

module.exports = { loadImage, loadImageFromBuffer };
