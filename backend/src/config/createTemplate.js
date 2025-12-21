import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dữ liệu mẫu
const sampleData = [
  { STT: 1, "Môn học": "IT001" },
  { STT: 2, "Môn học": "IT002" },
  { STT: 3, "Môn học": "IT003" },
  { STT: 4, "Môn học": "IT004" },
  { STT: 5, "Môn học": "IT005" },
];

// Tạo workbook
const wb = xlsx.utils.book_new();

// Tạo worksheet từ dữ liệu
const ws = xlsx.utils.json_to_sheet(sampleData);

// Thêm worksheet vào workbook
xlsx.utils.book_append_sheet(wb, ws, "Danh sách môn học");

// Tạo thư mục output nếu chưa có
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Xuất file Excel
const outputPath = path.join(outputDir, "template_mon_hoc_mo.xlsx");
xlsx.writeFile(wb, outputPath);

console.log(`✅ Đã tạo file template: ${outputPath}`);
console.log(`
📋 Cấu trúc file:
   - Cột "STT": Số thứ tự
   - Cột "Môn học": Mã môn học

💡 Hướng dẫn sử dụng:
   1. Mở file template_mon_hoc_mo.xlsx
   2. Thêm các mã môn học vào cột "Môn học"
   3. Cập nhật STT nếu cần
   4. Lưu file và import vào hệ thống
`);
