# Prototype → Implementation Workflow

Đọc file này để biết chi tiết cách phát triển một increment khi chuyển prototype trong `docs/design/prototype/` thành code chạy được trong `apps/web`.

## Nguyên tắc

- Mỗi increment là một flow ở một mức hoàn thiện. Cách chia và thứ tự các increment nằm trong Roadmap [[1, Đơn vị increment]](#ref-1); file này chỉ mô tả cách phát triển một increment.
- Prototype là design reference, không phải nguồn requirement: giữ ý đồ thiết kế, không sao chép từng pixel [[2, How to Use]](#ref-2). Hành vi sản phẩm lấy từ bộ tài liệu `docs/design/prototype/docs/requirements/` [[3]](#ref-3).
- Gắn nhãn **Confirmed / Inferred / Proposed** cho mọi nhận định, cùng quy ước với `prototype/docs/requirements/` [[3]](#ref-3). Điểm chưa xác định được tra trong Open Questions [[4]](#ref-4); nếu chưa có, đề xuất câu hỏi mới theo quy ước của file đó, không ghi câu hỏi vào tài liệu khác [[5, General Conventions]](#ref-5).
- Chỉ giải quyết những vấn đề cần cho increment hiện tại; phần còn lại được hoãn kèm lý do và rủi ro.
- Ưu tiên reuse nhưng không chọn library chỉ vì nó có sẵn.
- Conventions lấy từ AGENTS.md [[6]](#ref-6), Coding Guidelines [[7]](#ref-7) và Project Structure [[8]](#ref-8); workflow này không định nghĩa lại chúng.

## Tổng quan

| Bước | Câu hỏi chính | Kết quả |
| --- | --- | --- |
| 01. Define Goal | Muốn đạt được gì? | Scope và Definition of Done |
| 02. Explore | Hiện tại có gì, còn thiếu gì? | Inventory, dependency map và điểm chưa xác định |
| 03. Review | Có vấn đề gì? | Findings có bằng chứng |
| 04. Resolve | Cần giải quyết gì trước? | Decisions, blockers và phần được defer |
| 05. Plan Implementation | Nên xây dựng như thế nào? | Implementation Plan |
| 06. Build & Test | Đã làm đúng và đủ chưa? | Working increment, bằng chứng kiểm chứng, docs cập nhật |

Mỗi increment đi qua các bước 01–06. Khi phát hiện vấn đề mới, quay lại bước phù hợp; không chạy lại toàn bộ workflow.

### Track rút gọn

Áp dụng cho increment không đọc hoặc ghi dữ liệu server và không phụ thuộc session, ví dụ Landing và trang 404 ở mức UI Integrated:

- Gộp bước 01–04 thành một lần review, chỉ dùng các góc nhìn Product, UX/UI, Accessibility và Performance & SEO.
- Bước 05 chỉ cần component tree, sourcing và render mode.
- Nếu phát hiện phụ thuộc vào dữ liệu server hoặc session, chuyển sang track đầy đủ.

### Đối chiếu màn hình

Mỗi màn hình trong prototype có file mô tả hành vi tương ứng [[9, Màn hình]](#ref-9) [[3]](#ref-3):

| Prototype (`docs/design/prototype/screens/`) | Hành vi (`docs/design/prototype/docs/requirements/`) |
| --- | --- |
| `Main.dc.html` (Landing), `NotFound.dc.html` | `public-pages.md` |
| `Auth.dc.html` | `authentication.md` |
| `AppHeader.dc.html` | `workspace.md` |
| `Library.dc.html`, `Strategy.dc.html` | `strategy-engine.md` |
| `Realtime.dc.html` | `realtime.md` |
| `Discovery.dc.html` | `discovery.md` |
| `Backtest.dc.html` | `backtest.md` |
| `News.dc.html` | `news.md` |
| `Settings.dc.html` | `settings.md` |
| `States.dc.html` | Trạng thái dữ liệu dùng chung; đối chiếu với file của màn hình có trạng thái đó |

## 01. Define Goal

**Mục tiêu:** Chốt phạm vi và điều kiện hoàn thành trước khi phân tích chi tiết.

Xác định:

- Flow cần triển khai, giá trị người dùng, và các màn hình hoặc phần màn hình mà flow chạm tới.
- Hành vi nào phải chạy được; những gì nằm ngoài phạm vi, kể cả các action dẫn sang flow chưa làm.
- Dependencies cần tích hợp và mức hoàn thiện mong muốn: UI Integrated, Flow Functional hoặc Release Ready [[1, Đơn vị increment]](#ref-1).
- Acceptance criteria và Definition of Done có thể kiểm chứng bằng cách kiểm tra ở bước 06.

**Kết quả:** Scope + Definition of Done.

**Đi tiếp khi:** Mục tiêu, phạm vi và cách xác nhận hoàn thành đã rõ.

## 02. Explore

**Mục tiêu:** Hiểu prototype và hiện trạng project trước khi đưa ra kết luận.

Nguồn cần đọc:

- File màn hình trong prototype và file hành vi tương ứng theo bảng [Đối chiếu màn hình](#đối-chiếu-màn-hình).
- Các câu hỏi trong nhóm liên quan của Open Questions [[4]](#ref-4).
- Code hiện có trong `apps/web`, `packages/shared` và API liên quan.

Chạy prototype bằng `node docs/design/prototype/serve.mjs`, rồi mở `http://127.0.0.1:4173/screens/<Tên>.dc.html` [[9, Chạy prototype]](#ref-9). Kiểm tra trên prototype đang chạy thay vì chỉ đọc source. Xóa `localStorage` của origin để về trạng thái ban đầu; dùng **Sign out** để xem trạng thái chưa đăng nhập [[9, Dữ liệu mô phỏng]](#ref-9).

Khảo sát:

- **UI:** layout, sections, responsive và visual states.
- **Behavior:** interactions, navigation, forms, user flows, empty/loading/error/success states.
- **Data:** dữ liệu nhập, hiển thị, lưu và truyền đi. Liệt kê các key `cf.*` mà màn hình đọc hoặc ghi, và dữ liệu mẫu viết literal trong logic của màn hình; phân loại theo bảng [State và dữ liệu](#state-và-dữ-liệu).
- **Codebase:** routes, components, utilities, APIs và phần đã implement.
- **Docs & dependencies:** requirements, architecture, Auth, API, storage và dịch vụ liên quan.

UX copy, dữ liệu mẫu và tương tác demo chỉ có trong prototype không phải requirement đã xác nhận [[2, How to Use]](#ref-2); ghi chúng là **Inferred** cho tới khi có nguồn xác nhận.

**Kết quả:** Inventory hiện trạng, dependency map và danh sách điểm chưa xác định.

**Đi tiếp khi:** Có đủ thông tin về phạm vi hiện tại để review; không cần hiểu toàn bộ hệ thống.

## 03. Review

**Mục tiêu:** Tìm khoảng cách giữa hiện trạng và tiêu chuẩn cần đạt.

| Góc nhìn | Cần xem xét |
| --- | --- |
| Product | Đúng chức năng, phạm vi và lời hứa sản phẩm? |
| UX/UI | Dễ hiểu, nhất quán, responsive, phản hồi tương tác? Bám prototype theo [Mức độ bám prototype](#mức-độ-bám-prototype)? |
| Accessibility | Keyboard, focus, semantics, contrast, motion? Giữ đủ [Hành vi dùng chung](#hành-vi-dùng-chung-cần-giữ)? |
| Functionality | States, validation, edge cases và flow đã đủ rõ? |
| Architecture | Boundaries và dependencies có phù hợp? |
| Data & Integration | API, Auth, persistence và data flow đã rõ? |
| Security & Privacy | Input, authorization, dữ liệu nhạy cảm, redirects? |
| Performance & SEO | Render mode, kích thước bundle, `meta` có đáp ứng nhu cầu của route? |
| Testability | Có cách kiểm chứng behavior và contracts? |

Chọn góc nhìn phù hợp với scope; không cần review mọi góc nhìn ở cùng độ sâu. Ưu tiên tiêu chuẩn đã chốt trong repo và requirements. Với các góc nhìn Functionality, Security & Privacy và Accessibility, đối chiếu thêm với một baseline độc lập với prototype theo LL-003 [[15]](#ref-15). Tiêu chuẩn mới do Agent đề xuất phải ghi rõ là **Proposed**.

Mỗi finding cần trả lời: **Hiện trạng → Tiêu chuẩn mong đợi → Khoảng cách → Ảnh hưởng → Bằng chứng**.

**Kết quả:** Findings có bằng chứng và mức độ ảnh hưởng.

**Đi tiếp khi:** Các góc nhìn liên quan đã được xem xét và những khoảng trống quan trọng đã được ghi nhận.

## 04. Resolve

**Mục tiêu:** Chọn vấn đề cần xử lý trước khi code; tránh biến mọi finding thành blocker.

Phân loại thành **Defect**, **Requirement Gap / Open Question**, **Technical Decision**, **Dependency**, **Improvement** hoặc **Implementation Task**.

Đánh giá từng vấn đề theo phạm vi hiện tại:

- **Blocker:** Chặn increment đang thực hiện.
- **Before Integration:** Chưa chặn UI nhưng chặn flow tích hợp.
- **Before Release:** Chỉ chặn phát hành.
- **Non-blocking / Deferred:** Có thể xử lý sau, kèm lý do và rủi ro.

Với quyết định quan trọng, trình bày **options → trade-offs → recommendation → decision**. Không tự chốt requirement hoặc quyết định kiến trúc chưa được người dùng chấp thuận.

Ghi kết quả theo quy ước tài liệu [[5, General Conventions]](#ref-5):

- Requirement Gap chưa có câu trả lời: thêm câu hỏi vào Open Questions [[4]](#ref-4).
- Câu hỏi đã được quyết: ghi nội dung đã chốt vào tài liệu chính, hoặc vào ADR trong `docs/architecture/30-decisions.md` nếu là quyết định kiến trúc có trade-off.

**Kết quả:** Decisions, blockers, open questions và phần được defer.

**Đi tiếp khi:** Không còn vấn đề chưa xử lý ngăn cản việc thiết kế increment hiện tại; các quyết định có thể hoãn được ghi rõ.

## 05. Plan Implementation

**Mục tiêu:** Chọn cách implement phù hợp codebase, có lý do rõ ràng và có thể kiểm chứng.

| Khía cạnh | Cần quyết định |
| --- | --- |
| Route & render mode | Route path, prerender hay SPA, `meta` |
| Architecture | Boundaries, data flow, API/integration contracts |
| Components | Chia theo responsibility, behavior và complexity |
| Sourcing | Dùng code sẵn có, stack hiện tại, library ngoài hay custom |
| Reuse | Component page-local hay thực sự shared |
| State & Behavior | State ownership, props/events, forms, validation, async/error states; đích của từng key `cf.*` |
| Styling | Tokens, variants, responsive, accessibility styles |
| Sequence | Dependencies, thứ tự xây dựng và vertical slices |
| Testing | Cách kiểm chứng từng slice và toàn flow |

### Route và render mode

`apps/web` chạy SPA cho ứng dụng và prerender các route landing để phục vụ SEO [[6, Tech Stack]](#ref-6). Với route được prerender:

- Thêm route vào danh sách `prerender` trong `apps/web/react-router.config.ts` và khai báo `meta`.
- Prerender chạy lúc build, không có session, `window` hoặc `localStorage`. Nội dung phụ thuộc trạng thái đăng nhập hoặc dữ liệu trình duyệt chỉ render ở client sau khi hydrate.

### Chọn component / library

1. Kiểm tra component hoặc utility đã có trong codebase.
2. Kiểm tra stack đã chọn (ví dụ `shadcn/ui`, `Lucide`, `Lightweight Charts`).
3. Tìm external libraries phù hợp nếu cần.
4. Tự implement khi không có lựa chọn phù hợp hoặc custom đơn giản, dễ bảo trì hơn.

So sánh candidates theo **functional fit, customization, accessibility, compatibility, maintenance, license/security, bundle impact và complexity**. Thứ tự tìm kiếm không đồng nghĩa với thứ tự bắt buộc lựa chọn. Candidate thay cho một pattern của prototype phải giữ được [Hành vi dùng chung](#hành-vi-dùng-chung-cần-giữ).

### Chia components

- Tách theo trách nhiệm, logic tương tác, mức phức tạp và khả năng thay đổi độc lập; không ép mỗi section thành một file.
- Vị trí đặt component theo Project Structure [[8, Web: layer-based và page colocation]](#ref-8); ngoại lệ cho component đã được prototype dùng ở nhiều màn hình nằm ở mục [Nền chung](#nền-chung).
- Không tạo hook, abstraction, folder hoặc dependency chỉ để dự phòng.
- Không chuyển class `Component` của `.dc.html` sang React một cách máy móc: `renderVals()` và `this.state` được tách lại theo state ownership đã quyết định ở bảng trên.

### Lập thứ tự triển khai

Chia thành những **vertical slices** nhỏ, có hành vi hoặc kết quả kiểm chứng được. Làm sớm các dependencies và rủi ro tích hợp quan trọng; dùng stub kèm ghi rõ giới hạn nếu phù hợp.

**Kết quả:** Implementation Plan gồm route và render mode, component tree, sourcing decisions, state/data flow, thứ tự slices và test checkpoints.

**Đi tiếp khi:** Đủ rõ để implement slice đầu tiên, không cần thiết kế trước mọi chi tiết của toàn bộ màn hình.

## 06. Build & Test

**Mục tiêu:** Code và kiểm chứng liên tục theo từng slice.

Lặp lại:

1. Chọn slice và acceptance criteria tương ứng.
2. Implement theo decisions và conventions đã chốt.
3. Kiểm chứng theo [Kiểm chứng tối thiểu](#kiểm-chứng-tối-thiểu).
4. Review behavior **và** code quality: component boundaries, reuse, duplicated logic, state, dependencies.
5. Sửa lỗi hoặc quay lại bước cần thiết nếu phát hiện giả định hoặc thiết kế sai.
6. Chấp nhận slice và chuyển sang slice tiếp theo.

Build pass hoặc giao diện trông giống prototype không phải là bằng chứng duy nhất của việc hoàn thành.

### Kiểm chứng tối thiểu

Công cụ testing chưa được chốt ([OQ-069](../../open-questions.md#oq-069)). Cho tới khi có công cụ, mỗi slice kiểm chứng bằng:

1. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` và `pnpm build` [[6, Commands]](#ref-6).
2. So sánh với prototype chạy song song, ở ít nhất một chiều rộng trong mỗi khoảng mà `layout-audit.css` chia: ≤600, 601–900, 901–1100, 1101–1380 và trên 1380 px.
3. Kiểm tra thủ công bằng bàn phím theo [Hành vi dùng chung](#hành-vi-dùng-chung-cần-giữ), và bật `prefers-reduced-motion` để kiểm tra animation.
4. Ghi cách đã kiểm tra và kết quả vào PR.

Test strategy xếp UI vào nhóm cần E2E, accessibility và visual regression [[10, Chiến lược theo module]](#ref-10). Khi OQ-069 được chốt, các bước 2 và 3 ở trên được thay bằng test tự động tương ứng. Nên chốt OQ-069 trước increment đầu tiên có form hoặc gọi API, vì validation và tích hợp khó kiểm chứng đủ bằng tay.

**Kết quả:** Working increment, bằng chứng kiểm chứng, remaining issues và tài liệu cập nhật khi cần.

**Hoàn thành khi:** Acceptance criteria và Definition of Done đạt, và không còn blocker đối với mức hoàn thiện đã chọn.

## Chuyển đổi từ prototype

### Nền chung

Phần nền mà mọi màn hình dùng chung được làm trong increment Foundation, trước mọi increment khác, để không màn hình nào tự định nghĩa màu, font hoặc breakpoint riêng.

| Hạng mục | Nguồn trong prototype | Đích trong `apps/web` |
| --- | --- | --- |
| Design tokens: màu, typography, radius | CSS trong `<helmet>` của các màn hình, `styles/base.css` | Biến CSS trong `app/app.css` (`:root`, `.dark`, `@theme inline`), theo tên token của shadcn/ui |
| Font Onest và JetBrains Mono | `assets/fonts/` (SIL OFL 1.1) | Self-host file `woff2` của bộ Latin và Symbols trong `app/assets/fonts/`, kèm `OFL.txt` |
| Base styles: focus ring, skip link, `prefers-reduced-motion` | `styles/base.css` | Layer `base` trong `app/app.css`; skip link trong `app/root.tsx` |
| Breakpoints | `styles/layout-audit.css`, `styles/base.css` | Breakpoint mặc định của Tailwind |

Các quyết định của Foundation:

- **Breakpoint:** dùng breakpoint mặc định của Tailwind, không giữ các mốc 600, 900, 1100, 1380 px của prototype. Responsive behavior của prototype được quy đổi sang mốc gần nhất của Tailwind khi implement từng màn hình.
- **Theme:** có token cho cả theme tối và theme sáng; theme tối là mặc định. Theme tối lấy giá trị từ prototype. Prototype không có theme sáng, nên token của theme sáng là **Proposed**, suy ra từ theme tối và đạt contrast tối thiểu 4.5:1 cho chữ. Cách người dùng chọn theme là [OQ-076](../../open-questions.md#oq-076).
- **Viền input:** token `input` của theme tối dùng `#626E7E` thay cho `#3A4553` của prototype, vì `#3A4553` chỉ đạt contrast 1.99:1 trên nền, dưới mức 3:1 cho thành phần UI. Đây là finding loại **Improvement**.
- **Token ngoài shadcn/ui:** `success`, `warning` và `info` cho các màu trạng thái và link của prototype, vì shadcn/ui chỉ có `destructive`.

Class tiện ích theo component của prototype, như `cf-skel`, `cf-state`, `cf-tip` và `cf-scroll-x`, không thuộc Foundation; chúng được làm cùng component ở increment đầu tiên cần đến.

Increment Foundation đạt Definition of Done khi `app/app.css` chứa token lấy từ prototype thay cho token mặc định của shadcn/ui, font và base styles được áp dụng toàn app, và một trang trống trong `apps/web` hiển thị đúng nền, font, màu chữ và focus ring như prototype.

Component được prototype dùng ở nhiều màn hình, như App header, state panel và toast [[9, Shared component]](#ref-9) [[9, Pattern dùng chung]](#ref-9), được đặt thẳng vào `components/` hoặc `layouts/` ngay khi implement lần đầu. Nhu cầu dùng chung của các component này đã có thực tế, nên việc đặt chúng ở đó không vi phạm quy tắc "không chuyển lên sớm" [[8, Web: layer-based và page colocation]](#ref-8). Component được xây trong increment đầu tiên cần đến nó, không xây trước trong Foundation.

### State và dữ liệu

Prototype không gọi backend. Dữ liệu mẫu là literal trong logic của từng màn hình, còn state dùng chung giữa các màn hình nằm trong `localStorage` với key có tiền tố `cf.` [[9, Dữ liệu mô phỏng]](#ref-9). `apps/web` không giữ mô hình này. Đích của từng key được quyết định ở bước 04 của increment đầu tiên dùng key đó:

| Key trong prototype | Đích trong `apps/web` | Căn cứ |
| --- | --- | --- |
| `cf.session` | Cookie session của Better Auth | [[6, Tech Stack]](#ref-6) |
| `cf.next` | Màn hình quay lại sau khi đăng nhập; cách truyền được chọn ở bước 05 | [[11, Chuyển tiếp sau khi đăng nhập]](#ref-11) |
| `cf.library`, `cf.runs`, `cf.notes` | PostgreSQL qua API; web truy cập qua `app/api/` và TanStack Query | [OQ-072](../../open-questions.md#oq-072), [[7, Frontend: React, Router và server state]](#ref-7) |
| `cf.draftStrategy`, `cf.draftComposite` | Lưu trong trình duyệt | [OQ-072](../../open-questions.md#oq-072) |
| `cf.handoff`, `cf.edit`, `cf.idea`, `cf.condition`, `cf.libOpen`, `cf.runOpen`, `cf.newsPanel`, `cf.settingsAnchor`, `cf.flash` | Dữ liệu chuyển giao dùng một lần rồi xóa. **Proposed:** route state hoặc URL param của React Router | [[12, Chuyển ngữ cảnh giữa các màn hình]](#ref-12) |
| `cf.draftSettings`, `cf.dirty`, `cf.settings`, `cf.signal`, `cf.discovery`, `cf.newsSources`, `cf.onboardHidden` | Chưa quyết định | Quyết định ở bước 04 của increment liên quan |

Dữ liệu mẫu trong prototype được thay bằng API thật. Khi API chưa sẵn sàng, **Proposed:** đặt stub trong `app/api/` với cùng signature dự kiến của API, để component không phải đổi khi nối API thật. Danh sách strategy mẫu đang được khai báo lặp lại ở nhiều màn hình [[9, Dữ liệu mô phỏng]](#ref-9); stub chỉ giữ một nguồn duy nhất.

### Hành vi dùng chung cần giữ

Prototype tự viết các hành vi accessibility và phản hồi dưới đây [[9, Pattern dùng chung]](#ref-9). Khi thay bằng component của shadcn/ui hoặc library khác, component mới phải giữ được:

- **Overlay** (drawer, dialog, màn chặn đăng nhập): chuyển focus vào overlay khi mở, giữ Tab và Shift+Tab bên trong overlay trên cùng, Esc đóng overlay, trả focus về phần tử đã mở.
- **Skip link:** "Skip to main content" là phần tử focus được đầu tiên, dẫn tới `<main id="main">`.
- **Lỗi form:** lỗi hiện ngay dưới trường, liên kết bằng `aria-describedby` và đánh dấu `aria-invalid`; submit khi còn lỗi thì focus trường lỗi đầu tiên; form nhiều trường hiện thêm danh sách lỗi, chọn một lỗi sẽ focus trường tương ứng.
- **Toast:** một container `aria-live="polite"` tồn tại sẵn, mỗi thông báo chỉ được đọc một lần; thời gian hiển thị và Undo theo [[12, Phản hồi dùng chung]](#ref-12).
- **Bảng dữ liệu:** vùng cuộn ngang focus được bằng bàn phím, có `role="region"` và nhãn; từ 600 px trở xuống, Trades (Backtest) và Leaderboard (Discovery) chuyển sang dạng card.
- **Ngày giờ:** hiển thị ngày dạng `01 May 2025`, thời điểm dạng `20 May 2025, 10:42`; state lưu dạng ISO.
- **Trạng thái dữ liệu:** rỗng, đang tải, lỗi tải, dữ liệu cũ sau khi refresh lỗi, offline.
- **Motion:** tắt animation khi người dùng bật `prefers-reduced-motion` (`styles/base.css`).

### Mức độ bám prototype

Implementation giữ ý đồ thiết kế, không sao chép pixel [[2, How to Use]](#ref-2):

- **Phải giữ:** information architecture, content hierarchy, các state và chuyển màn hình, responsive behavior (phần nào ẩn, hiện hoặc đổi dạng ở từng khoảng chiều rộng), và [Hành vi dùng chung](#hành-vi-dùng-chung-cần-giữ).
- **Được lệch:** chi tiết visual của primitive shadcn/ui (khoảng cách, bo góc, shadow) khi không làm đổi hierarchy; kích thước board; UX copy và dữ liệu mẫu.
- **Được cải thiện:** usability, visual balance và responsive behavior, miễn là không đổi business logic [[2, How to Use]](#ref-2). Mỗi cải thiện được ghi là finding loại **Improvement** ở bước 04.

## Cách vận hành với Agent

Mỗi bước cần xác định rõ:

- **Input:** Đọc những nguồn nào?
- **Task:** Cần khảo sát, đánh giá, quyết định hay implement điều gì?
- **Output:** Trả về kết quả cụ thể nào?
- **Stop:** Khi nào dừng để người dùng review hoặc chốt quyết định?

Khi kết thúc bước, báo cáo ngắn: **Đã làm gì · Findings · Cần quyết định gì · Rủi ro còn lại · Bước tiếp theo**.

Không tự chuyển từ review sang code nếu người dùng mới yêu cầu phân tích. Inventory, findings và plan được giữ trong session, task hoặc PR; chỉ đưa vào `docs/` những rules, constraints và quyết định cần duy trì.

## Nguồn quy định trong repo

Workflow này không thay thế các tài liệu sau. Chỉ đọc tài liệu liên quan đến task.

| Nguồn | Dùng để |
| --- | --- |
| AGENTS.md [[6]](#ref-6) | Tech Stack, commands và project rules |
| Roadmap [[1]](#ref-1) | Thứ tự và phụ thuộc của các increment |
| Design [[2]](#ref-2), Prototype [[9]](#ref-9) | Design reference và cách chạy prototype |
| Hành vi sản phẩm theo UI [[3]](#ref-3), Requirements [[13]](#ref-13) | Behavior và acceptance criteria |
| Open Questions [[4]](#ref-4) | Các vấn đề chưa chốt |
| Architecture [[14]](#ref-14) | System design và architecture decisions |
| Coding Guidelines [[7]](#ref-7) | Coding conventions và frontend/backend constraints |
| Project Structure [[8]](#ref-8) | Folder responsibilities và dependency boundaries |
| Test Strategy [[10]](#ref-10) | Test strategy và quality requirements |
| Lessons Learned [[15]](#ref-15) | Các bài học còn hiệu lực, theo scope liên quan |
| Contributing to Documentation [[5]](#ref-5) | Quy ước khi cập nhật tài liệu trong `docs/` |

## References

1. <a id="ref-1"></a>[Prototype → Implementation Roadmap](roadmap.md)
2. <a id="ref-2"></a>[Design](../../design/README.md)
3. <a id="ref-3"></a>[Crypto Force: hành vi sản phẩm theo UI](../../design/prototype/docs/requirements/README.md)
4. <a id="ref-4"></a>[Open Questions](../../open-questions.md)
5. <a id="ref-5"></a>[Contributing to Documentation](../../CONTRIBUTING.md)
6. <a id="ref-6"></a>[Project: Crypto Force](../../../CLAUDE.md)
7. <a id="ref-7"></a>[Coding Guidelines](../../development/coding-guidelines.md)
8. <a id="ref-8"></a>[Project Structure](../../development/project-structure.md)
9. <a id="ref-9"></a>[Crypto Force UI Prototype](../../design/prototype/README.md)
10. <a id="ref-10"></a>[Test Strategy](../../testing/test-strategy.md)
11. <a id="ref-11"></a>[Authentication](../../design/prototype/docs/requirements/authentication.md)
12. <a id="ref-12"></a>[Workspace](../../design/prototype/docs/requirements/workspace.md)
13. <a id="ref-13"></a>[Requirements](../../requirements/README.md)
14. <a id="ref-14"></a>[Architecture](../../architecture/README.md)
15. <a id="ref-15"></a>[Lessons Learned](../../../LESSONS.md)
