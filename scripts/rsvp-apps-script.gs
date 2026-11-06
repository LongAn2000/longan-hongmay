/**
 * Nhận xác nhận tham dự (RSVP) của thiệp Long An & Hồng Mây vào Google Sheet.
 *
 * Sheet nhận dữ liệu: "longan-hongmay"
 *   https://docs.google.com/spreadsheets/d/1u4SUiQkYt7f_iaX1p0yR38GWwbRKQEanNE-Z5JBV3Lw/edit
 *
 * Cài đặt:
 * 1. Mở Sheet trên → Tiện ích mở rộng → Apps Script, xoá code mẫu, dán toàn bộ file này vào, bấm Lưu.
 * 2. Triển khai → Tùy chọn triển khai mới → loại "Ứng dụng web":
 *      Thực thi với tư cách: Tôi
 *      Người có quyền truy cập: Bất kỳ ai
 *    Bấm Triển khai, cấp quyền, rồi chép "URL ứng dụng web" (đuôi /exec) vào rsvpEndpoint trong src/config.js.
 * Sửa script về sau: Triển khai → Quản lý triển khai → sửa (bút chì) → Phiên bản: Phiên bản mới, để giữ nguyên URL.
 *
 * Tab đầu tiên: mỗi lần khách gửi form thêm một dòng (tự thêm dòng tiêu đề nếu tab còn trống).
 *   - Xác nhận tham dự: cột "Có đi không" là Có / Không.
 *   - Lời chúc gửi từ khung "Lời Chúc" (không kèm xác nhận): cột "Có đi không" ghi "Lời chúc", số người để trống.
 *
 * Đọc lời chúc (doGet): thiệp gọi URL /exec bằng GET để lấy cột "Tên" + "Lời nhắn" của mọi dòng có lời nhắn,
 * hiển thị ở phần Lời Chúc và cột chữ chạy bên trái. Chỉ trả về tên và lời nhắn, không trả số người hay có đi không.
 * Muốn ẩn một lời chúc: xoá nội dung ô "Lời nhắn" của dòng đó.
 */

const SPREADSHEET_ID = '1u4SUiQkYt7f_iaX1p0yR38GWwbRKQEanNE-Z5JBV3Lw';
const HEADERS = ['Thời gian', 'Tên', 'Có đi không', 'Số người tham dự', 'Lời nhắn'];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const isWish = data.type === 'wish';
    rsvpSheet().appendRow([
      new Date(data.createdAt || Date.now()),
      clean(data.name),
      isWish ? 'Lời chúc' : data.attending === 'yes' ? 'Có' : 'Không',
      isWish ? '' : Number(data.guests) || 0,
      clean(data.note),
    ]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const sheet = rsvpSheet();
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues() : [];
  const wishes = rows
    .filter(row => String(row[4]).trim())
    .map(row => ({
      name: String(row[1]).trim().replace(/^'/, ''),
      text: String(row[4]).trim().replace(/^'/, ''),
      time: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
    }))
    .slice(-500);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, wishes })).setMimeType(ContentService.MimeType.JSON);
}

function rsvpSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Chạy tay một lần trong trình soạn Apps Script để cấp quyền và tạo dòng tiêu đề.
function setup() {
  rsvpSheet();
}

// Chặn công thức: ô bắt đầu bằng = + - @ sẽ được thêm dấu ' để Sheet hiểu là chữ.
function clean(value) {
  const s = String(value || '').slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
