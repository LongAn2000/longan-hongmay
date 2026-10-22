# Thiệp cưới Long An & Hồng Mây

Bản giao diện local dùng tông kem–be, nền lụa và giấy theo thiệp tham khảo:
https://www.nawngs.com/nhatlongphuonganh

Bố cục gồm ảnh bìa chia cột, phong bì ảnh, khung lời mời oval, đếm ngược, chương trình ngày cưới, chân dung cô dâu chú rể và album. Các tài nguyên trang trí của mẫu được lưu tại `public/assets/theme-*`. Ảnh cưới được chọn ngẫu nhiên từ album cá nhân, đã thay toàn bộ ảnh minh họa của phiên bản trước. Ảnh và nhạc dùng các đường dẫn trong `src/config.js`.

HTML + CSS + JavaScript thuần, Vite để chạy local và build. Không cần PHP, XAMPP hay database cho bản giao diện này.

## Chạy trên máy Windows hiện tại

Nhấp đúp **start.cmd**, hoặc mở terminal mới sau khi khởi động lại IDE:

```powershell
cd D:\longan-hongmay
npm.cmd run dev
```

Mở địa chỉ Local do terminal hiển thị, thường là http://localhost:5173. Giữ terminal chạy khi xem thiệp; Ctrl+C để dừng. `start.cmd` tự mở trình duyệt và tự tìm Node đã cài.

Node.js v24.22.0 LTS và npm được cài tại `%LOCALAPPDATA%\WeddingDev\node-v24.22.0-win-x64`, đã thêm vào PATH của tài khoản hiện tại. Không cần quyền quản trị. Terminal/IDE đang mở cần khởi động lại để nhận PATH mới.

## Chỉnh nội dung

- **src/config.js**: tên cô dâu chú rể, ngày giờ, gia đình, địa điểm, bản đồ, ảnh, album, nhạc, QR mừng cưới.
- **src/style.css**: giao diện và hiệu ứng. Điện thoại dùng khung tối đa 430px; từ màn hình 768px, khung đạt tối đa 573px trên máy tính. Các khung lễ cưới oval xếp dọc để nội dung dễ đọc.
- **src/main.js**: dựng nội dung, đếm ngược và xử lý nhạc, album, ký tên, RSVP.
- **public/assets/**: ảnh, font và nhạc đã tải về để trang chạy không phụ thuộc mạng.

**Ngày cưới, giờ, địa điểm và thông tin gia đình hiện tại là dữ liệu minh họa.** Nhạc nền là “Một Nhà” — Da LAB, nhập từ file MP3 do bạn cung cấp và lưu tại `public/assets/mot-nha-da-lab.mp3`. Chưa cài QR ngân hàng vì chưa có QR của bạn.

### Ảnh cưới cá nhân

Đã thay 9 ảnh dùng trong các phần thiệp, 16 ảnh album và `share.jpg` bằng 26 ảnh khác nhau từ `C:\Users\NC\Pictures\album`. Bản dùng cho web được xoay theo EXIF, thu nhỏ cạnh dài tối đa 2000px và lưu JPEG chất lượng 88; ảnh gốc trong thư mục Pictures giữ nguyên. Bảng đối chiếu tên ảnh nằm trong `scripts/imported-photos.json`.

Để chọn ngẫu nhiên lại từ cùng album, chạy:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/import-album.ps1 -AlbumPath 'C:\Users\NC\Pictures\album'
```

Script ghi đè 26 ảnh trong project. Các nhóm chân dung riêng được khai báo theo tên ảnh trong script cho album này. Chỉnh `imagePositions` trong `src/config.js` nếu cần dịch khung ảnh để thấy rõ khuôn mặt; `50% 50%` là chính giữa.

Ví dụ thay QR:

```js
gifts: [
  {
    name: 'Long An',
    role: 'Chú rể',
    qrImage: '/assets/qr-long-an.png',
    bank: 'Tên ngân hàng chú rể',
    account: 'Số tài khoản chú rể',
  },
  {
    name: 'Hồng Mây',
    role: 'Cô dâu',
    qrImage: '/assets/qr-hong-may.png',
    bank: 'Tên ngân hàng cô dâu',
    account: 'Số tài khoản cô dâu',
  },
],
```

Đặt ảnh QR tại `public/assets/qr-long-an.png` và `public/assets/qr-hong-may.png`. Mỗi người có QR, ngân hàng và nút sao chép tài khoản riêng. Khi chưa có QR, thiệp hiển thị thông báo chờ cập nhật; để trống ngân hàng/tài khoản sẽ ẩn các thông tin tương ứng.

## Phạm vi bản local

- Trang mở trực tiếp ở ảnh bìa; cuộn xuống để xem lời mời. Hiệu ứng cuộn có hỗ trợ giảm chuyển động theo cài đặt thiết bị.
- Nhạc nền phát sau lần tương tác đầu tiên, có nút bật/tắt.
- Đếm ngược theo `date` và giờ sự kiện cùng ngày trong cấu hình, múi giờ Việt Nam (UTC+7); về 0 khi tới ngày cưới. Chương trình hiển thị các sự kiện từ `events`.
- Album 16 ảnh, ảnh thu nhỏ, vuốt trên điện thoại, phóng to; phím mũi tên và Escape trong chế độ phóng to. Chuyển ảnh trượt mềm 700ms: bấm phải thì ảnh mới vào từ bên phải, bấm trái thì ảnh mới vào từ bên trái. Chờ ảnh tải xong để tránh khung trống; chế độ giảm chuyển động đổi ảnh trực tiếp.
- Lịch tự sinh theo ngày cấu hình, đánh dấu các sự kiện cùng tháng.
- Lưu bút ba bước: nhập chữ ký, chọn vị trí/màu, nhập lời chúc.
- Xác nhận tham dự và số người đi cùng.
- Lời chúc và RSVP chỉ lưu ở localStorage trên trình duyệt hiện tại. Không có API, không đồng bộ sang thiết bị khác và chưa có trang quản trị.
- Các nút bản đồ, tải QR và sao chép tài khoản xuất hiện khi điền thông tin tương ứng trong config.

## Build và kiểm tra

```powershell
npm.cmd run build
npm.cmd run preview
```

Kết quả build nằm trong `dist/`. Chạy kiểm tra giao diện bằng Chrome đã cài:

```powershell
npm.cmd run test:ui
```

Ảnh chụp kiểm tra nằm trong `test-results/`. Thư viện kiểm thử không cài thêm trình duyệt.

Nếu chuyển project sang máy khác: cài Node.js LTS, chạy `npm.cmd ci`, sau đó `npm.cmd run dev`.

## GitHub Pages

Thiệp được xuất bản tại https://longan2000.github.io/longan-hongmay/.
Mỗi lần đẩy thay đổi lên nhánh `main`, workflow `.github/workflows/deploy.yml` tự cài thư viện, build và triển khai thư mục `dist/` lên GitHub Pages.

Chạy `npm.cmd run dev` để chỉnh sửa tại http://127.0.0.1:5173/.
Để xem đúng bản build dùng trên Pages, chạy `npm.cmd run build` rồi `npm.cmd run preview` và mở http://127.0.0.1:4173/longan-hongmay/.
`vite.config.js` đặt đường dẫn gốc cho bản build; các ảnh, nhạc và QR trong cấu hình vẫn có thể khai báo dạng `/assets/ten-file`.
