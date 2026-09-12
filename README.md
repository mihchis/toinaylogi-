# Tối Nay Lọ Gì? 🎰

**Tiếng Việt** · [English](README.en.md)

Ứng dụng local mở hòm để chọn một nữ diễn viên. Pool được Next.js server trên máy crawl từ xếp hạng lượt xem tháng của XXX.Guru (ba trang đầu), enrich best-effort hồ sơ từ XXBase và làm mới tối đa mỗi tuần.

<video src="assets/promo.mp4" controls="controls" muted="muted" width="100%"></video>

## Chạy trên máy

Cần Node.js 22.12+ và pnpm theo `package.json`.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
redis-server
pnpm dev
```

Mở [127.0.0.1:3000](http://127.0.0.1:3000). Lần đầu server crawl nền; UI sẽ chờ snapshot cục bộ. Dùng `pnpm data:refresh` để buộc làm mới/dò lỗi. Crawl chỉ publish snapshot mới khi toàn bộ list, phim, hồ sơ và ảnh hợp lệ; cache hiện tại vẫn được giữ khi lỗi.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

Server chỉ lắng nghe loopback. Khi enrich, server dùng `impit` với Chrome TLS fingerprint chỉ cho request AvBase. Sau khi snapshot đã có, browser chỉ tải JSON và ảnh local; XXX.Guru/AvBase/Wikipedia/X/Instagram/TikTok chỉ mở qua liên kết bạn bấm.

## Dữ liệu cục bộ

- Snapshot v4 và ảnh crawler nằm trong `public/actress-cache/` (gitignored); snapshot v3 cũ vẫn đọc được trong lúc refresh.
- XXX.Guru quyết định ranking/tier; XXBase chỉ bổ sung best-effort tên Nhật/ruby, ngày sinh, số đo, cup, nhóm máu, quê quán, sở thích, social, Wikipedia và ảnh DMM được tải lại vào cache local.
- Tiến trình/lock tạm nằm trong `.cache/jav-crawler/` (gitignored).
- Lọc tier, loại trừ diễn viên, ngôn ngữ, lựa chọn gần nhất và số lượt mở local nằm trong cookie host-only, versioned, có giới hạn. Số local này chỉ thuộc browser hiện tại.
- Bộ đếm `LƯỢT MỞ TOÀN SERVER` là số lượt mở hòm đã hoàn tất, được dùng chung bởi các client kết nối cùng Next.js server local và lưu tại Redis bằng key `toinaylogi:opens`. Chuỗi kết nối nằm trong `REDIS_URL` ở `.env` (mặc định local tại `redis://localhost:6379` trong `.env.example`); nó không phải metric deployment/cộng đồng.
- Redis không chạy thì vẫn mở hòm được và số local vẫn tăng; bộ đếm server sẽ hiện là không khả dụng và tự thử lại khi tải lại trang hoặc mở hòm lần sau.

## GitHub Pages, đóng góp và nguồn gốc

GitHub Pages chỉ redirect đến https://truanayangi.com/; chỉ `pages-redirect/` được publish lên `gh-pages`, còn app này chạy local từ `main`. Chào đón issue/fork PR vào `main` bằng Việt hoặc Anh, kể cả draft PR.

Dự án lấy cảm hứng từ [nagisanzenin/truanayangi](https://github.com/nagisanzenin/truanayangi). Repo giữ lịch sử từ `nagisanzenin/truanayangi`. Xem nguồn asset tại [ATTRIBUTION.md](ATTRIBUTION.md).
