# Hệ thống Quản lý Môn học Mở

## Tổng quan
Hệ thống cho phép Admin quản lý danh sách các môn học mở theo từng học kỳ trong năm học, với các tính năng:
- Import danh sách từ file Excel
- Thêm/xóa môn học thủ công
- Kiểm tra danh sách với chương trình đào tạo
- Chế độ public/private cho danh sách
- Xóa toàn bộ danh sách

## Cấu trúc Database

### Collection: `subject_open`
```javascript
{
  academicYear: String,        // VD: "2025-2026"
  semester: String,            // VD: "HK1", "HK2", "HK3"
  subjects: [
    {
      stt: Number,             // Số thứ tự
      subject_id: String       // Mã môn học
    }
  ],
  isPublic: Boolean,           // true = public, false = private
  createdBy: String,           // Email của admin tạo
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. Lấy danh sách môn học mở
**GET** `/api/subject-open`

Query params:
- `academicYear`: Năm học (optional)
- `semester`: Học kỳ (optional)

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "academicYear": "2025-2026",
      "semester": "HK2",
      "subjects": [...],
      "isPublic": false,
      "createdBy": "admin@uit.edu.vn",
      "createdAt": "2025-12-15T...",
      "updatedAt": "2025-12-15T..."
    }
  ]
}
```

### 2. Import từ Excel
**POST** `/api/subject-open/import`

Headers:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

Body (FormData):
- `file`: File Excel
- `academicYear`: Năm học
- `semester`: Học kỳ

Response:
```json
{
  "success": true,
  "message": "Import danh sách môn học mở thành công",
  "data": {...}
}
```

Error khi thiếu môn:
```json
{
  "success": false,
  "message": "Danh sách môn học mở chưa đủ theo chương trình đào tạo",
  "missingByMajor": [
    {
      "major": "Công nghệ phần mềm",
      "faculty": "KHOA_CNPM",
      "missingSubjects": ["IT001", "IT002"]
    }
  ]
}
```

### 3. Tạo/Cập nhật danh sách (Manual)
**POST** `/api/subject-open`

Headers:
- `Authorization: Bearer <token>`

Body:
```json
{
  "academicYear": "2025-2026",
  "semester": "HK2",
  "subjects": [
    { "stt": 1, "subject_id": "IT001" },
    { "stt": 2, "subject_id": "IT002" }
  ]
}
```

### 4. Thêm môn học vào danh sách
**POST** `/api/subject-open/:id/subjects`

Headers:
- `Authorization: Bearer <token>`

Body:
```json
{
  "subject_id": "IT003",
  "stt": 3
}
```

### 5. Xóa môn học khỏi danh sách
**DELETE** `/api/subject-open/:id/subjects/:subject_id`

Headers:
- `Authorization: Bearer <token>`

### 6. Xóa toàn bộ danh sách
**DELETE** `/api/subject-open/:id`

Headers:
- `Authorization: Bearer <token>`

### 7. Toggle Public/Private
**PATCH** `/api/subject-open/:id/toggle-public`

Headers:
- `Authorization: Bearer <token>`

Body:
```json
{
  "isPublic": true
}
```

### 8. Validate danh sách
**GET** `/api/subject-open/:id/validate`

Headers:
- `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "validation": {
    "valid": false,
    "message": "Danh sách môn học mở chưa đủ theo chương trình đào tạo",
    "missingByMajor": [...]
  }
}
```

## Quy trình sử dụng

### Dành cho Admin

#### 1. Import từ Excel
1. Chuẩn bị file Excel theo template:
   ```
   STT | Môn học
   1   | IT001
   2   | IT002
   3   | IT003
   ```
2. Truy cập `/app/admin/subject-open`
3. Click "Import từ Excel"
4. Chọn năm học, học kỳ và file Excel
5. Click "Import"
6. Hệ thống sẽ kiểm tra:
   - Môn học có tồn tại không
   - Danh sách có đủ theo CTĐT không
7. Nếu hợp lệ → lưu ở chế độ Private
8. Nếu thiếu môn → hiện thông báo chi tiết

#### 2. Thêm môn học thủ công
1. Chọn danh sách muốn thêm môn
2. Click "Thêm môn"
3. Nhập mã môn học và STT
4. Click "Thêm"
5. Hệ thống sẽ validate (có warning nếu chưa đủ)

#### 3. Xóa môn học
1. Tìm môn học trong danh sách
2. Click icon Delete
3. Xác nhận xóa

#### 4. Public danh sách
1. Toggle switch "Public" ở danh sách
2. Danh sách sẽ hiển thị cho user

#### 5. Kiểm tra danh sách
1. Click "Kiểm tra" ở danh sách
2. Xem kết quả validation:
   - ✅ Hợp lệ: Tất cả môn theo CTĐT đã có
   - ⚠️ Thiếu môn: Chi tiết từng ngành thiếu những môn nào

#### 6. Xóa toàn bộ danh sách
1. Click icon Delete ở header danh sách
2. Xác nhận xóa

### Dành cho User
1. Truy cập `/app/subject-open`
2. Chỉ xem được các danh sách có `isPublic = true`
3. Xem thông tin môn học, tín chỉ

## Validation Rules

### 1. Kiểm tra môn học tồn tại
- Tất cả môn học trong danh sách phải có trong collection `subject`
- Nếu có môn không tồn tại → báo lỗi và không cho import/thêm

### 2. Kiểm tra với chương trình đào tạo
- Lấy tất cả `training_programs` của học kỳ đó
- Kiểm tra từng ngành:
  - Tất cả môn trong CTĐT phải có trong danh sách môn học mở
  - Nếu thiếu → báo lỗi chi tiết theo từng ngành
- **Bắt buộc khi import**: Phải đủ môn mới cho import
- **Warning khi thêm manual**: Vẫn cho thêm nhưng có cảnh báo

## Tạo Template Excel

Chạy script để tạo file template mẫu:
```bash
cd backend
node src/config/createTemplate.js
```

File template sẽ được tạo tại: `backend/src/config/output/template_mon_hoc_mo.xlsx`

## Frontend Routes

- `/app/subject-open` - Trang xem môn học mở (User & Admin)
- `/app/admin/subject-open` - Trang quản lý môn học mở (Admin only)

## Dependencies

Backend:
- `multer` - Upload file
- `xlsx` - Parse Excel

Frontend:
- `@mui/material` - UI components
- `axios` - HTTP client

## Lưu ý

1. **Chế độ Private mặc định**: Khi tạo danh sách mới, mặc định là Private (chỉ admin xem được)
2. **Validation nghiêm ngặt**: Import phải đủ môn theo CTĐT, thêm manual có warning nhưng vẫn cho thêm
3. **Không duplicate**: Mỗi cặp (academicYear, semester) chỉ có 1 danh sách
4. **Populate subject info**: API tự động lấy thêm tên môn, tín chỉ từ collection subject
5. **Admin only**: Tất cả thao tác CUD đều cần quyền admin

## Troubleshooting

### 1. Import bị lỗi "Có môn học không tồn tại"
→ Kiểm tra mã môn học trong Excel có chính xác không
→ Kiểm tra môn học đã có trong database chưa

### 2. Import bị lỗi "Danh sách chưa đủ"
→ Xem chi tiết từng ngành thiếu môn gì
→ Thêm các môn còn thiếu vào Excel
→ Import lại

### 3. Không toggle được Public
→ Kiểm tra quyền admin
→ Kiểm tra API có hoạt động không

### 4. User không thấy danh sách
→ Kiểm tra admin đã toggle Public chưa
→ Kiểm tra filter academicYear, semester có đúng không
