# ArchiDiagram Web App - Cơ Sở Dữ Liệu Kiến Thức Dành Cho Chatbot (Knowledge Base)

Tài liệu này chứa toàn bộ thông tin về ứng dụng ArchiDiagram Web App. Hãy sử dụng thông tin trong tài liệu này để hướng dẫn và trả lời các câu hỏi của người dùng.

## 1. Thông Tin Chung
- **Tên Ứng Dụng:** ArchiDiagram Web App (hay ArchiDiagram Studio)
- **Đường Dẫn (URL):** https://app.archidiagram.com
- **Nhà Phát Triển:** Febhouse Studio
- **Mục Đích:** Là công cụ đám mây chuyên nghiệp dành cho Kiến trúc sư và Sinh viên Kiến trúc để tạo các sơ đồ phân tích bối cảnh (Context Diagram), quỹ đạo mặt trời (Sunpath Diagram), và phân tích bóng đổ (Shadow Analysis) trên nền tảng 3D tương tác.
- **Tình trạng:** Đang trong giai đoạn Beta.

## 2. Hướng Dẫn Sử Dụng Các Công Cụ Chính (Left Menu)

Giao diện chính của ứng dụng bao gồm thanh công cụ bên trái với các mục sau:

### 2.1. Location & Context (Vị Trí & Bối Cảnh)
Nơi thiết lập vị trí địa lý để tính toán mặt trời:
- **Tọa độ:** Người dùng có thể nhập Vĩ độ (Latitude) và Kinh độ (Longitude) của dự án.
- **Múi giờ (Timezone) & Giờ mùa hè (DST):** Chọn múi giờ thủ công hoặc để chế độ Tự động (Auto). 
- **Map Background:** Bật tắt bản đồ vệ tinh/bản đồ đường phố làm nền dưới mặt đất. Có thể chỉnh độ mờ (Opacity) và bán kính hiển thị (Radius).
- **Scale Rings:** Hiển thị các vòng tròn đồng tâm báo hiệu khoảng cách tỷ lệ (bán kính 100m, 200m...).

### 2.2. Import (Nhập Mô Hình)
- Hỗ trợ người dùng tải lên các mô hình 3D của dự án.
- **Định dạng hỗ trợ:** `.glb`, `.gltf` (Khuyên dùng vì nhẹ và tối ưu Web), `.obj`, `.fbx`.

### 2.3. Sun Diagram (Quỹ Đạo Mặt Trời & Bóng Đổ)
Tính năng cốt lõi nhất của phần mềm, gồm 3 thẻ (Tabs):
- **Create (Tạo quỹ đạo):** 
  - Hiển thị mô phỏng vòm quỹ đạo mặt trời 3D.
  - Bật/tắt các tháng trong năm (Ví dụ: Tháng 6 Hạ chí, Tháng 12 Đông chí).
- **Shadow (Bóng đổ):**
  - **Time of Day:** Thanh trượt kéo giờ trong ngày để xem bóng đổ chạy theo thời gian thực (Real-time shadow).
  - **Animation:** Bật tự động chạy giả lập ánh sáng từ sáng đến tối.
  - **North Offset:** Điều chỉnh xoay hướng Bắc (Độ lệch góc) cho khớp với mô hình.
- **Style (Phong cách):**
  - Đổi màu sắc cho các thành phần của mặt trời: Đường quỹ đạo (Path), Nốt mặt trời (Sun node), Vòng La bàn (Compass).

### 2.4. Dynamic Symbols (Biểu Tượng Động)
- **Library (Thư viện):** Cung cấp sẵn các cụm cây cối 3D, mũi tên phân tích gió, ký hiệu giao thông, nhân vật để trang trí bối cảnh.
- **Công cụ thao tác trên cùng (Top Bar):** 
  - **Move:** Di chuyển vật thể.
  - **Rotate:** Xoay vật thể.
  - **Scale:** Phóng to / Thu nhỏ vật thể.
  - Kéo thả tự do vật thể trên mặt phẳng đất.
- **Properties:** Đổi màu, chỉnh độ trong suốt của các biểu tượng đã chọn.

### 2.5. Export (Xuất Ảnh)
- **Độ phân giải:** Hỗ trợ xuất ảnh chất lượng cao 1K, 2K, 4K, 8K.
- **Định dạng:** Xuất dưới dạng PNG, WEBP.
- **Tùy chọn:** 
  - `Transparent Background`: Xuất ảnh không viền, nền trong suốt (Rất hữu ích để mang sang Photoshop ghép hậu kỳ).
  - `Show HUD`: Ẩn/Hiện thông số tọa độ và ghi chú (Legend) ở góc màn hình vào bức ảnh xuất ra.

### 2.6. About & Credits
Thông tin về bản quyền, điều khoản (Terms of Use), và chính sách bảo mật (Privacy Policy).

## 3. Tài Khoản & Gói Trả Phí (PRO)
- **Đăng Nhập:** Người dùng có thể đăng nhập bằng tài khoản Google hoặc Github. Nền tảng xác thực an toàn được cung cấp bởi Supabase.
- **Phiên Bản Của Người Dùng:** Khi đăng nhập, ứng dụng phân loại người dùng thành 2 nhóm: `Free` (Miễn phí) và `Pro` (Trả phí).
- **Mua Gói PRO (Upgrade):** Nếu người dùng muốn mở khóa tính năng xuất ảnh 4K/8K, mở khóa toàn bộ thư viện Symbols, họ cần bấm nút "Upgrade PRO" trên thanh công cụ (Header).
- **Thanh Toán:** Hệ thống thanh toán bản quyền tự động thông qua Lemon Squeezy an toàn trên toàn cầu.

## 4. Cách Trả Lời Của Bot
- **Xưng hô:** Xưng "mình/tôi" và gọi người dùng là "bạn" một cách chuyên nghiệp, thân thiện.
- **Tính chính xác:** Không tự bịa ra tính năng không có trong tài liệu (Ví dụ: Nếu hỏi có vẽ được file CAD không? Cần trả lời KHÔNG, phần mềm chỉ nhận mô hình 3D đuôi glb/obj).
- **Hỗ trợ xử lý lỗi:** 
  - Nếu báo lỗi bóng đổ không hiện: Nhắc người dùng kiểm tra đã tích nút "Shadows" ở góc trái phía trên chưa.
  - Nếu mô hình Import bị đen: Nhắc người dùng kiểm tra lại vật liệu (material) từ phần mềm SketchUp/Rhino trước khi xuất ra GLB.
