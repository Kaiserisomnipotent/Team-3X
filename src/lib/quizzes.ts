// CHỈ DÙNG TRÊN SERVER: chứa đáp án. Không import file này vào component 'use client'.
import 'server-only';
import type { Quiz } from './types';
export const QUIZZES: Quiz[] = [
  { id:'q1', title:'Module 1 · TTCK & SSI', qs:[
    { q:'Phiên giao dịch buổi sáng trên TTCK Việt Nam diễn ra lúc nào?', a:['9:00 – 11:30','8:30 – 11:00','9:15 – 12:00','9:00 – 12:30'], c:0 },
    { q:'Mua cổ phiếu hôm nay, cổ phiếu về tài khoản khi nào?', a:['Ngay trong ngày (T+0)','T+1','T+2','T+3'], c:2 },
    { q:'Trên bảng điện, giá hiển thị màu tím nghĩa là gì?', a:['Giá sàn','Giá trần','Giá tham chiếu','Giá đang giảm'], c:1 },
    { q:'Sàn nào dành cho doanh nghiệp chưa niêm yết chính thức?', a:['HOSE','HNX','UPCoM','VN30'], c:2 },
    { q:'Phí giao dịch mặc định của SSI là bao nhiêu?', a:['0,15%','0,25%','0,35%','0,50%'], c:1 },
  ]},
  { id:'q2', title:'Module 2–3 · Phân tích cơ bản & kỹ thuật', qs:[
    { q:'Theo phương pháp Top-Down, dòng tiền chảy theo thứ tự nào?', a:['Cổ phiếu → doanh nghiệp → ngành → vĩ mô','Vĩ mô → ngành → doanh nghiệp → cổ phiếu','Ngành → vĩ mô → cổ phiếu → doanh nghiệp','Doanh nghiệp → cổ phiếu → vĩ mô → ngành'], c:1 },
    { q:'RSI trên 70 thường cho thấy điều gì?', a:['Quá bán, có thể hồi phục','Quá mua, rủi ro điều chỉnh','Xu hướng tăng đã được xác nhận','Tín hiệu mua an toàn'], c:1 },
    { q:'Giá tăng nhưng volume thấp nói lên điều gì?', a:['Xu hướng rất bền','Dòng tiền lớn đang vào','Dễ đảo chiều','Không có ý nghĩa'], c:2 },
    { q:'Nguyên tắc cắt lỗ được đưa ra trong tài liệu là bao nhiêu?', a:['2–3%','7–10%','15–20%','Không cần cắt lỗ'], c:1 },
    { q:'Lệnh giải ngân đầu tiên nên chiếm bao nhiêu vốn dự kiến?', a:['20–30%','50%','70%','100%'], c:0 },
  ]},
  { id:'q3', title:'Quy trình · Tuyển dụng, Zalo, mở TK, CSKH', qs:[
    { q:'Mỗi ngày cần nhắn tối thiểu bao nhiêu khách qua Zalo?', a:['20','30','50','100'], c:2 },
    { q:'Vì sao tin nhắn Zalo đầu tiên phải gói gọn trong một tin?', a:['Cho chuyên nghiệp','Zalo chặn tin thứ 2 với người chưa kết bạn','Để khách đọc nhanh hơn','Quy định của SSI'], c:1 },
    { q:'Ở bước 2 khi hướng dẫn khách mở tài khoản, ô nào bắt buộc phải điền đúng?', a:['Địa chỉ nhà','ID người giới thiệu','Tên ngân hàng','Mã chứng khoán quan tâm'], c:1 },
    { q:'Sau khi khách tạo tài khoản xong, bạn phải nhắc khách làm gì?', a:['Nộp tối thiểu 10 triệu','Ký hợp đồng số','Đăng ký margin','Chuyển ID sang người khác'], c:1 },
    { q:'Thời điểm tốt nhất để chốt mở tài khoản là khi nào?', a:['Ngay tin nhắn đầu tiên','Khi thị trường giảm mạnh','Ngay sau khi vừa mang lại giá trị cụ thể cho khách','Cuối tháng để kịp KPI'], c:2 },
  ]},
  { id:'q4', title:'TikTok · Livestream & phòng vệ kênh', qs:[
    { q:'Trên livestream, thay cho “Zalo/Facebook” bạn dùng từ nào?', a:['“Nhóm kín”','“Cộng đồng”','“Link bio”','Nói tắt “Zl”, “Fb”'], c:1 },
    { q:'Khi nào mới bắt đầu kêu gọi người xem vào room?', a:['Ngay buổi live đầu tiên','Khi đã gắn link bio và mắt xem trung bình trên 20','Khi có 1.000 follow','Khi leader cho phép'], c:1 },
    { q:'Tần suất kêu gọi hành động (CTA) hợp lý là?', a:['Mỗi 2–3 phút','Mỗi 10–15 phút','Mỗi 30 phút','Chỉ cuối buổi'], c:1 },
    { q:'Câu nào vi phạm chính sách TikTok?', a:['“Mọi người nghĩ mai tăng thì bình luận số 1”','“Follow để xem phân tích buổi sau”','“Mua mã này chắc chắn lãi 100%”','“Trong cộng đồng có danh sách theo dõi”'], c:2 },
    { q:'Live xong tại công ty, việc cần làm với WiFi là?', a:['Giữ nguyên SSI_NHC_Livestream','Ngắt SSI_NHC_Livestream, chuyển sang SSI-MG hoặc SSI_Investors','Tắt WiFi điện thoại','Đổi mật khẩu WiFi'], c:1 },
  ]},
];
