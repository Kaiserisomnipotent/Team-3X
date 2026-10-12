# Học viện Team 3X — Hành trình 99 ngày

Web đào tạo và theo dõi công việc nội bộ cho broker Team 3X (SSI Nguyễn Hữu Cảnh). Nội dung và giao diện lấy từ bản HTML của anh lead (`hoc-vien-team-3x.html`), nâng lên thành web chạy thật: đăng nhập Gmail, dữ liệu chung cho cả team, phân quyền leader.

## Web có gì

**Nhân sự (học viên)**
- Đăng nhập bằng Google. Người lạ đăng nhập được nhưng phải chờ admin duyệt mới xem được nội dung.
- **Bảng của tôi:** đếm ngày 1–99, giai đoạn hiện tại, việc cần làm tiếp, số liệu kinh doanh (TK mới, chuyển ID, phí net) tự cộng theo tuần và kỳ doanh số 20→19, điều kiện lên chính thức.
- **Lộ trình 99 ngày:** 27 đầu việc, 4 giai đoạn, tự báo quá hạn.
- **Bài kiểm tra:** chấm trên server, học viên không sửa được điểm, đáp án không lộ trước khi nộp.
- **Check-in hằng ngày:** làm gì, kết quả, cần anh lead hỗ trợ gì; leader trả lời ngay trên web.
- **Việc được giao:** việc leader giao riêng, cập nhật Chưa làm / Đang làm / Xong.
- **Video bài giảng** (Bunny Stream, link có chữ ký, không tải được).
- **Quy trình chuẩn Q1–Q5, kiến thức, sản phẩm, thu nhập, nội quy, tài liệu**, có nút "Chép" mẫu tin nhắn và ô tìm kiếm (Ctrl K, gõ không dấu được).

**Phân quyền**

| | Nhân sự | Leader | Admin | Chủ sở hữu |
| --- | --- | --- | --- | --- |
| Xem tiến độ, KPI, check-in | của mình | người mình phụ trách | cả team | cả team |
| Giao việc, trả lời hỗ trợ | – | người mình phụ trách | cả team | cả team |
| Mời người mới (tự gửi email) | – | nhân sự vào nhóm mình | leader, nhân sự | cả admin |
| Khoá / xoá tài khoản | – | – | leader, nhân sự | mọi người trừ chủ |
| Thêm video | – | – | có | có |

- **Chủ sở hữu** (tối đa 2 người): không ai khoá, xoá hay hạ quyền được. Chỉ chủ mới thêm, khoá hoặc hạ quyền admin. Bàn giao: chủ cũ bấm "Trao quyền chủ" cho người mới (phải là admin) ở trang Quản lý tài khoản, rồi bấm "Thôi làm chủ".
- **Leader phụ trách:** mỗi nhân sự gắn với một leader. Leader mời ai thì người đó tự vào nhóm leader đó. Admin đổi leader phụ trách ở trang Quản lý tài khoản.
- Các quy tắc trên được kiểm tra cả trên web lẫn trong database.

**Leader / Admin**
- **Tiến độ nhóm / cả team:** ngày, % lộ trình, việc quá hạn, KPI kỳ này, điểm kiểm tra, check-in 7 ngày, việc giao còn mở, ai chưa check-in hôm nay. Bấm tên để xem chi tiết từng người.
- **Nhóm của tôi (leader):** mời người mới bằng Gmail, xem lời mời đã được chấp nhận chưa.
- **Yêu cầu hỗ trợ:** gom từ check-in, trả lời và đánh dấu xong.
- **Giao việc:** giao cho một hoặc nhiều người, có hạn chót.
- **Quản lý tài khoản (admin):** duyệt người mới, gắn leader phụ trách và ngày bắt đầu, khoá hoặc xoá tài khoản khi nghỉ việc, mời trước bằng Gmail, xem trạng thái tài khoản và lời mời.

**Tự động**
- 7:00 sáng mỗi ngày: email nhắc từng nhân sự (việc quá hạn, việc đang trong hạn, việc leader giao sắp đến hạn, nhắc check-in).
- Thứ Hai: admin nhận email tóm tắt tuần của cả team, leader nhận tóm tắt nhóm mình.

**Bảo vệ nội dung**
- Mọi trang cần đăng nhập và được duyệt; phân quyền kiểm tra cả ở web lẫn trong database.
- Chặn bôi đen, chuột phải, Ctrl+C/S/P, in trang. Email người xem hiện mờ khắp màn hình.
- Ghi nhật ký ai vào web lúc nào (leader xem "vào web lần cuối" ở trang chi tiết).
- Không web nào chặn được chụp/quay màn hình: watermark là để truy ra người làm lộ.

