# Phân tích dự án wedding-card

## 1) Tổng quan nhanh
- Đây là ứng dụng **thiệp cưới online** viết bằng **Vue 3 + Vite + TypeScript**.
- Ứng dụng hiển thị thiệp theo đường dẫn dạng: `/invite/:slug`.
- Dữ liệu khách mời và thông tin đám cưới đang được quản lý bằng file tĩnh trong `src/data`.

## 2) Kiến trúc hiện tại
- `src/main.ts`: khởi tạo app Vue, mount router.
- `src/router/index.ts`: chỉ có một route chính `/invite/:slug`.
- `src/views/InvitationPage.vue`: toàn bộ UI và luồng tương tác (mở thiệp, slideshow, timeline, thông tin gia đình).
- `src/data/wedding.ts`: dữ liệu đám cưới (cặp đôi, ảnh, timeline, thông tin hai bên gia đình).
- `src/data/guests.ts`: danh sách khách mời theo `slug`.
- `src/composables/useLazyLoad.ts`: composable tái sử dụng dùng `IntersectionObserver` để lazy render gallery/timeline.

## 3) Điểm mạnh
- Cấu trúc tương đối rõ với tách lớp `view` / `data` / `composable`.
- UI mạch lạc, có transition và lazy-load giúp trải nghiệm mượt hơn.
- Có route param theo khách mời, phù hợp use case gửi link cá nhân hóa.
- Tech stack hiện đại và nhẹ cho landing page (Vite + Vue + Tailwind).

## 4) Vấn đề/rủi ro kỹ thuật
1. **Toàn bộ business logic dồn trong một view lớn** (`InvitationPage.vue`), khó bảo trì khi mở rộng.
2. **Dữ liệu hard-code** trong source:
   - khó cập nhật hàng loạt,
   - khó tích hợp CMS/admin,
   - build lại mỗi lần đổi nội dung.
3. **Không có route fallback/home rõ ràng** ngoài `/invite/:slug`.
4. **Thiếu lớp kiểm thử** (unit/component/e2e) cho luồng chính mở thiệp và lookup khách mời.
5. **Bảo mật & riêng tư**:
   - slug dạng đơn giản có thể đoán được,
   - thông tin cá nhân (tên, số điện thoại, địa chỉ) đang public trong bundle JS.
6. **Khả năng SEO/chia sẻ link** còn hạn chế nếu cần social preview nâng cao (OG image, meta động theo khách).

## 5) Đề xuất cải thiện theo mức ưu tiên

### Ưu tiên cao (nên làm trước)
- Tách `InvitationPage.vue` thành các component nhỏ:
  - `InvitationCover`
  - `InvitationGallery`
  - `InvitationTimeline`
  - `FamilyInfoCard`
- Định nghĩa type rõ cho dữ liệu (`WeddingInfo`, `Guest`, `FamilyInfo`, `TimelineItem`).
- Bổ sung route fallback (`/`, `/:pathMatch(.*)*`) + trang thông báo thân thiện.
- Đổi cơ chế nhận diện khách mời:
  - dùng token khó đoán hơn slug,
  - hoặc xác thực nhẹ qua backend.

### Ưu tiên trung bình
- Chuyển dữ liệu sang backend/CMS hoặc file JSON từ server để cập nhật không cần build lại.
- Thêm analytics tối giản (view/open invitation).
- Tối ưu ảnh (WebP/AVIF, responsive sizes).

### Ưu tiên thấp
- i18n nếu muốn gửi cho khách quốc tế.
- Theme config để tái sử dụng cho nhiều đám cưới.

## 6) Lộ trình đề xuất
- **Phase 1 (1-2 ngày):** refactor component + type model + fallback routes.
- **Phase 2 (2-3 ngày):** tách nguồn dữ liệu khỏi codebase, chuẩn hóa schema.
- **Phase 3 (2-4 ngày):** thêm test cho các luồng chính + cải thiện riêng tư đường link.

## 7) Kết luận
Dự án đang ở mức MVP tốt cho triển khai nhanh thiệp cưới số. Để vận hành ổn định và mở rộng lâu dài, cần ưu tiên tách component, chuẩn hóa dữ liệu và giảm rủi ro lộ thông tin cá nhân từ dữ liệu hard-code.
