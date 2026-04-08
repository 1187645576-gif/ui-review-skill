const CELL_SIZE = 8;
const DEFAULT_THRESHOLD = 0.30;
const DEFAULT_MIN_REGION_CELLS = 10;
const DEFAULT_HEAT_OPACITY = 0.72;
const DEFAULT_OVERLAY_OPACITY = 0.45;
const RGB_WEIGHT = 0.72;
const LUM_WEIGHT = 0.28;
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1800;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const CROP_WIDTH = 280;
const CROP_HEIGHT = 210;
const CROP_PAD = 36;

const HEAT_COLOR = { r: 70, g: 160, b: 255 };

const ISSUE_TITLE_MAP = {
  color: "颜色 / 填充差异",
  font: "字号 / 文本样式差异",
  spacing: "间距 / 对齐差异",
  radius: "圆角 / 形状差异",
  layout: "布局结构差异",
};

const SEVERITY_LABEL = {
  high: "🔴 高",
  medium: "🟡 中",
  low: "🟢 低",
};

module.exports = {
  CELL_SIZE,
  DEFAULT_THRESHOLD,
  DEFAULT_MIN_REGION_CELLS,
  DEFAULT_HEAT_OPACITY,
  DEFAULT_OVERLAY_OPACITY,
  RGB_WEIGHT,
  LUM_WEIGHT,
  MAX_WIDTH,
  MAX_HEIGHT,
  MIN_WIDTH,
  MIN_HEIGHT,
  CROP_WIDTH,
  CROP_HEIGHT,
  CROP_PAD,
  HEAT_COLOR,
  ISSUE_TITLE_MAP,
  SEVERITY_LABEL,
};
