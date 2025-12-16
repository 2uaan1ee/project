# Test API Môn học Mở

## Setup
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test API (hoặc dùng Postman/Thunder Client)
```

## 1. Login để lấy token (Admin)
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@uit.edu.vn",
  "password": "your_password"
}

# Response: Lấy token từ response.token
```

## 2. Lấy danh sách môn học mở (Admin xem tất cả)
```bash
GET http://localhost:5000/api/subject-open
Authorization: Bearer <token>

# Hoặc filter theo năm học và học kỳ
GET http://localhost:5000/api/subject-open?academicYear=2025-2026&semester=HK2
Authorization: Bearer <token>
```

## 3. Lấy danh sách môn học mở (User chỉ xem public)
```bash
# User login và lấy token khác
GET http://localhost:5000/api/subject-open
Authorization: Bearer <user_token>

# Response: Chỉ trả về danh sách có isPublic = true
```

## 4. Import từ Excel
```bash
POST http://localhost:5000/api/subject-open/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Form data:
# - file: <chọn file Excel>
# - academicYear: 2025-2026
# - semester: HK2

# Response success:
{
  "success": true,
  "message": "Import danh sách môn học mở thành công",
  "data": {...}
}

# Response error (môn không tồn tại):
{
  "success": false,
  "message": "Có môn học không tồn tại trong hệ thống",
  "invalidSubjects": ["IT999"]
}

# Response error (thiếu môn theo CTĐT):
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

## 5. Tạo/Cập nhật danh sách (Manual)
```bash
POST http://localhost:5000/api/subject-open
Authorization: Bearer <token>
Content-Type: application/json

{
  "academicYear": "2025-2026",
  "semester": "HK2",
  "subjects": [
    { "stt": 1, "subject_id": "IT001" },
    { "stt": 2, "subject_id": "IT002" },
    { "stt": 3, "subject_id": "IT003" }
  ]
}
```

## 6. Thêm môn học vào danh sách
```bash
# Lấy ID của danh sách từ step 2
POST http://localhost:5000/api/subject-open/<list_id>/subjects
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject_id": "IT004",
  "stt": 4
}

# Response có warning nếu chưa đủ môn:
{
  "success": true,
  "message": "Thêm môn học thành công (có cảnh báo)",
  "warning": "Danh sách môn học mở chưa đủ theo chương trình đào tạo",
  "missingByMajor": [...]
}
```

## 7. Xóa môn học khỏi danh sách
```bash
DELETE http://localhost:5000/api/subject-open/<list_id>/subjects/IT004
Authorization: Bearer <token>
```

## 8. Toggle Public/Private
```bash
PATCH http://localhost:5000/api/subject-open/<list_id>/toggle-public
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPublic": true
}

# Hoặc không cần body, tự động toggle:
PATCH http://localhost:5000/api/subject-open/<list_id>/toggle-public
Authorization: Bearer <token>
```

## 9. Validate danh sách
```bash
GET http://localhost:5000/api/subject-open/<list_id>/validate
Authorization: Bearer <token>

# Response (hợp lệ):
{
  "success": true,
  "validation": {
    "valid": true,
    "message": "Danh sách môn học mở hợp lệ",
    "missingByMajor": []
  }
}

# Response (chưa đủ):
{
  "success": true,
  "validation": {
    "valid": false,
    "message": "Danh sách môn học mở chưa đủ theo chương trình đào tạo",
    "missingByMajor": [
      {
        "major": "Công nghệ phần mềm",
        "faculty": "KHOA_CNPM",
        "missingSubjects": ["IT005", "IT006"]
      }
    ]
  }
}
```

## 10. Xóa toàn bộ danh sách
```bash
DELETE http://localhost:5000/api/subject-open/<list_id>
Authorization: Bearer <token>
```

## Test Cases

### TC1: Import file Excel hợp lệ
1. Tạo file Excel với các môn hợp lệ và đủ theo CTĐT
2. Import → Kỳ vọng: Success, danh sách được tạo (Private)

### TC2: Import file Excel có môn không tồn tại
1. Tạo file Excel với môn không có trong DB
2. Import → Kỳ vọng: Error, danh sách không được tạo

### TC3: Import file Excel thiếu môn theo CTĐT
1. Tạo file Excel thiếu một số môn bắt buộc
2. Import → Kỳ vọng: Error với chi tiết môn thiếu

### TC4: Thêm môn thủ công
1. Chọn danh sách
2. Thêm môn hợp lệ → Kỳ vọng: Success (có warning nếu chưa đủ)

### TC5: Thêm môn đã tồn tại
1. Thêm môn đã có trong danh sách
2. → Kỳ vọng: Error "Môn học đã tồn tại"

### TC6: Toggle Public
1. Danh sách ở chế độ Private
2. Toggle → Kỳ vọng: isPublic = true
3. User có thể xem được danh sách

### TC7: User xem danh sách Private
1. User login
2. Lấy danh sách → Kỳ vọng: Không thấy danh sách Private

### TC8: Validate danh sách đủ môn
1. Danh sách có đủ môn theo CTĐT
2. Validate → Kỳ vọng: valid = true

### TC9: Validate danh sách thiếu môn
1. Danh sách thiếu một số môn
2. Validate → Kỳ vọng: valid = false, hiển thị chi tiết

### TC10: Xóa môn và xóa danh sách
1. Xóa một môn → Kỳ vọng: Success
2. Xóa toàn bộ danh sách → Kỳ vọng: Success

## Seed Data

Chạy script để tạo dữ liệu mẫu:
```bash
cd backend
node src/config/seedSubjectOpen.js
```

## Create Template Excel

Chạy script để tạo file template:
```bash
cd backend
node src/config/createTemplate.js
```

File sẽ được tạo tại: `backend/src/config/output/template_mon_hoc_mo.xlsx`
