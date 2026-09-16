# Tối Nay Lọ Gì? 🎰

**Tiếng Việt** · [English](README.en.md)

Ứng dụng mở hòm phong cách CS:GO giúp bạn ngẫu nhiên chọn một nữ diễn viên theo độ hiếm (Rarity Tiers). Dữ liệu được crawl và lưu vào cache cục bộ trên máy, bổ sung hồ sơ chi tiết (số đo, hình ảnh, đánh giá, mạng xã hội) từ Minnano-AV và AvBase.

## Tính năng nổi bật
- 🎰 **Cơ chế mở hòm CS:GO**: Hiệu ứng cuộn băng chuyền mượt mà với âm thanh mở hòm chân thực.
- ⭐ **Phân hạng độ hiếm (Rarity Tiers)**: Từ Quốc Dân, Hiếm, Cực Phẩm, Tối Mật đến ★ Đặc Biệt.
- 🔍 **Xem hồ sơ trực tiếp**: Bấm vào bất kỳ thẻ bài nào để xem ảnh độ nét cao, số đo 3 vòng, cup ngực, điểm đánh giá và phim tiêu biểu.
- 🎛️ **Tuỳ chỉnh danh sách**: Lọc bỏ những diễn viên hoặc tier không mong muốn trong bảng Tuỳ chỉnh.
- 🔒 **Chạy local & bảo mật**: Mọi dữ liệu và cookie lưu trực tiếp trên máy của bạn.

## Hướng dẫn cài đặt & khởi chạy

Yêu cầu Node.js 22.12+ và `npm` hoặc `pnpm`.

```sh
# 1. Cài đặt dependencies
npm install

# 2. Tạo file cấu hình môi trường
cp .env.example .env.local

# 3. Khởi chạy dev server
npm run dev
```

Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000).

### Các lệnh hữu ích:
```sh
npm test          # Chạy test suite
npm run typecheck # Kiểm tra kiểu TypeScript
npm run lint      # Kiểm tra linter
npm run build     # Build production
npm run start     # Chạy production build
```

## Nguồn dữ liệu & Bản quyền
Xem chi tiết tại [ATTRIBUTION.md](ATTRIBUTION.md).
