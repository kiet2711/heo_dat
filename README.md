# Heo Đất

MVP iPhone bằng React Native + Expo + TypeScript: mục tiêu tiết kiệm, kế hoạch theo ngày, hai khoản tiền mỗi ngày, thống kê và nhắc cục bộ. Toàn bộ dữ liệu nằm trong SQLite trên thiết bị.

## Chạy trên iPhone với Expo Go (không cần Mac)

1. Cài **Expo Go** trên iPhone.
2. Trên máy Windows, mở Terminal tại thư mục này và chạy:

   ```powershell
   npx expo start
   ```

3. Đảm bảo máy tính và iPhone cùng Wi-Fi, rồi quét QR trong Expo Go. Nếu mạng chặn kết nối nội bộ, dùng `npx expo start --tunnel`.

SQLite và thông báo **cục bộ** được thử qua Expo Go. Lần bật nhắc đầu tiên, iPhone sẽ hỏi quyền thông báo.

## Kiểm tra

```powershell
npm run typecheck
npm run test:logic
```

## Khi cần development build / IPA

Chưa cần development build hoặc IPA cho MVP này khi chạy Expo Go. Cần build riêng bằng EAS (và tài khoản Apple khi phát hành) nếu muốn: push notification từ máy chủ, biểu tượng/âm thanh thông báo tuỳ biến trong app đã cài, extension/widget, hoặc đưa lên TestFlight/App Store. Các thay đổi cấu hình native trong `app.json` cũng chỉ có hiệu lực sau build mới.

Để tạo IPA unsigned để ký lại bằng ESign, dùng profile dưới đây. EAS sẽ biên dịch trên macOS cloud nhưng không yêu cầu credentials Apple:

```powershell
npx eas-cli@latest build --platform ios --profile unsigned
```

IPA này chưa cài trực tiếp được lên iPhone; hãy ký lại bằng chứng chỉ và provisioning profile của bạn trong ESign trước khi cài.

## Lưu ý thông báo iOS

iOS giới hạn số thông báo cục bộ đang chờ. Heo Đất giữ tối đa 60 lời nhắc gần nhất (đệm dưới ngưỡng hệ thống), chỉ nhắc các ngày có số ở ô **Có thể gửi**, và khi một ngày được tích hoặc sửa, danh sách nhắc sẽ được đồng bộ lại. Khi ứng dụng mở sang ngày mới, những khoản “Có thể gửi” chưa tích của ngày đã qua được chốt là 0 đ; phần “Đã gửi” vẫn luôn được tính.
