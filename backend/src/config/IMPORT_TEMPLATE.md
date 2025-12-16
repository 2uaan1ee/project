# Template Excel Import Môn Học Mở

## Cấu trúc file Excel

File Excel cần có các cột sau:

| STT | Môn học |
|-----|---------|
| 1   | IT001   |
| 2   | IT002   |
| 3   | IT003   |

## Lưu ý:
1. Cột "STT" hoặc "Stt" - số thứ tự môn học
2. Cột "Môn học" hoặc "Mã môn học" hoặc "subject_id" - mã môn học

## Ví dụ file Excel:

### Sheet1:
```
STT | Môn học
1   | IT001
2   | IT002  
3   | IT003
4   | IT004
5   | IT005
```

## Quy trình import:
1. Chuẩn bị file Excel theo template trên
2. Truy cập trang "Quản lý môn học mở (Admin)"
3. Click nút "Import từ Excel"
4. Chọn năm học và học kỳ
5. Chọn file Excel
6. Click "Import"
7. Hệ thống sẽ tự động kiểm tra:
   - Môn học có tồn tại trong database không
   - Danh sách có đủ môn theo chương trình đào tạo không
8. Nếu hợp lệ, danh sách sẽ được lưu (ở chế độ ẩn)
9. Admin có thể chọn "Public" để công khai cho user xem
