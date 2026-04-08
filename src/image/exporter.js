const Jimp = require("jimp");

async function toBase64DataUrl(image, mime) {
  const m = mime || Jimp.MIME_JPEG;
  if (m === Jimp.MIME_JPEG) {
    const img = image.clone().quality(75);
    return img.getBase64Async(Jimp.MIME_JPEG);
  }
  return image.getBase64Async(m);
}

async function toPngBuffer(image) {
  return image.getBufferAsync(Jimp.MIME_PNG);
}

module.exports = { toBase64DataUrl, toPngBuffer };
