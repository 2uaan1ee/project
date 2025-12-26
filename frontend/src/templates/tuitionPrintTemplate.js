const tuitionPrintTemplate = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>{{title}}</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 24px;
        font-family: "Times New Roman", serif;
        color: #0f172a;
      }

      .print-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 10px;
        border-bottom: 2px solid #0f172a;
        margin-bottom: 16px;
      }

      .print-org {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #334155;
      }

      h1 {
        margin: 6px 0 6px;
        font-size: 20px;
        letter-spacing: 0.4px;
      }

      .meta {
        font-size: 12px;
        color: #475569;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      th,
      td {
        border: 1px solid #cbd5f5;
        padding: 6px 8px;
        vertical-align: top;
      }

      th {
        text-align: left;
        background: #f1f5f9;
      }

      td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      td.empty {
        text-align: center;
        color: #64748b;
        padding: 12px 8px;
      }

      .summary {
        margin-top: 12px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        font-size: 12px;
      }

      .summary-item {
        padding: 8px 10px;
        border: 1px dashed #cbd5f5;
      }

      .summary-label {
        color: #475569;
        font-size: 11px;
      }

      .summary-value {
        margin-top: 4px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="print-header">
      <div>
        <div class="print-org">Trường Đại học Công nghệ Thông tin</div>
        <h1>{{title}}</h1>
        <div class="meta">Năm học: {{academicYear}} • Học kỳ: {{semesterLabel}} • Lớp: {{classLabel}}</div>
      </div>
      <div class="meta">In lúc: {{generatedAt}}</div>
    </div>

    {{table}}

    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Tổng số sinh viên</div>
        <div class="summary-value">{{totalStudents}}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Tổng phải đóng</div>
        <div class="summary-value">{{totalDue}}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Tổng còn lại</div>
        <div class="summary-value">{{totalRemaining}}</div>
      </div>
    </div>
  </body>
</html>`;

export default tuitionPrintTemplate;