---

## Đưa web lên mạng (làm một lần, khoảng 1–2 giờ)

Cần chuẩn bị: một Gmail dùng làm chủ các tài khoản dịch vụ (nên là Gmail của team, không phải Gmail cá nhân), và thẻ thanh toán của anh lead khi lên gói trả phí. Giai đoạn chạy thử dùng gói miễn phí được hết.

### Bước 1 — Đưa code lên GitHub
1. Tạo tài khoản tại github.com.
2. Bấm **New repository**, đặt tên `hoc-vien-3x`, chọn **Private**, bấm Create.
3. Bấm **uploading an existing file**, kéo toàn bộ nội dung thư mục này vào (giải nén file zip trước), bấm **Commit changes**.

### Bước 2 — Tạo database Supabase
1. Vào supabase.com, đăng nhập bằng GitHub, bấm **New project**. Region chọn **Southeast Asia (Singapore)**. Lưu lại mật khẩu database.
2. Vào **SQL Editor > New query**, mở file `supabase/schema.sql`, copy toàn bộ dán vào, bấm **Run**.
3. Mở file `supabase/them-admin.sql`, đổi `email-chu-so-huu@gmail.com` thành Gmail của chủ sở hữu, dán vào SQL Editor, bấm **Run**.
4. Vào **Project Settings > API**, ghi lại 3 thứ: **Project URL**, **anon public key**, **service_role key** (key này bí mật, không gửi cho ai).

### Bước 3 — Bật đăng nhập Google
1. Vào console.cloud.google.com, tạo project mới tên `Hoc vien 3X`.
2. **APIs & Services > OAuth consent screen**: chọn External, điền tên app và email, lưu. Ở mục Publishing status bấm **Publish app** để mọi Gmail đăng nhập được.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**, loại **Web application**. Ở **Authorized redirect URIs** thêm:
   `https://<mã-project>.supabase.co/auth/v1/callback` (lấy đúng Project URL ở bước 2 rồi thêm `/auth/v1/callback`).
4. Copy **Client ID** và **Client secret**, dán vào Supabase: **Authentication > Sign In / Providers > Google**, bật lên, Save.

### Bước 4 — Deploy lên Vercel
1. Vào vercel.com, đăng nhập bằng GitHub, bấm **Add New > Project**, chọn repo `hoc-vien-3x`, bấm Import.
2. Mở **Environment Variables**, thêm từng biến theo file `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (bước 2)
   - `CRON_SECRET`: tự gõ một chuỗi dài bất kỳ
   - `NEXT_PUBLIC_SITE_URL`: tạm để trống, điền sau khi có địa chỉ web
   - Bunny và Resend: điền sau ở bước 5–6
3. Bấm **Deploy**. Sau 1–2 phút có địa chỉ dạng `https://hoc-vien-3x.vercel.app`.
4. Quay lại Vercel thêm `NEXT_PUBLIC_SITE_URL` = địa chỉ đó, rồi vào **Deployments > ... > Redeploy**.
5. Vào Supabase **Authentication > URL Configuration**:
   - **Site URL**: địa chỉ web
   - **Redirect URLs**: thêm `https://<địa-chỉ-web>/auth/callback`
6. Mở web, đăng nhập bằng Gmail của anh lead: vào thẳng với quyền admin. Xong phần chính.

### Bước 5 — Video (Bunny Stream)
1. Vào bunny.net, tạo tài khoản, **Stream > Add Video Library**.
2. Trong thư viện, mục **Security**: bật **Embed view token authentication**, copy **token key**; ở **Allowed domains** thêm địa chỉ web của team (ví dụ `team-3-x.vercel.app`).
3. Mục **API**: copy **Library ID**.
4. Thêm vào Vercel: `BUNNY_LIBRARY_ID`, `BUNNY_TOKEN_KEY`, rồi Redeploy.
5. Thêm video: xem mục **Thêm video bài giảng** bên dưới (làm trên web, không cần sửa code).

### Bước 6 — Email (mời người mới, nhắc 7h sáng, tóm tắt thứ Hai)
Dùng một Gmail của team để gửi. Miễn phí, không cần mua tên miền, gửi được khoảng 500 email/ngày.
1. Đăng nhập Gmail của team (nên tạo riêng, ví dụ `hocvien3x@gmail.com`), vào **myaccount.google.com > Bảo mật**, bật **Xác minh 2 bước**.
2. Vào **myaccount.google.com/apppasswords**, đặt tên `Hoc vien 3X`, bấm **Tạo**. Google hiện **mật khẩu ứng dụng 16 ký tự**: copy lại (chỉ hiện một lần).
3. Thêm vào Vercel: `GMAIL_USER` = Gmail đó, `GMAIL_APP_PASSWORD` = mật khẩu 16 ký tự, rồi Redeploy.
4. Thử: vào Quản lý tài khoản, mời một Gmail của bạn. Thấy "Đã thêm và gửi email mời" là xong.
5. Lịch chạy đã cài sẵn trong `vercel.json` (7:00 giờ Việt Nam). Muốn thử email nhắc ngay: mở Terminal và chạy
   `curl -H "Authorization: Bearer <CRON_SECRET>" "https://<địa-chỉ-web>/api/cron/daily?weekly=1"`

