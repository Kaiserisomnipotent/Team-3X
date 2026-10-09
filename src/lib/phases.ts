// Dữ liệu lộ trình 99 ngày — chuyển nguyên từ bản HTML của anh lead.
// Sửa nội dung đầu việc ở đây. Đổi 'id' của đầu việc sẽ làm mất tiến độ đã tick của đầu việc đó.
import type { Phase } from './types';
export const PHASES: Phase[] = [
  { id:'p0', code:'GĐ0', name:'Nhận việc', win:'Ngày 1–3', from:1, to:3, tasks:[
    { id:'t01', t:'Đăng ký Người đồng hành SSI và ký hợp đồng điện tử', d:'Link accounts.ssi.com.vn/collaborator/register · nhập ID người giới thiệu của leader.', link:'#sop-tuyen-dung' },
    { id:'t02', t:'Nộp Đơn xin thực tập (nếu đang là sinh viên)', d:'Mẫu đơn gửi TTKD Nguyễn Hữu Cảnh – Phòng TVCK 25, dán ảnh 3×4.' },
    { id:'t03', t:'Gửi leader lịch lên công ty cố định hằng tuần', d:'Có mặt sinh hoạt cùng team mỗi ngày; nghỉ báo trước kèm lý do.' },
    { id:'t04', t:'Đọc Nội quy & Event Team 3X', d:'Họp phòng T5 15:00, họp team T6 17:00, T6 mặc sơ mi.', link:'#noi-quy' },
    { id:'t05', t:'Cài SSI iBoard Pro, bật Smart OTP', d:'Làm quen bảng giá, đặt lệnh, tài sản (HDSD APP SSI).', link:'#san-pham' },
  ]},
  { id:'p1', code:'GĐ1', name:'Nền tảng', win:'Tuần 1–2 · đến ngày 14', from:4, to:14, tasks:[
    { id:'t06', t:'Học Module 1: Về SSI & tổng quan TTCK', d:'Làm bài kiểm tra Module 1, đạt từ 4/5.', link:'#kien-thuc', quiz:'q1' },
    { id:'t07', t:'Đọc trọn Hướng dẫn Newbie chứng khoán', d:'Sản phẩm, bảng giá, FA/TA cơ bản, quản lý vốn, lộ trình nhà đầu tư mới.', link:'#tai-lieu' },
    { id:'t08', t:'Nắm 5 sản phẩm vay & S-Cash', d:'Margin tiêu chuẩn, M+, T7, Nhập cuộc, S-Cash.', link:'#san-pham' },
    { id:'t09', t:'Tạo kênh TikTok và đạt 50 follow', d:'4 bước: tạo tài khoản → tên kênh → cá nhân hoá → kích hoạt.', link:'#sop-tiktok' },
    { id:'t10', t:'Livestream tuần 1: ca 6:30 sáng, tối thiểu 90 phút', d:'Tuần 2 thêm ca 16:00 tại công ty. 21 ngày đầu không bỏ buổi nào.', link:'#sop-tiktok', rep:'Hằng ngày' },
    { id:'t11', t:'Đăng TikTok Notes mỗi ngày, 3 bài tốt nhất lên sheet', d:'Hạn 23:59 hằng ngày trên sheet TEAM 3X - TIKTOK.', link:'#sop-tiktok', rep:'Hằng ngày' },
    { id:'t12', t:'Mở mới 3 tài khoản mỗi tuần (tuần 1–2)', d:'Luôn nhập đúng ID người giới thiệu, rồi ghi vào Số liệu kinh doanh ở Bảng của tôi.', link:'#sop-mo-tk', rep:'Hằng tuần' },
  ]},
  { id:'p2', code:'GĐ2', name:'Kiến thức & kênh', win:'Tuần 3–8 · đến ngày 56', from:15, to:56, tasks:[
    { id:'t13', t:'Học Module 2: Phân tích cơ bản Top-Down', d:'Trả lời được 5 câu vĩ mô thế giới và 8 câu vĩ mô Việt Nam.', link:'#kien-thuc', quiz:'q2' },
    { id:'t14', t:'Học Module 3: Phân tích kỹ thuật', d:'Nến, hỗ trợ – kháng cự, volume, EMA, RSI, Dow, Elliott.', link:'#kien-thuc', quiz:'q2' },
    { id:'t15', t:'Học Module 4: Quy trình chăm sóc khách hàng', d:'Biết → Hiểu → Tin tưởng → Đồng hành; xử lý từ chối.', link:'#sop-cskh', quiz:'q3' },
    { id:'t16', t:'Livestream GĐ1: 60 phút × 3 buổi/tuần, tổng view > 300', d:'Tuần 3–4. Từ tuần 3 mỗi ca tối thiểu 120 phút theo nội quy team.', link:'#sop-tiktok', rep:'Hằng tuần' },
    { id:'t17', t:'Livestream GĐ2: 90 phút × 5 buổi/tuần, tổng view > 700', d:'Tuần 5–8. Nhập số liệu mỗi buổi vào sheet.', link:'#sop-tiktok', quiz:'q4', rep:'Hằng tuần' },
    { id:'t18', t:'Sale Zalo 50 tin mỗi ngày', d:'7–8h sáng và 19–22h. Chỉ nhắn trong khoảng data được giao.', link:'#sop-zalo', rep:'Hằng ngày' },
    { id:'t19', t:'Soạn đủ 45 bài tuyển dụng và đăng đều mỗi ngày', d:'4 câu lệnh ChatGPT · mục tiêu team 5 người/tuần.', link:'#sop-tuyen-dung', rep:'Hằng ngày' },
    { id:'t20', t:'Tuần 3 mở 3 TK, từ tuần 4 tối thiểu 1 TK mỗi tuần', d:'Theo dõi ở ô “Tuần này” trong Số liệu kinh doanh.', link:'#sop-mo-tk', rep:'Hằng tuần' },
    { id:'t21', t:'Tham gia game Hiệu suất đầu tư', d:'NAV 500 triệu ảo, mỗi lệnh có luận điểm gửi anh Thịnh.', link:'#noi-quy' },
  ]},
  { id:'p3', code:'GĐ3', name:'Chuyển đổi & chính thức', win:'Tuần 9–14 · đến ngày 99', from:57, to:99, tasks:[
    { id:'t22', t:'Lập room cộng đồng, gắn link bio, tổng view > 1.000', d:'Tuần 9–12. Chỉ kêu gọi khi mắt xem TB > 20, CTA 10–15 phút/lần.', link:'#sop-tiktok' },
    { id:'t23', t:'Mở room VIP, chiến dịch chuyển đổi đầu tiên', d:'Tuần 13–16 · mục tiêu 10 khách hàng mới.', link:'#sop-tiktok' },
    { id:'t24', t:'Học Module 5: Livestream & xây dựng hệ thống', d:'Timeline social sales, kịch bản, phòng vệ kênh.', link:'#sop-tiktok' },
    { id:'t25', t:'Đạt 10 triệu phí net (TTCS & TTPS) trong một tháng', d:'Điều kiện 1 để lên nhân viên chính thức.', link:'#thu-nhap' },
    { id:'t26', t:'Đạt 7 tài khoản mở mới trong cùng tháng', d:'Điều kiện 2 — cần đồng thời với điều kiện 1.', link:'#thu-nhap' },
    { id:'t27', t:'Hoàn thành 4 bài kiểm tra', d:'Mỗi bài từ 4/5 trở lên.', link:'#kiem-tra' },
  ]},
];
