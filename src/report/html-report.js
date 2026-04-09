const { toBase64DataUrl } = require("../image/exporter");
const { escapeHtml, severityText, formatDate } = require("./utils");
const { ISSUE_TITLE_MAP } = require("../core/constants");

const REPORT_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Microsoft YaHei","Segoe UI",sans-serif; padding: 32px; color: #1a1a2e; background: #f8fafd; line-height: 1.6; }
.report-header { margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
.report-header h1 { font-size: 24px; margin-bottom: 12px; }
.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 14px; color: #4b5563; }
.summary-section { margin-bottom: 24px; }
.summary-section h2 { font-size: 18px; margin-bottom: 12px; }
.summary-bar { display: flex; gap: 16px; flex-wrap: wrap; }
.stat { padding: 8px 16px; border-radius: 8px; background: #f3f4f6; font-size: 14px; }
.stat strong { font-size: 20px; margin-left: 4px; }
.severity-high { background: #fee2e2; color: #b91c1c; }
.severity-medium { background: #fef3c7; color: #92400e; }
.severity-low { background: #dbeafe; color: #1e40af; }

.toolbar { position: sticky; top: 0; z-index: 10; background: #f8fafd; padding: 12px 0; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.toolbar-label { font-size: 13px; color: #6b7280; margin-right: 4px; }
.filter-btn { padding: 4px 14px; border-radius: 999px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; cursor: pointer; transition: all .15s; }
.filter-btn:hover { border-color: #9ca3af; }
.filter-btn.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
.toolbar-sep { width: 1px; height: 24px; background: #d1d5db; margin: 0 4px; }
.add-btn { padding: 4px 14px; border-radius: 999px; border: 1px solid #22c55e; background: #f0fdf4; color: #16a34a; font-size: 13px; cursor: pointer; font-weight: 600; }
.add-btn:hover { background: #dcfce7; }

.type-section { margin-bottom: 32px; }
.type-section > h2 { font-size: 18px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
.type-count { font-size: 14px; color: #9ca3af; font-weight: normal; margin-left: 8px; }
.page-group { margin: 16px 0 20px; padding: 16px; background: #f9fafb; border-radius: 10px; }
.page-group-title { font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px dashed #d1d5db; }
.issue-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 12px; background: #fff; position: relative; transition: opacity .2s; }
.issue-card.card-high { border-left: 4px solid #ef4444; }
.issue-card.card-medium { border-left: 4px solid #f59e0b; }
.issue-card.card-low { border-left: 4px solid #3b82f6; }
.issue-card.deleted { opacity: 0.3; text-decoration: line-through; }
.issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.issue-index { font-weight: 700; color: #374151; }
.badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.issue-title { font-size: 16px; }
.issue-summary { font-size: 14px; color: #4b5563; margin-bottom: 10px; }
.issue-meta { display: flex; gap: 16px; font-size: 12px; color: #9ca3af; margin-bottom: 12px; flex-wrap: wrap; }
.comparison-row { display: flex; gap: 12px; flex-wrap: wrap; }
.comparison-row > div > h4 { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.comparison-row img { max-width: 280px; border-radius: 6px; border: 1px solid #e5e7eb; }
.delete-btn { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e5e7eb; background: #fff; color: #9ca3af; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.delete-btn:hover { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }
.edit-btn { position: absolute; top: 12px; right: 48px; width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e5e7eb; background: #fff; color: #9ca3af; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.edit-btn:hover { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
.restore-btn { position: absolute; top: 12px; right: 12px; padding: 2px 10px; border-radius: 999px; border: 1px solid #d1d5db; background: #fff; color: #6b7280; font-size: 12px; cursor: pointer; }
.restore-btn:hover { background: #f0fdf4; color: #16a34a; border-color: #86efac; }

.overview-section { margin-bottom: 24px; }
.overview-section > h2 { font-size: 18px; margin-bottom: 16px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
.page-overview { margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }
.page-overview h3 { font-size: 14px; margin-bottom: 8px; color: #374151; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.overview-item h4 { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
.overview-item img { width: 100%; border-radius: 6px; border: 1px solid #e5e7eb; cursor: pointer; }
.comparison-row img { max-width: 280px; border-radius: 6px; border: 1px solid #e5e7eb; cursor: pointer; }
.zoom-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.75); z-index: 300; align-items: center; justify-content: center; cursor: zoom-out; }
.zoom-overlay.show { display: flex; }
.zoom-overlay img { max-width: 90vw; max-height: 90vh; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
.footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }

.add-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 100; align-items: center; justify-content: center; }
.add-modal.show { display: flex; }
.add-dialog { background: #fff; border-radius: 16px; padding: 24px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.add-dialog h3 { font-size: 18px; margin-bottom: 16px; }
.add-dialog label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px; margin-top: 12px; }
.add-dialog select, .add-dialog input, .add-dialog textarea { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.add-dialog textarea { resize: vertical; min-height: 60px; }
.img-upload-zone { margin-top: 8px; border: 2px dashed #d1d5db; border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; color: #9ca3af; font-size: 13px; transition: all .15s; }
.img-upload-zone:hover { border-color: #93c5fd; color: #3b82f6; }
.img-upload-zone.has-img { border-style: solid; border-color: #86efac; }
.img-preview-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.img-preview-item { position: relative; }
.img-preview-item img { width: 100px; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
.img-preview-item .img-remove { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: #fff; border: none; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.user-img { max-width: 260px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 8px; }
.add-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.add-actions button { padding: 8px 20px; border-radius: 8px; border: none; font-size: 14px; cursor: pointer; }
.btn-cancel { background: #f3f4f6; color: #374151; }
.btn-confirm { background: #1a1a2e; color: #fff; }
.save-btn { padding: 4px 14px; border-radius: 999px; border: 1px solid #6366f1; background: #eef2ff; color: #4f46e5; font-size: 13px; cursor: pointer; font-weight: 600; }
.save-btn:hover { background: #e0e7ff; }
.save-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1a1a2e; color: #fff; padding: 10px 24px; border-radius: 10px; font-size: 14px; z-index: 200; display: none; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

@media print { .toolbar, .delete-btn, .restore-btn, .add-btn, .edit-btn { display: none !important; } body { padding: 16px; } .page-overview { break-inside: avoid; } .issue-card { break-inside: avoid; } .issue-card.deleted { display: none !important; } }
`;

const REPORT_JS = `
document.addEventListener('DOMContentLoaded', function() {
  var activeFilters = { severity: 'all', type: 'all' };
  var pendingImages = [];

  // 筛选
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var group = btn.dataset.group;
      var value = btn.dataset.value;
      document.querySelectorAll('.filter-btn[data-group="'+group+'"]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilters[group] = value;
      applyFilters();
    });
  });

  function applyFilters() {
    document.querySelectorAll('.issue-card').forEach(function(card) {
      var show = true;
      if (activeFilters.severity !== 'all' && card.dataset.severity !== activeFilters.severity) show = false;
      if (activeFilters.type !== 'all' && card.dataset.type !== activeFilters.type) show = false;
      card.style.display = show ? '' : 'none';
    });
    document.querySelectorAll('.page-group').forEach(function(pg) {
      var visible = pg.querySelectorAll('.issue-card:not([style*="display: none"]):not(.deleted)');
      pg.style.display = visible.length ? '' : 'none';
    });
    document.querySelectorAll('.type-section').forEach(function(ts) {
      var visible = ts.querySelectorAll('.issue-card:not([style*="display: none"]):not(.deleted)');
      ts.style.display = visible.length ? '' : 'none';
    });
    updateCounts();
  }

  // 删除/恢复/编辑
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
      var card = e.target.closest('.issue-card');
      card.classList.add('deleted');
      e.target.style.display = 'none';
      var eb = card.querySelector('.edit-btn'); if (eb) eb.style.display = 'none';
      var rb = card.querySelector('.restore-btn'); if (rb) rb.style.display = '';
      updateCounts();
      hideEmptyGroups();
    }
    if (e.target.classList.contains('restore-btn')) {
      var card = e.target.closest('.issue-card');
      card.classList.remove('deleted');
      e.target.style.display = 'none';
      var db = card.querySelector('.delete-btn'); if (db) db.style.display = '';
      var eb = card.querySelector('.edit-btn'); if (eb) eb.style.display = '';
      updateCounts();
      hideEmptyGroups();
    }
    if (e.target.classList.contains('edit-btn')) {
      openEditModal(e.target.closest('.issue-card'));
    }
    if (e.target.classList.contains('img-remove')) {
      e.target.closest('.img-preview-item').remove();
    }
  });

  // 编辑弹窗
  var editModal = document.getElementById('editModal');
  var editingCard = null;

  function openEditModal(card) {
    editingCard = card;
    var titleEl = card.querySelector('.issue-title');
    var summaryEl = card.querySelector('.issue-summary');
    document.getElementById('editTitle').value = titleEl ? titleEl.textContent : '';
    document.getElementById('editDesc').value = summaryEl ? summaryEl.textContent : '';
    document.getElementById('editSeverity').value = card.dataset.severity || 'medium';
    editModal.classList.add('show');
  }

  document.getElementById('editCancel').addEventListener('click', function() { editModal.classList.remove('show'); });
  editModal.addEventListener('click', function(e) { if (e.target === editModal) editModal.classList.remove('show'); });

  document.getElementById('editConfirm').addEventListener('click', function() {
    if (!editingCard) return;
    var title = document.getElementById('editTitle').value.trim();
    var desc = document.getElementById('editDesc').value.trim();
    var severity = document.getElementById('editSeverity').value;

    var titleEl = editingCard.querySelector('.issue-title');
    var summaryEl = editingCard.querySelector('.issue-summary');
    if (titleEl && title) titleEl.textContent = title;
    if (summaryEl) summaryEl.textContent = desc;

    // 更新优先级
    var oldSeverity = editingCard.dataset.severity;
    if (severity !== oldSeverity) {
      editingCard.dataset.severity = severity;
      editingCard.classList.remove('card-high','card-medium','card-low');
      editingCard.classList.add('card-' + severity);
      var badge = editingCard.querySelector('.badge');
      if (badge) {
        badge.className = 'badge severity-' + severity;
        var labels = { high: '\\uD83D\\uDD34 \\u9AD8', medium: '\\uD83D\\uDFE1 \\u4E2D', low: '\\uD83D\\uDFE2 \\u4F4E' };
        badge.textContent = labels[severity] || severity;
      }
    }

    editModal.classList.remove('show');
    updateCounts();
  });

  // 新增问题
  var addModal = document.getElementById('addModal');
  document.getElementById('addIssueBtn').addEventListener('click', function() {
    pendingImages = [];
    document.getElementById('imgPreview').innerHTML = '';
    addModal.classList.add('show');
  });
  document.getElementById('addCancel').addEventListener('click', function() { addModal.classList.remove('show'); });
  addModal.addEventListener('click', function(e) { if (e.target === addModal) addModal.classList.remove('show'); });

  // 图片上传
  var imgZone = document.getElementById('imgUploadZone');
  var imgInput = document.getElementById('imgFileInput');
  imgZone.addEventListener('click', function() { imgInput.click(); });
  imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = '#3b82f6'; });
  imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
  imgZone.addEventListener('drop', function(e) {
    e.preventDefault(); imgZone.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });
  imgInput.addEventListener('change', function() { handleFiles(imgInput.files); imgInput.value = ''; });

  function handleFiles(files) {
    Array.from(files).forEach(function(file) {
      if (!file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        pendingImages.push(ev.target.result);
        renderImgPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderImgPreview() {
    var container = document.getElementById('imgPreview');
    container.innerHTML = '';
    pendingImages.forEach(function(src, i) {
      var item = document.createElement('div');
      item.className = 'img-preview-item';
      item.innerHTML = '<img src="' + src + '"><button class="img-remove" data-idx="' + i + '">\\u00D7</button>';
      item.querySelector('.img-remove').addEventListener('click', function() {
        pendingImages.splice(i, 1);
        renderImgPreview();
      });
      container.appendChild(item);
    });
    imgZone.classList.toggle('has-img', pendingImages.length > 0);
  }

  document.getElementById('addConfirm').addEventListener('click', function() {
    var type = document.getElementById('addType').value;
    var severity = document.getElementById('addSeverity').value;
    var title = document.getElementById('addTitle').value.trim();
    var desc = document.getElementById('addDesc').value.trim();
    if (!title) { alert('\\u8BF7\\u586B\\u5199\\u95EE\\u9898\\u6807\\u9898'); return; }

    var severityLabel = { high: '\\uD83D\\uDD34 \\u9AD8', medium: '\\uD83D\\uDFE1 \\u4E2D', low: '\\uD83D\\uDFE2 \\u4F4E' };
    var imgHtml = '';
    pendingImages.forEach(function(src) {
      imgHtml += '<img class="user-img" src="' + src + '">';
    });

    var card = document.createElement('div');
    card.className = 'issue-card card-' + severity + ' manual-issue';
    card.dataset.severity = severity;
    card.dataset.type = type;
    card.innerHTML = '<button class="edit-btn" title="\\u7F16\\u8F91">\\u270E</button><button class="delete-btn" title="\\u5220\\u9664">\\u00D7</button><button class="restore-btn" style="display:none">\\u6062\\u590D</button>' +
      '<div class="issue-header"><span class="badge severity-' + severity + '">' + (severityLabel[severity]||severity) + '</span>' +
      '<strong class="issue-title">' + escapeH(title) + '</strong><span class="badge" style="background:#f0fdf4;color:#16a34a;">\\u624B\\u52A8\\u6DFB\\u52A0</span></div>' +
      '<p class="issue-summary">' + escapeH(desc) + '</p>' +
      (imgHtml ? '<div class="comparison-row">' + imgHtml + '</div>' : '');

    var section = document.querySelector('.type-section[data-type="' + type + '"]');
    if (section) {
      var lastGroup = section.querySelector('.page-group:last-of-type') || section;
      lastGroup.appendChild(card);
    } else {
      var allSections = document.querySelectorAll('.type-section');
      var last = allSections[allSections.length - 1];
      if (last) last.parentNode.insertBefore(card, last.nextSibling);
    }

    addModal.classList.remove('show');
    document.getElementById('addTitle').value = '';
    document.getElementById('addDesc').value = '';
    pendingImages = [];
    document.getElementById('imgPreview').innerHTML = '';
    updateCounts();
  });

  function updateCounts() {
    var cards = document.querySelectorAll('.issue-card:not(.deleted):not([style*="display: none"])');
    var h = 0, m = 0, l = 0;
    cards.forEach(function(c) {
      if (c.dataset.severity === 'high') h++;
      else if (c.dataset.severity === 'medium') m++;
      else l++;
    });
    document.getElementById('countTotal').textContent = h + m + l;
    document.getElementById('countHigh').textContent = h;
    document.getElementById('countMedium').textContent = m;
    document.getElementById('countLow').textContent = l;
  }

  function escapeH(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function hideEmptyGroups() {
    document.querySelectorAll('.page-group').forEach(function(pg) {
      var alive = pg.querySelectorAll('.issue-card:not(.deleted)');
      pg.style.display = alive.length ? '' : 'none';
    });
    document.querySelectorAll('.type-section').forEach(function(ts) {
      var alive = ts.querySelectorAll('.issue-card:not(.deleted)');
      ts.style.display = alive.length ? '' : 'none';
    });
  }

  // 图片放大
  var zoomOverlay = document.getElementById('zoomOverlay');
  var zoomImg = document.getElementById('zoomImg');
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && !e.target.closest('.add-dialog') && !e.target.closest('.img-preview-item') && !e.target.closest('.zoom-overlay')) {
      zoomImg.src = e.target.src;
      zoomOverlay.classList.add('show');
    }
  });
  zoomOverlay.addEventListener('click', function() { zoomOverlay.classList.remove('show'); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') zoomOverlay.classList.remove('show'); });

  // 保存报告
  document.getElementById('saveReportBtn').addEventListener('click', function() {
    // 移除已删除的问题
    document.querySelectorAll('.issue-card.deleted').forEach(function(c) { c.remove(); });
    // 移除编辑/删除按钮、新增弹窗、编辑弹窗
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.delete-btn, .edit-btn, .restore-btn, #addModal, #editModal, .save-toast, #saveReportBtn, .add-btn, #imgFileInput').forEach(function(el) { el.remove(); });
    // 移除原有 script，注入精简版筛选 JS
    clone.querySelectorAll('script').forEach(function(el) { el.remove(); });

    var filterJS = document.createElement('script');
    filterJS.textContent = "(function(){" +
      "var af={severity:'all',type:'all'};" +
      "document.querySelectorAll('.filter-btn').forEach(function(b){" +
        "b.addEventListener('click',function(){" +
          "var g=b.dataset.group,v=b.dataset.value;" +
          "document.querySelectorAll('.filter-btn[data-group=\\x22'+g+'\\x22]').forEach(function(x){x.classList.remove('active')});" +
          "b.classList.add('active');af[g]=v;" +
          "document.querySelectorAll('.issue-card').forEach(function(c){" +
            "var s=true;" +
            "if(af.severity!=='all'&&c.dataset.severity!==af.severity)s=false;" +
            "if(af.type!=='all'&&c.dataset.type!==af.type)s=false;" +
            "c.style.display=s?'':'none';" +
          "});" +
          "document.querySelectorAll('.page-group').forEach(function(p){var v=p.querySelectorAll('.issue-card:not([style*=\\x22display: none\\x22])');p.style.display=v.length?'':'none'});" +
          "document.querySelectorAll('.type-section').forEach(function(t){var v=t.querySelectorAll('.issue-card:not([style*=\\x22display: none\\x22])');t.style.display=v.length?'':'none'});" +
          "var cards=document.querySelectorAll('.issue-card:not([style*=\\x22display: none\\x22])'),h=0,m=0,l=0;" +
          "cards.forEach(function(c){if(c.dataset.severity==='high')h++;else if(c.dataset.severity==='medium')m++;else l++});" +
          "document.getElementById('countTotal').textContent=h+m+l;" +
          "document.getElementById('countHigh').textContent=h;" +
          "document.getElementById('countMedium').textContent=m;" +
          "document.getElementById('countLow').textContent=l;" +
        "});" +
      "});" +
      "var zo=document.getElementById('zoomOverlay'),zi=document.getElementById('zoomImg');" +
      "document.addEventListener('click',function(e){if(e.target.tagName==='IMG'&&!e.target.closest('.zoom-overlay')){zi.src=e.target.src;zo.classList.add('show')}});" +
      "zo.addEventListener('click',function(){zo.classList.remove('show')});" +
      "document.addEventListener('keydown',function(e){if(e.key==='Escape')zo.classList.remove('show')});" +
    "})();";
    clone.querySelector('body').appendChild(filterJS);

    var html = '<!DOCTYPE html>' + clone.outerHTML;
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'UI\\u8D70\\u67E5\\u62A5\\u544A-\\u7EC8\\u7A3F.html';
    a.click();
    URL.revokeObjectURL(url);

    var toast = document.getElementById('saveToast');
    toast.style.display = 'block';
    setTimeout(function() { toast.style.display = 'none'; }, 2000);
  });
});
`;

const TYPE_ORDER = ["color", "font", "spacing", "radius", "layout"];
const TYPE_ICON = { color: "\uD83C\uDFA8", font: "\uD83D\uDD24", spacing: "\uD83D\uDCCF", radius: "\u2B55", layout: "\uD83D\uDCDA" };

async function generateHtmlReport(data, meta) {
  const { pages } = data;
  const timestamp = formatDate();
  const isMultiPage = pages.length > 1;

  const allIssues = pages.flatMap((p) => p.issues);
  const highCount = allIssues.filter((i) => i.severity === "high").length;
  const mediumCount = allIssues.filter((i) => i.severity === "medium").length;
  const lowCount = allIssues.filter((i) => i.severity === "low").length;

  const issuesByType = {};
  TYPE_ORDER.forEach((t) => { issuesByType[t] = []; });
  allIssues.forEach((issue) => {
    if (!issuesByType[issue.type]) issuesByType[issue.type] = [];
    issuesByType[issue.type].push(issue);
  });

  // 每个类型内按优先级排序：高→中→低
  const severityRank = { high: 0, medium: 1, low: 2 };
  Object.values(issuesByType).forEach((list) => {
    list.sort((a, b) => {
      const ra = severityRank[a.severity] != null ? severityRank[a.severity] : 9;
      const rb = severityRank[b.severity] != null ? severityRank[b.severity] : 9;
      return (ra - rb) || (b.score - a.score);
    });
  });

  const typeSectionsHtml = [];
  let globalIndex = 0;

  for (const type of TYPE_ORDER) {
    const typeIssues = issuesByType[type];
    if (!typeIssues.length) continue;

    const icon = TYPE_ICON[type] || "";
    const typeName = ISSUE_TITLE_MAP[type] || type;
    typeSectionsHtml.push(`<div class="type-section" data-type="${type}"><h2>${icon} ${escapeHtml(typeName)}<span class="type-count">${typeIssues.length} 个问题</span></h2>`);

    if (isMultiPage) {
      const byPage = {};
      typeIssues.forEach((issue) => {
        const pg = issue.pageName || "未命名";
        if (!byPage[pg]) byPage[pg] = [];
        byPage[pg].push(issue);
      });

      for (const [pageName, pageIssues] of Object.entries(byPage)) {
        pageIssues.sort((a, b) => {
          const ra = severityRank[a.severity] != null ? severityRank[a.severity] : 9;
          const rb = severityRank[b.severity] != null ? severityRank[b.severity] : 9;
          return (ra - rb) || (b.score - a.score);
        });
        typeSectionsHtml.push(`<div class="page-group"><div class="page-group-title">\uD83D\uDCC4 ${escapeHtml(pageName)}（${pageIssues.length} 个）</div>`);
        for (const issue of pageIssues) {
          globalIndex += 1;
          typeSectionsHtml.push(await renderIssueCard(issue, globalIndex));
        }
        typeSectionsHtml.push("</div>");
      }
    } else {
      for (const issue of typeIssues) {
        globalIndex += 1;
        typeSectionsHtml.push(await renderIssueCard(issue, globalIndex));
      }
    }

    typeSectionsHtml.push("</div>");
  }

  const pageOverviewsHtml = [];
  for (const page of pages) {
    const dB64 = await toBase64DataUrl(page.designImage);
    const hB64 = await toBase64DataUrl(page.heatMapImage);
    const oB64 = await toBase64DataUrl(page.overlayImage);
    const pageTitle = isMultiPage ? page.pageName || "页面" : "全局视图";

    pageOverviewsHtml.push(`
      <div class="page-overview">
        <h3>${escapeHtml(pageTitle)}</h3>
        <div class="overview-grid">
          <div class="overview-item"><h4>设计稿</h4><img src="${dB64}" alt="设计稿"></div>
          <div class="overview-item"><h4>热力图</h4><img src="${hB64}" alt="热力图"></div>
          <div class="overview-item"><h4>重叠</h4><img src="${oB64}" alt="重叠"></div>
        </div>
      </div>`);
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.pageName || "UI 走查报告")}</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <header class="report-header">
    <h1>${escapeHtml(meta.pageName || "UI 走查报告")}</h1>
    <div class="meta-grid">
      <div><strong>版本：</strong>${escapeHtml(meta.version || "")}</div>
      <div><strong>走查人员：</strong>${escapeHtml(meta.reviewer || "")}</div>
      <div><strong>生成时间：</strong>${escapeHtml(timestamp)}</div>
      <div><strong>灵敏度：</strong>${meta.threshold || 0.15}</div>
      ${isMultiPage ? `<div><strong>走查页面数：</strong>${pages.length}</div>` : ""}
    </div>
    ${meta.notes ? `<p style="margin-top:8px;font-size:14px;color:#6b7280;">备注：${escapeHtml(meta.notes)}</p>` : ""}
  </header>

  <section class="summary-section">
    <h2>走查总结</h2>
    <div class="summary-bar">
      <div class="stat">总问题数：<strong id="countTotal">${allIssues.length}</strong></div>
      <div class="stat severity-high">高优先级：<strong id="countHigh">${highCount}</strong></div>
      <div class="stat severity-medium">中优先级：<strong id="countMedium">${mediumCount}</strong></div>
      <div class="stat severity-low">低优先级：<strong id="countLow">${lowCount}</strong></div>
    </div>
  </section>

  <div class="toolbar">
    <span class="toolbar-label">优先级：</span>
    <button class="filter-btn active" data-group="severity" data-value="all">全部</button>
    <button class="filter-btn" data-group="severity" data-value="high">高</button>
    <button class="filter-btn" data-group="severity" data-value="medium">中</button>
    <button class="filter-btn" data-group="severity" data-value="low">低</button>
    <span class="toolbar-sep"></span>
    <span class="toolbar-label">类型：</span>
    <button class="filter-btn active" data-group="type" data-value="all">全部</button>
    <button class="filter-btn" data-group="type" data-value="color">颜色</button>
    <button class="filter-btn" data-group="type" data-value="font">字号</button>
    <button class="filter-btn" data-group="type" data-value="spacing">间距</button>
    <button class="filter-btn" data-group="type" data-value="radius">圆角</button>
    <button class="filter-btn" data-group="type" data-value="layout">布局</button>
    <span class="toolbar-sep"></span>
    <button class="add-btn" id="addIssueBtn">+ 新增问题</button>
    <button class="save-btn" id="saveReportBtn">保存当前报告</button>
  </div>

  ${typeSectionsHtml.join("\n")}
  ${allIssues.length === 0 ? "<p>未识别到明显差异问题。</p>" : ""}

  <section class="overview-section">
    <h2>各页面全局视图</h2>
    ${pageOverviewsHtml.join("\n")}
  </section>

  <div class="add-modal" id="addModal">
    <div class="add-dialog">
      <h3>新增问题</h3>
      <label>问题类型</label>
      <select id="addType">
        <option value="color">颜色 / 填充差异</option>
        <option value="font">字号 / 文本样式差异</option>
        <option value="spacing">间距 / 对齐差异</option>
        <option value="radius">圆角 / 形状差异</option>
        <option value="layout">布局结构差异</option>
      </select>
      <label>优先级</label>
      <select id="addSeverity">
        <option value="high">高 - 影响功能或核心视觉</option>
        <option value="medium">中 - 影响视觉还原</option>
        <option value="low">低 - 细节优化</option>
      </select>
      <label>问题标题</label>
      <input type="text" id="addTitle" placeholder="例如：按钮颜色与设计稿不一致">
      <label>问题描述</label>
      <textarea id="addDesc" placeholder="详细描述问题，可选"></textarea>
      <label>截图（可选，支持多张，可拖拽）</label>
      <input type="file" id="imgFileInput" accept="image/*" multiple style="display:none">
      <div class="img-upload-zone" id="imgUploadZone">点击或拖拽图片到这里</div>
      <div class="img-preview-row" id="imgPreview"></div>
      <div class="add-actions">
        <button class="btn-cancel" id="addCancel">取消</button>
        <button class="btn-confirm" id="addConfirm">添加</button>
      </div>
    </div>
  </div>

  <div class="add-modal" id="editModal">
    <div class="add-dialog">
      <h3>编辑问题</h3>
      <label>优先级</label>
      <select id="editSeverity">
        <option value="high">高 - 影响功能或核心视觉</option>
        <option value="medium">中 - 影响视觉还原</option>
        <option value="low">低 - 细节优化</option>
      </select>
      <label>问题标题</label>
      <input type="text" id="editTitle">
      <label>问题描述</label>
      <textarea id="editDesc"></textarea>
      <div class="add-actions">
        <button class="btn-cancel" id="editCancel">取消</button>
        <button class="btn-confirm" id="editConfirm">保存</button>
      </div>
    </div>
  </div>

  <div class="zoom-overlay" id="zoomOverlay"><img id="zoomImg" src="" alt="放大"></div>

  <div class="save-toast" id="saveToast">报告已保存</div>

  <footer class="footer">
    <p>由 AI UI 走查助手 v2.3.0 自动生成 | ${escapeHtml(timestamp)}</p>
  </footer>

  <script>${REPORT_JS}</script>
</body>
</html>`;

  return html;
}

async function renderIssueCard(issue, index) {
  const designCropB64 = await toBase64DataUrl(issue.designCrop);
  const devCropB64 = await toBase64DataUrl(issue.devCrop);
  const severityCls = `card-${issue.severity}`;
  const badgeCls = `severity-${issue.severity}`;

  return `
    <div class="issue-card ${severityCls}" data-severity="${issue.severity}" data-type="${issue.type}">
      <button class="edit-btn" title="编辑">\u270E</button>
      <button class="delete-btn" title="删除此问题">\u00D7</button>
      <button class="restore-btn" style="display:none">恢复</button>
      <div class="issue-header">
        <span class="issue-index">#${index}</span>
        <span class="badge ${badgeCls}">${severityText(issue.severity)}</span>
        <strong class="issue-title">${escapeHtml(issue.title)}</strong>
      </div>
      <p class="issue-summary">${escapeHtml(issue.summary)}</p>
      <div class="issue-meta">
        <span>区域：${issue.bbox.w} × ${issue.bbox.h}</span>
        <span>差异强度：${Math.round(issue.score * 100)}%</span>
        <span>位置：(${issue.bbox.x}, ${issue.bbox.y})</span>
      </div>
      <div class="comparison-row">
        <div><h4>设计稿局部</h4><img src="${designCropB64}" alt="设计稿局部"></div>
        <div><h4>开发稿局部</h4><img src="${devCropB64}" alt="开发稿局部"></div>
      </div>
    </div>`;
}

module.exports = { generateHtmlReport };