Phương án khác: Resend (`RESEND_API_KEY`, `EMAIL_FROM`). Cần tên miền riêng mới gửi được cho người khác. Nếu có cả hai, hệ thống dùng Gmail.

---

## Dùng hằng ngày

- **Khi code có cập nhật database** (ghi chú trong Pull Request): vào Supabase **SQL Editor**, dán lại toàn bộ `supabase/schema.sql`, bấm **Run**. Chạy lại nhiều lần vẫn an toàn, không mất dữ liệu.

- **Thêm nhân sự mới:** leader vào **Nhóm của tôi**, nhập Gmail (tự vào nhóm leader đó); hoặc admin vào **Quản lý tài khoản > Mời trước**, chọn leader phụ trách. Hệ thống gửi email mời; nhân sự đăng nhập là vào thẳng. Ai đăng nhập mà chưa được mời sẽ nằm ở mục **Chờ duyệt**.
- **Nhân sự nghỉ việc:** admin bấm **Khoá** (giữ dữ liệu, mở khoá được) hoặc **Xoá** (xoá hẳn).

### Thêm video bài giảng (cho người tiếp quản)
1. Đăng nhập **bunny.net > Stream**, mở thư viện của team, bấm **Upload Videos**, chọn file (mp4), chờ Bunny xử lý xong (cột Status báo Finished).
2. Bấm vào video, copy link ở ô **Direct Play URL** hoặc **Embed URL** (hoặc chỉ cần **Video ID** dạng `1a2b3c4d-1234-...`).
3. Mở web học viện bằng tài khoản admin, vào **Video bài giảng**, kéo xuống khung **Thêm video**: dán link, đặt tên, chọn module, bấm **Lưu video**.
4. Bấm vào video vừa thêm để xem thử. Báo lỗi thì kiểm tra lại Video ID và mục **Allowed domains** trong Bunny.
5. Xoá video khỏi web: bấm **Xoá** cạnh video (video gốc trên Bunny vẫn còn, xoá trên Bunny nếu muốn).

- **Sửa nội dung** (sửa trực tiếp trên GitHub, Vercel tự cập nhật):

| Muốn sửa | File |
| --- | --- |
| Đầu việc lộ trình 99 ngày | `src/lib/phases.ts` (đừng đổi `id` của đầu việc đã có) |
| Câu hỏi kiểm tra | `src/lib/quizzes.ts` (`c` = vị trí đáp án đúng, đếm từ 0) |
| Link tài liệu gốc (Google Drive) | `src/lib/docs.ts`, điền `url` |
| Trang quy trình, kiến thức | `content/pages/*.html` |
| Các chỉ số trên thanh trên cùng (KPI, phí, hoa hồng) | `src/components/TopBar.tsx` |

## Chi phí (team dưới 20 người)

| Dịch vụ | Chạy thử | Chính thức |
| --- | --- | --- |
| Supabase | 0 (tự tạm dừng nếu 1 tuần không ai dùng, không có backup) | 25 USD/tháng |
| Vercel | 0 (gói Hobby dành cho dùng cá nhân) | 20 USD/tháng |
| Bunny Stream | 1–5 USD/tháng | 1–10 USD/tháng |
| Email (Gmail của team) | 0 (~500 email/ngày) | 0 |
| Tên miền (tuỳ chọn) | — | khoảng 1 USD/tháng |

## Chưa làm (để giai đoạn sau)

- Giới hạn mỗi tài khoản chỉ đăng nhập 1 thiết bị cùng lúc.
- Nhắc qua Zalo OA.
- Xuất báo cáo Excel cho leader.
- Watermark không hiện khi xem video ở chế độ toàn màn hình của trình phát Bunny.

## Chạy thử trên máy (cho người biết code)

```bash
cp .env.example .env.local   # điền giá trị thật
npm install
npm run dev                  # mở http://localhost:3000
```

Công nghệ: Next.js 15 (App Router), Supabase (Auth Google + Postgres + Row Level Security), Bunny Stream, Gmail SMTP (hoặc Resend), Vercel Cron.
