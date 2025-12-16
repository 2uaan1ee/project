# 🚀 QUICK START - Quản lý Môn học Mở

## 🎯 Mục đích
Hướng dẫn nhanh để Admin quản lý danh sách môn học mở cho mỗi học kỳ.

---

## 📋 Bước 1: Truy cập trang quản lý

1. Đăng nhập với tài khoản Admin
2. Vào Dashboard → Click "**📚 Quản lý môn học mở (Admin)**"
3. URL: `http://localhost:5173/app/admin/subject-open`

---

## 📥 Bước 2: Import danh sách từ Excel

### 2.1. Tải template Excel
File template tại: `backend/src/config/output/template_mon_hoc_mo.xlsx`

Hoặc tạo mới:
```bash
cd backend
npm run create:template
```

### 2.2. Điền dữ liệu vào Excel

**Format:**
| STT | Môn học |
|-----|---------|
| 1   | IT001   |
| 2   | IT002   |
| 3   | IT003   |

**Lưu ý:**
- Cột "STT" hoặc "Stt": Số thứ tự
- Cột "Môn học" hoặc "Mã môn học" hoặc "subject_id": Mã môn học
- Mã môn học phải tồn tại trong database
- Phải đủ môn theo chương trình đào tạo của các ngành

### 2.3. Import vào hệ thống

1. Click "**Import từ Excel**"
2. Chọn:
   - **Năm học**: VD: 2025-2026
   - **Học kỳ**: HK1, HK2, hoặc HK3
   - **File Excel**: Chọn file đã chuẩn bị
3. Click "**Import**"

### 2.4. Xử lý kết quả

#### ✅ Thành công
- Hiển thị: "Import danh sách môn học mở thành công"
- Danh sách được tạo ở chế độ **Private** (chỉ Admin xem được)

#### ❌ Lỗi: Môn học không tồn tại
```
Có môn học không tồn tại trong hệ thống: IT999, IT888
```
→ **Sửa**: Kiểm tra lại mã môn trong Excel

#### ⚠️ Lỗi: Thiếu môn theo CTĐT
Dialog hiển thị chi tiết:
```
Danh sách môn học mở chưa đủ theo chương trình đào tạo

Công nghệ phần mềm - KHOA_CNPM
Còn thiếu 3 môn: IT001, IT002, IT003

Khoa học máy tính - KHOA_KHMT
Còn thiếu 2 môn: IT004, IT005
```
→ **Sửa**: Thêm các môn còn thiếu vào Excel và import lại

---

## ➕ Bước 3: Thêm môn học thủ công

Nếu quên một vài môn, có thể thêm sau:

1. Tìm danh sách cần thêm môn
2. Click "**Thêm môn**"
3. Nhập:
   - **Mã môn học**: VD: IT004
   - **Số thứ tự**: VD: 4
4. Click "**Thêm**"

**Lưu ý**: 
- Có thể có warning nếu chưa đủ CTĐT
- Vẫn cho phép thêm (không chặn)

---

## 👁️ Bước 4: Công khai danh sách cho User

Danh sách mới tạo luôn ở chế độ **Private** (ẩn).

Để cho User xem:
1. Tìm danh sách cần công khai
2. Bật switch "**Public**"
3. User có thể xem tại `/app/subject-open`

---

## 🔍 Bước 5: Kiểm tra danh sách

Để chắc chắn danh sách đã đủ môn theo CTĐT:

1. Click "**Kiểm tra**"
2. Xem kết quả:

### ✅ Hợp lệ
```
✓ Danh sách hợp lệ
Danh sách môn học mở hợp lệ
```

### ⚠️ Chưa đủ
```
⚠ Danh sách chưa đủ
Danh sách môn học mở chưa đủ theo chương trình đào tạo

Chi tiết từng ngành thiếu môn gì...
```

---

## 🗑️ Bước 6: Xóa môn hoặc danh sách

### Xóa 1 môn
1. Tìm môn trong danh sách
2. Click icon **Delete** (🗑️)
3. Xác nhận

### Xóa toàn bộ danh sách
1. Click icon **Delete** ở header danh sách
2. Xác nhận

**Cảnh báo**: Không thể khôi phục!

---

## 📊 Bước 7: Quản lý nhiều học kỳ

Hệ thống hỗ trợ nhiều danh sách:
- 2025-2026 HK1
- 2025-2026 HK2
- 2025-2026 HK3
- 2026-2027 HK1
- ...

Mỗi danh sách độc lập với nhau.

---

## 💡 Tips

### 1. Chuẩn bị file Excel trước
- Lấy danh sách môn từ chương trình đào tạo
- Đảm bảo đủ môn cho tất cả ngành trong học kỳ đó
- Kiểm tra mã môn có đúng không

### 2. Import từng học kỳ
- HK1 trước → HK2 → HK3
- Mỗi học kỳ có CTĐT riêng

### 3. Giữ Private khi chưa chắc chắn
- Import xong kiểm tra lại
- Chỉ Public khi đã hoàn chỉnh

### 4. Sử dụng "Kiểm tra" thường xuyên
- Trước khi Public
- Sau khi thêm/xóa môn

### 5. Backup file Excel
- Lưu file Excel gốc
- Dễ dàng import lại nếu cần

---

## 🆘 Xử lý sự cố

### File Excel không đúng format
→ Dùng file template: `backend/src/config/output/template_mon_hoc_mo.xlsx`

### Import bị lỗi validation
→ Xem chi tiết dialog, thêm môn còn thiếu

### Không toggle được Public
→ Kiểm tra quyền Admin, refresh trang

### User không thấy danh sách
→ Kiểm tra đã toggle Public chưa

---

## 📞 Liên hệ hỗ trợ

Nếu gặp vấn đề, xem thêm:
- `SUBJECT_OPEN_GUIDE.md` - Hướng dẫn chi tiết
- `API_TEST.md` - Test cases
- `SUMMARY.md` - Tổng quan hệ thống

---

## ✅ Checklist Admin

- [ ] Đã tải template Excel
- [ ] Đã điền đầy đủ mã môn học
- [ ] Đã kiểm tra mã môn tồn tại
- [ ] Đã đảm bảo đủ môn theo CTĐT
- [ ] Đã import thành công
- [ ] Đã kiểm tra validation
- [ ] Đã toggle Public (nếu cần)
- [ ] User đã xem được danh sách

---

**Chúc Admin quản lý hiệu quả!** 🎉
