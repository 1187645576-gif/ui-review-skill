const { SEVERITY_LABEL } = require("../core/constants");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityText(severity) {
  return SEVERITY_LABEL[severity] || severity;
}

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

module.exports = { escapeHtml, severityText, formatDate };
