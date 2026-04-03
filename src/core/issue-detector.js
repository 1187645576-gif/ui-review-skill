const { CELL_SIZE, ISSUE_TITLE_MAP } = require("./constants");

function buildIssues(diffGrid, width, height, threshold, minCells) {
  const visited = new Uint8Array(diffGrid.cols * diffGrid.rows);
  const issues = [];

  for (let row = 0; row < diffGrid.rows; row += 1) {
    for (let col = 0; col < diffGrid.cols; col += 1) {
      const index = row * diffGrid.cols + col;
      if (visited[index] || diffGrid.scores[index] < threshold) continue;

      const queue = [[col, row]];
      const cells = [];
      visited[index] = 1;

      while (queue.length) {
        const [cx, cy] = queue.shift();
        const cellIndex = cy * diffGrid.cols + cx;
        cells.push({ x: cx, y: cy, score: diffGrid.scores[cellIndex] });

        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= diffGrid.cols || ny >= diffGrid.rows) return;
          const nextIndex = ny * diffGrid.cols + nx;
          if (visited[nextIndex] || diffGrid.scores[nextIndex] < threshold) return;
          visited[nextIndex] = 1;
          queue.push([nx, ny]);
        });
      }

      if (cells.length < minCells) continue;
      issues.push(buildIssueFromCells(cells, width, height));
    }
  }

  return issues.sort(compareSeverity);
}

function buildIssueFromCells(cells, width, height) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  let total = 0;

  cells.forEach((cell) => {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
    total += cell.score;
  });

  const bbox = {
    x: minX * CELL_SIZE,
    y: minY * CELL_SIZE,
    w: Math.min(width, (maxX - minX + 1) * CELL_SIZE),
    h: Math.min(height, (maxY - minY + 1) * CELL_SIZE),
  };

  const avgScore = total / cells.length;
  const areaRatio = (bbox.w * bbox.h) / (width * height);
  const type = classifyIssueType(bbox, avgScore, areaRatio);

  return {
    id: `${type}-${bbox.x}-${bbox.y}-${bbox.w}-${bbox.h}`,
    type,
    severity: classifySeverity(avgScore, areaRatio),
    title: ISSUE_TITLE_MAP[type],
    summary: describeIssue(type, bbox, avgScore),
    bbox,
    score: avgScore,
  };
}

function classifyIssueType(bbox, avgScore, areaRatio) {
  const aspect = bbox.w / Math.max(bbox.h, 1);
  if (bbox.h < 56 && aspect > 2.8) return "font";
  if (bbox.w < 52 || bbox.h < 52) return "radius";
  if (aspect > 5 || aspect < 0.2) return "spacing";
  if (avgScore > 0.34 && areaRatio < 0.08) return "color";
  return "layout";
}

function classifySeverity(avgScore, areaRatio) {
  if (avgScore > 0.42 || areaRatio > 0.12) return "high";
  if (avgScore > 0.30 || areaRatio > 0.05) return "medium";
  return "low";
}

function describeIssue(type, bbox, avgScore) {
  const base =
    type === "color" ? "疑似颜色或填充不一致" :
    type === "font" ? "疑似字号、字重或文本块高度不一致" :
    type === "spacing" ? "疑似间距或对齐存在偏差" :
    type === "radius" ? "疑似圆角或小组件形态不一致" :
    "疑似整体布局结构存在偏差";
  return `${base}，位于 ${Math.round(bbox.x)}, ${Math.round(bbox.y)} 附近，区域 ${Math.round(bbox.w)} × ${Math.round(bbox.h)}，差异强度 ${Math.round(avgScore * 100)}%。`;
}

function compareSeverity(a, b) {
  const rank = { high: 0, medium: 1, low: 2 };
  return rank[a.severity] - rank[b.severity] || b.score - a.score;
}

module.exports = { buildIssues, classifyIssueType, classifySeverity };
