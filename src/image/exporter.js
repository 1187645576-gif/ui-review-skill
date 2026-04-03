const Jimp = require("jimp");

async function toBase64DataUrl(image, mime) {
  const m = mime || Jimp.MIME_PNG;
  return image.getBase64Async(m);
}

async function toPngBuffer(image) {
  return image.getBufferAsync(Jimp.MIME_PNG);
}

module.exports = { toBase64DataUrl, toPngBuffer };
