![Ảnh minh họa](https://static.ssan.me/am-coding-dashboard.jpeg)

Một ứng dụng bảng tin thời sự hiện đại, đáp ứng mọi thiết bị, cung cấp cho người dùng các bài báo mới nhất, chức năng tìm kiếm và chi tiết bài viết với giao diện thân thiện, dễ sử dụng.

## ✨ Tính Năng Chính

### 1. Bảng Tin
- Xem danh sách các bài báo mới nhất được phân trang
- Mỗi bài báo hiển thị:
  - Tiêu đề và mô tả
  - Ngày đăng tải
  - Thông tin nguồn
  - Hình ảnh bài viết
  - Thời gian đọc

### 2. Tìm Kiếm
- Tìm kiếm bài báo theo từ khóa
- Kết quả tìm kiếm theo thời gian thực
- Chức năng xóa tìm kiếm

### 3. Chi Tiết Bài Viết
- Xem chi tiết bài báo đã chọn
- Hiển thị đầy đủ nội dung bài viết
- Điều hướng quay lại danh sách

### 4. Giao Diện Người Dùng
- Thiết kế hiện đại, tối giản
- Bố cục đáp ứng trên mọi thiết bị
- Trạng thái tải để cải thiện trải nghiệm
- Xử lý lỗi và trạng thái rỗng

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

### Cài Đặt
1. Sao chép kho lưu trữ:
   ```bash
   git clone [đường-dẫn-kho-lưu-trữ]
   ```
2. Di chuyển vào thư mục dự án:
   ```bash
   cd am-coding-test-front
   ```
3. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   # hoặc
   yarn install
   ```

### Chạy Ứng Dụng
```bash
npm run dev
```

Truy cập [https://am-coding-test-front.pages.dev/](https://am-coding-test-front.pages.dev/) để xem ứng dụng trên trình duyệt.

## 🔄 Xử Lý Giới Hạn Request (429)

### Cơ Chế Cache
- Dữ liệu tin tức được lưu trữ tạm thời trong bộ nhớ trình duyệt (localStorage)
- Mỗi khi tải dữ liệu mới, hệ thống sẽ kiểm tra thời gian cache (mặc định 5 phút)
- Nếu dữ liệu trong cache vẫn còn hiệu lực, ứng dụng sẽ sử dụng dữ liệu đã lưu thay vì gọi API

### Xử Lý Rate Limiting
1. **Phát Hiện Rate Limiting**:
   - Bắt lỗi khi gọi API trả về mã lỗi 429 (Quá nhiều request)
   - Hiển thị thông báo thân thiện cho người dùng

2. **Chiến Lược Xử Lý**:
   - Tự động chuyển sang sử dụng dữ liệu đã cache (localStorage) nếu có
   - Hiển thị thông báo "Đang sử dụng dữ liệu đã lưu"

![Ảnh minh họa](https://static.ssan.me/cached-when-429-thrown.jpeg)

## 🛠️ Công Nghệ Sử Dụng

- [Vue.js](https://vuejs.org/) - Framework JavaScript tiến bộ
- [Vue Router](https://router.vuejs.org/) - Bộ định tuyến chính thức cho Vue.js
- [Axios](https://axios-http.com/) - Thư viện HTTP dựa trên Promise
- [Date-fns](https://date-fns.org/) - Thư viện tiện ích xử lý ngày tháng

