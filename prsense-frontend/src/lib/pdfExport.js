export const exportReviewReportToPDF = (review, findings, pullRequest) => {
  if (!review) return;
  const prNum = pullRequest?.prNumber || review?.pullRequest?.prNumber || "N/A";
  const prTitle = pullRequest?.title || review?.pullRequest?.title || "Direct Review Workspace";
  const author = pullRequest?.author || review?.pullRequest?.author || "anonymous";
  const repoName = pullRequest?.repository?.fullName || review?.pullRequest?.repository?.fullName || "Active Repository";
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export the PDF report.");
    return;
  }

  // Calculate stats
  const critical = findings?.filter(f => f.severity?.toLowerCase() === "critical" || f.severity?.toLowerCase() === "high").length || 0;
  const medium = findings?.filter(f => f.severity?.toLowerCase() === "medium").length || 0;
  const low = findings?.filter(f => f.severity?.toLowerCase() === "low" || f.severity?.toLowerCase() === "info").length || 0;
  
  // Format findings HTML
  const findingsHtml = findings && findings.length > 0
    ? findings.map((f, idx) => `
      <div class="finding-card ${f.severity?.toLowerCase()}">
        <div class="finding-header">
          <span class="finding-num">#${idx + 1}</span>
          <span class="finding-severity ${f.severity?.toLowerCase()}">${f.severity?.toUpperCase()}</span>
          <span class="finding-agent">${f.agent || "Analysis Agent"}</span>
        </div>
        <div class="finding-recommendation">${f.recommendation || "Code Quality Issue"}</div>
        <div class="finding-meta">File: <code>${f.filePath || "unknown"}</code></div>
        <div class="finding-desc">${f.description || ""}</div>
        ${f.whyFlagged ? `<div class="finding-why"><strong>Why Flagged:</strong> ${f.whyFlagged}</div>` : ""}
        ${f.ruleViolated ? `<div class="finding-rule"><strong>Rule Violated:</strong> ${f.ruleViolated}</div>` : ""}
        ${f.codeSnippet ? `
          <div class="code-block">
            <pre><code>${escapeHtml(f.codeSnippet)}</code></pre>
          </div>
        ` : ""}
      </div>
    `).join("")
    : `<p style="text-align: center; color: #666; padding: 20px;">No findings reported for this code review.</p>`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PRSense Code Audit Report - PR #${prNum}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #333;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
        }
        .header {
          border-bottom: 3px solid #ff5a1f;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #ff5a1f;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: 900;
          margin: 0 0 10px 0;
          color: #111;
        }
        .meta-grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 15px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          margin-bottom: 30px;
          font-size: 13px;
        }
        .meta-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed #dee2e6;
          padding-bottom: 5px;
        }
        .meta-item:last-child {
          border-bottom: none;
        }
        .meta-label {
          font-weight: 700;
          color: #495057;
        }
        .summary-box {
          background: #fff8f5;
          border-left: 4px solid #ff5a1f;
          padding: 20px;
          border-radius: 4px;
          margin-bottom: 35px;
          font-size: 14px;
        }
        .summary-box h3 {
          margin-top: 0;
          color: #c0392b;
          font-size: 16px;
        }
        .stats-badge-container {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
        }
        .stats-badge {
          flex: 1;
          text-align: center;
          padding: 12px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          border: 1px solid #dee2e6;
        }
        .stats-badge.critical {
          background: #fdf2f2;
          color: #c0392b;
          border-color: #f8b4b4;
        }
        .stats-badge.medium {
          background: #fffbeb;
          color: #d97706;
          border-color: #fef3c7;
        }
        .stats-badge.low {
          background: #f0fdf4;
          color: #15803d;
          border-color: #bbf7d0;
        }
        .section-title {
          font-size: 20px;
          font-weight: 800;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 8px;
          margin-top: 40px;
          margin-bottom: 20px;
          color: #212529;
        }
        .finding-card {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
          page-break-inside: avoid;
          background: #fff;
        }
        .finding-card.critical {
          border-left: 5px solid #dc3545;
        }
        .finding-card.medium {
          border-left: 5px solid #ffc107;
        }
        .finding-card.low {
          border-left: 5px solid #28a745;
        }
        .finding-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .finding-num {
          font-weight: 800;
          background: #343a40;
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .finding-severity {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .finding-severity.critical {
          background: #dc3545;
          color: #fff;
        }
        .finding-severity.medium {
          background: #ffc107;
          color: #000;
        }
        .finding-severity.low {
          background: #28a745;
          color: #fff;
        }
        .finding-agent {
          font-weight: 600;
          color: #495057;
          font-size: 12px;
        }
        .finding-recommendation {
          font-size: 16px;
          font-weight: 700;
          color: #111;
          margin-bottom: 8px;
        }
        .finding-meta {
          font-size: 11px;
          color: #6c757d;
          margin-bottom: 12px;
        }
        .finding-meta code {
          background: #f1f3f5;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .finding-desc {
          font-size: 13px;
          margin-bottom: 10px;
          color: #333;
        }
        .finding-why, .finding-rule {
          font-size: 12px;
          margin-top: 8px;
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 4px;
          color: #495057;
        }
        .code-block {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 15px;
          border-radius: 6px;
          margin-top: 15px;
          overflow-x: auto;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
        }
        .code-block pre {
          margin: 0;
        }
        @media print {
          body {
            padding: 20px 0;
          }
          .finding-card {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">PRSense AI • Code Audit Protocol</div>
        <h2 class="title">Security & Code Quality Audit Report</h2>
        <div style="font-size: 12px; color: #6c757d;">Generated on ${new Date().toLocaleString()}</div>
      </div>

      <div class="meta-grid">
        <div>
          <div class="meta-item">
            <span class="meta-label">Repository:</span>
            <span>${repoName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Pull Request:</span>
            <span>PR #${prNum} - ${prTitle}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">PR Author:</span>
            <span>@${author}</span>
          </div>
        </div>
        <div>
          <div class="meta-item">
            <span class="meta-label">AI Decision:</span>
            <span style="font-weight: 800; color: ${review.aiDecision === "APPROVED" ? "#28a745" : "#dc3545"}">${review.aiDecision}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Review Execution Time:</span>
            <span>${review.executionTimeMs || 1200} ms</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status:</span>
            <span>${review.status}</span>
          </div>
        </div>
      </div>

      <div class="stats-badge-container">
        <div class="stats-badge critical">
          ${critical} Critical / High Issues
        </div>
        <div class="stats-badge medium">
          ${medium} Warnings / Medium
        </div>
        <div class="stats-badge low">
          ${low} Suggestions / Low
        </div>
      </div>

      <div class="summary-box">
        <h3>Audit Executive Summary</h3>
        <p>${review.summaryReport || "Direct AI review completed successfully. No critical execution blocker identified."}</p>
      </div>

      <div class="section-title">Detailed Audit Findings</div>
      <div class="findings-list">
        ${findingsHtml}
      </div>

      <div style="text-align: center; margin-top: 50px; font-size: 10px; color: #adb5bd; border-top: 1px solid #dee2e6; padding-top: 20px; page-break-inside: avoid;">
        This document is an automated software audit report generated by the PRSense Multi-Agent Intelligence Engine.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

const escapeHtml = (text) => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
