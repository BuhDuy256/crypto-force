# Crypto Force UI Prototype

Đọc file này để biết cách chạy prototype giao diện Crypto Force, tìm source của từng màn hình và chỉnh sửa chúng.

Prototype chứa giao diện, dữ liệu mẫu và tương tác mô phỏng của 12 design board. Mỗi màn hình là một file đọc và sửa trực tiếp được, và các màn hình liên kết với nhau như một ứng dụng. Prototype là design reference, không phải production frontend: production frontend dùng stack trong `CLAUDE.md` [[1, Tech Stack]](#ref-1) và không import code từ thư mục này.

## Chạy prototype

```bash
node docs/design/prototype/serve.mjs
```

Sau đó mở:

- `http://127.0.0.1:4173/`: design board, 12 board xếp dọc theo kích thước thiết kế, có thanh chỉ mục để nhảy tới từng board hoặc mở riêng một màn hình.
- `http://127.0.0.1:4173/screens/<Tên>.dc.html`: một màn hình chạy như ứng dụng, ví dụ `screens/Realtime.dc.html`. Link trong màn hình, reload và mở URL trực tiếp đều hoạt động.

Ghi chú khi chạy:

- `serve.mjs` chỉ cần Node.js, không có dependency nên không cần `pnpm install`. Đổi cổng bằng biến môi trường `PORT`.
- Prototype phải được phục vụ qua HTTP. Runtime dùng `fetch()` để tải `AppHeader.dc.html`, mà trình duyệt chặn `fetch()` khi mở file bằng `file://`.
- Có thể dùng web server tĩnh khác cho thư mục `prototype/`, ví dụ `python -m http.server`. Khác biệt duy nhất: URL màn hình không tồn tại sẽ nhận trang 404 của server đó, thay vì màn hình `NotFound.dc.html`.
- Không cần kết nối mạng. `assets/fonts/fonts.css` chỉ trỏ tới Google Fonts cho các subset ký tự mà nội dung giao diện không dùng (cyrillic, greek, vietnamese, latin-ext, math). Các subset này chỉ được tải khi người dùng nhập những ký tự đó, chẳng hạn chữ tiếng Việt có dấu.

## Cấu trúc thư mục

```text
prototype/
├── index.html            # Design board: các board xếp dọc + thanh chỉ mục (không thuộc thiết kế)
├── serve.mjs             # Static server, trả NotFound.dc.html cho URL lạ trong screens/
├── screens/              # Mỗi file là một màn hình; AppHeader.dc.html là shared component
├── styles/
│   ├── base.css          # Base styles dùng chung: nền, link, focus, skip link, button states, skeleton, toast, tooltip, scroll region, state panel
│   └── layout-audit.css  # Quy tắc responsive dùng chung cho mọi màn hình, kể cả breakpoint của header
├── docs/requirements/    # Hành vi sản phẩm theo từng nhóm màn hình (tài liệu, không phải code)
├── assets/fonts/         # Onest, JetBrains Mono (woff2), fonts.css, OFL.txt
├── tools/
│   ├── dc-source.js      # Đưa template của màn hình cho runtime; cuộn tới #fragment sau khi render
│   ├── dc-lifecycle.js   # Cho logic của màn hình đọc state trước đó trong componentDidUpdate
│   ├── modal-focus.js    # Focus trap, initial focus và trả focus cho mọi phần tử aria-modal="true"
│   └── url-props.js      # Áp dụng props từ query string (?variant=error, ?active=bt)
└── vendor/
    ├── dc-runtime/support.js   # Runtime của định dạng .dc.html (bản build, không sửa)
    └── react/                  # React 18.3.1 UMD production
```

## Màn hình

| File | Board | Ghi chú |
| --- | --- | --- |
| `Main.dc.html` | Landing | Có anchor `#product`, `#loop`, `#evidence`, `#faq` |
| `Auth.dc.html` | Sign in / Create account / Verify / Reset | Các bước nằm trên cùng một màn hình |
| `NotFound.dc.html` | 404 / Error | `?variant=error` mở biến thể lỗi 500 |
| `Library.dc.html` | Strategy library | |
| `Realtime.dc.html` | App · Realtime | |
| `Strategy.dc.html` | App · Strategy Engine | |
| `Discovery.dc.html` | App · Discovery | |
| `Backtest.dc.html` | App · Backtest | |
| `News.dc.html` | App · News | |
| `Settings.dc.html` | App · Settings | Có anchor `#profile`, `#security`, `#notifications`, `#connected`, `#data` |
| `States.dc.html` | App · Empty & loading states | Chỉ để minh họa, không có link nào dẫn tới. Gồm cả trạng thái lỗi tải dữ liệu, dữ liệu cũ sau khi refresh lỗi, và offline |
| `AppHeader.dc.html` | Component · App header | `?active=rt\|st\|di\|bt\|nw\|settings` chọn mục đang active khi mở riêng |

Prototype chỉ thể hiện giao diện và tương tác mô phỏng. Hành vi sản phẩm của từng màn hình (tác vụ, chuyển màn hình, thay đổi dữ liệu) được mô tả trong `docs/requirements/` [[2]](#ref-2).

Tên file khớp với link trong source, ví dụ `<a href="Realtime.dc.html">`. Nhờ vậy, điều hướng giữa các màn hình là link HTML thông thường, không cần router. Không có link nào trỏ tới `NotFound` và `States`, nên tên hai file này được đặt theo nội dung màn hình.

## Cấu trúc một file `.dc.html`

```html
<head>
  <!-- fonts, React, tools/dc-source.js, vendor/dc-runtime/support.js,
       tools/dc-lifecycle.js, tools/modal-focus.js -->
</head>
<body>
<script type="text/x-template" data-dc-template>
<x-dc>
<helmet>
  <!-- CSS của màn hình -->
</helmet>
<!-- markup -->
</x-dc>
</script>
<script type="text/x-dc" data-dc-script data-props="{...}">
class Component extends DCLogic {
  renderVals() { return { /* giá trị và handler cho markup */ }; }
}
</script>
</body>
```

- **Markup**: `{{name}}` lấy giá trị từ object do `renderVals()` trả về. `<sc-if value="{{cond}}">` render có điều kiện, `<sc-for list="{{items}}" as="it">` lặp danh sách. Event viết theo kiểu React, ví dụ `onClick="{{handler}}"`. `<dc-import name="AppHeader" active="bt">` nhúng component `AppHeader.dc.html` với prop `active`.
- **Logic**: class `Component` kế thừa `DCLogic` từ runtime, có `this.state`, `setState()` và lifecycle như React class component. State, handler và dữ liệu mẫu của màn hình đều nằm trong class này.
- **`componentDidUpdate`**: runtime chỉ truyền `prevProps`, không truyền `prevState`. Màn hình cần so sánh state cũ và mới thì gọi `this.prevState()` ở đầu hàm, do `tools/dc-lifecycle.js` cung cấp: `componentDidUpdate(pp) { var ps = this.prevState(); … }`. Hàm trả về state tại lần commit trước, và chỉ gọi một lần trong mỗi lần `componentDidUpdate`.
- **`data-props`**: khai báo props và kích thước preview của board. Chỉ `NotFound` (`variant`) và `AppHeader` (`active`) có props.
- **Khối `<x-dc>` nằm trong `<script type="text/x-template">`**: nhờ vậy trình duyệt không parse markup trước runtime. Nếu bị parse trước, attribute camelCase sẽ bị đổi thành chữ thường và các dòng `<sc-for>` trong `<table>` hoặc `<select>` sẽ bị đẩy ra ngoài. Editor như VS Code vẫn highlight HTML trong khối này. Không viết `</script>` hoặc `<!--` trong markup.

## Styles

Thứ tự thẻ trong `<helmet>` là thứ tự cascade. Mỗi màn hình dùng đúng thứ tự sau:

1. `styles/layout-audit.css`: quy tắc responsive dùng chung.
2. `<style id="cf-audit-layout-fixes">`: quy tắc responsive riêng của màn hình (nếu có).
3. `assets/fonts/fonts.css`.
4. `styles/base.css`.

`base.css` và `layout-audit.css` cùng đặt `!important` cho `.cf-wide` và `.cf-narrow`. Vì vậy, đổi thứ tự hai file này sẽ làm thay đổi giao diện ở chiều rộng 901–1100px.

`AppHeader.dc.html` giữ CSS inline thay vì link tới `layout-audit.css`. Runtime chỉ chèn mỗi `<link>` một lần cho cả trang, nhưng bản CSS của header phải được chèn sau `base.css` của màn hình để breakpoint của header được áp dụng.

## Shared component

`AppHeader.dc.html` là implementation duy nhất của app header. Các màn hình workspace nhúng nó bằng `<dc-import name="AppHeader" active="…">`, nên mọi chỉnh sửa header chỉ cần làm ở một file. Runtime tìm component theo tên tại `./<Name>.dc.html`, vì vậy `AppHeader.dc.html` phải nằm cùng thư mục với các màn hình.

## Dữ liệu mô phỏng

Prototype không gọi backend. Dữ liệu mẫu là literal trong logic của từng màn hình. Dữ liệu dùng chung giữa các màn hình được lưu trong `localStorage`, với key có tiền tố `cf.`:

| Key | Ý nghĩa | Màn hình dùng |
| --- | --- | --- |
| `cf.session` | Phiên đăng nhập mô phỏng (`in` / `out`) | AppHeader, Auth, Main, Backtest, Settings |
| `cf.next` | Màn hình quay lại sau khi đăng nhập | AppHeader, Auth, Main |
| `cf.library` | Thư viện strategy và composite | AppHeader, Library, Realtime, Strategy, Discovery, Backtest |
| `cf.runs` | Danh sách backtest run | AppHeader, Backtest, Library, Strategy |
| `cf.notes` | Thông báo | AppHeader, Backtest, Discovery |
| `cf.signal` | Nguồn tín hiệu của Realtime | Library, Realtime |
| `cf.edit`, `cf.handoff`, `cf.libOpen`, `cf.runOpen`, `cf.condition`, `cf.idea`, `cf.newsPanel`, `cf.settingsAnchor`, `cf.flash` | Ngữ cảnh truyền khi chuyển từ màn hình này sang màn hình khác | Nhiều màn hình |
| `cf.draftStrategy`, `cf.draftComposite`, `cf.draftSettings`, `cf.dirty` | Bản nháp và cờ thay đổi chưa lưu | Strategy, Discovery, Settings, AppHeader |
| `cf.settings` | Time zone và research defaults đã lưu trong Settings | Settings |
| `cf.discovery`, `cf.newsSources`, `cf.onboardHidden` | Trạng thái riêng của Discovery, News, Realtime | Discovery, News, Realtime |

- Khi `localStorage` trống, các màn hình coi người dùng đã đăng nhập với hồ sơ mẫu. Muốn xem trạng thái chưa đăng nhập, dùng **Sign out** trong menu avatar.
- Đưa prototype về trạng thái ban đầu bằng cách xóa `localStorage` của origin `http://127.0.0.1:4173` (DevTools → Application → Local Storage).
- Các board trong `index.html` dùng chung một origin. Vì vậy, thao tác ở một board có thể làm thay đổi nội dung của board khác, tùy board nào được load hoặc reload sau.
- Danh sách strategy mẫu (`RSI_BB_LB_LONG_SL2_TP4`, `MACD_Cross_TrendFollow`, `MA + RSI + S/R`) được khai báo riêng trong logic của AppHeader, Library, Realtime, Strategy, Discovery và Backtest. Khi sửa danh sách này, cần sửa ở tất cả các file.

## Vendor

- `vendor/dc-runtime/support.js` là runtime render định dạng `.dc.html` của Claude Design. File là bản build (`GENERATED from dc-runtime/src/*.ts`), không kèm source TypeScript, nên không chỉnh sửa trực tiếp.
- `vendor/react/` là bản UMD production chính thức của React 18.3.1, có hash trùng với SRI mà runtime dùng khi tải React từ CDN.
- Font Onest và JetBrains Mono theo SIL Open Font License 1.1, xem `assets/fonts/OFL.txt`.

## Pattern dùng chung

- **Overlay**: drawer, dialog và màn chặn đăng nhập đều có `aria-modal="true"`. `tools/modal-focus.js` ghi nhớ phần tử đang có focus khi overlay mở, chuyển focus vào trong overlay nếu logic của màn hình chưa làm, giữ Tab và Shift+Tab trong overlay trên cùng, và trả focus về phần tử đã mở overlay khi overlay đóng. Phím Esc do từng màn hình xử lý.
- **Skip link**: phần tử focus được đầu tiên của AppHeader là "Skip to main content", dẫn tới `<main id="main">` của màn hình.
- **Lỗi form**: lỗi hiện ngay dưới trường, được liên kết bằng `aria-describedby` và đánh dấu `aria-invalid`. Khi bấm submit mà còn lỗi, focus chuyển tới trường lỗi đầu tiên. Form nhiều trường (Auth) hiện thêm danh sách lỗi; chọn một lỗi sẽ focus trường tương ứng.
- **Toast**: mỗi màn hình có một container `aria-live="polite"` tồn tại sẵn. Toast được chèn vào container đó và không có live region riêng, nên mỗi thông báo chỉ được đọc một lần.
- **Bảng dữ liệu**: trên desktop hiển thị dạng bảng. Khi bảng rộng hơn khung, phần cuộn ngang dùng class `.cf-scroll-x`, có `tabindex="0"`, `role="region"` và nhãn, nên cuộn được bằng bàn phím. Trên màn hình từ 600px trở xuống, Trades (Backtest) và Leaderboard (Discovery) chuyển sang dạng card.
- **Ngày giờ**: giao diện hiển thị ngày dạng `01 May 2025` và thời điểm dạng `20 May 2025, 10:42`. Giá trị lưu trong state vẫn ở dạng ISO (`2025-05-01`).
- **Trạng thái dữ liệu**: rỗng (khung nét đứt), đang tải (skeleton), lỗi tải (`.cf-state-error`), dữ liệu cũ được giữ lại sau khi refresh lỗi (`.cf-state-stale`) và offline (`.cf-state-offline`). Ví dụ của từng trạng thái nằm trong `States.dc.html`.

## Vấn đề đã biết

- Ô chọn ngày From/To trong Backtest là `<input type="date">` của trình duyệt, nên định dạng hiển thị theo locale của trình duyệt (ví dụ `05/01/2025` trên Chrome en-US). Dòng "Period" ngay dưới form nhắc lại khoảng thời gian theo định dạng của ứng dụng.

## References

1. <a id="ref-1"></a>[Project: Crypto Force](../../../CLAUDE.md)
2. <a id="ref-2"></a>[Crypto Force: hành vi sản phẩm theo UI](docs/requirements/README.md)
