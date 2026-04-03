function buildOverlay(designImage, devImage, overlayOpacity) {
  const image = designImage.clone();
  const srcData = devImage.bitmap.data;
  const dstData = image.bitmap.data;
  const len = Math.min(srcData.length, dstData.length);

  for (let i = 0; i < len; i += 4) {
    dstData[i] = Math.round(dstData[i] * (1 - overlayOpacity) + srcData[i] * overlayOpacity);
    dstData[i + 1] = Math.round(dstData[i + 1] * (1 - overlayOpacity) + srcData[i + 1] * overlayOpacity);
    dstData[i + 2] = Math.round(dstData[i + 2] * (1 - overlayOpacity) + srcData[i + 2] * overlayOpacity);
  }

  return image;
}

module.exports = { buildOverlay };
