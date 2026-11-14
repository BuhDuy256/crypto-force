# System Description

Đọc file này để biết Crypto Force dùng để làm gì, giải quyết nhu cầu nào của người dùng và vì sao từng tính năng tồn tại.

Crypto Force giúp người nghiên cứu giao dịch tìm chiến lược đáng thử. Hệ thống chỉ phân tích, mô phỏng và so sánh; không đặt lệnh thật.

```mermaid
flowchart LR
    U(["Người dùng<br/>muốn tìm chiến lược đáng thử"])
    U -->|"Giá đã biến động ra sao?"| M["<b>1. Market</b><br/>Biểu đồ nến"]
    M -->|"Khi nào mua / bán?"| S["<b>2. Strategy</b><br/>BUY / SELL / HOLD"]
    S -->|"Quy tắc từng hoạt động thế nào?"| B["<b>3. Backtest</b><br/>Giao dịch mô phỏng"]
    B -->|"Tốt hay rủi ro?"| E["<b>4. Evaluation</b><br/>Chỉ số"]
    E -->|"Cái nào tốt hơn?"| L["<b>5. Leaderboard</b><br/>Top-K"]
    L -->|"Thử gì tiếp theo?"| SE["<b>6. Search</b><br/>Sinh candidate"]
    SE --> B
    N["<b>7. News</b><br/>Sentiment"] -.->|"Bối cảnh thị trường"| S
```

Ví dụ xuyên suốt: thử chiến lược MA + RSI trên BTCUSDT, khung 15 phút.

## 1. Market: quan sát thị trường

Chỉ nhìn giá hiện tại thì không thấy xu hướng và mức dao động.

![Biểu đồ nến minh họa BTCUSDT khung 15 phút](assets/btcusdt-15m-candles.svg)

Tối đa 4 biểu đồ, mỗi biểu đồ một timeframe riêng; đổi timeframe một biểu đồ không ảnh hưởng biểu đồ khác.

```mermaid
flowchart LR
    P["BTCUSDT"] --> C1["Chart 1 · 5m"] & C2["Chart 2 · 15m<br/>xem chi tiết"] & C3["Chart 3 · 1h"] & C4["Chart 4 · 4h<br/>xem bối cảnh"]
```

## 2. Strategy: biến quan sát thành tín hiệu

Nhận xét bằng mắt không lặp lại được; khi các Strategy mâu thuẫn, Composite Strategy gộp tín hiệu theo một quy tắc cố định.

```mermaid
flowchart LR
    D["Dữ liệu nến<br/>BTCUSDT · 15m"] --> MA["MA20 cắt lên MA50"] --> B1(["BUY"])
    D --> RSI["RSI > 70"] --> S1(["SELL"])
    B1 & S1 --> CS["<b>Composite Strategy</b><br/>Majority Vote / Weighted"] --> F(["Tín hiệu cuối"])
```

## 3. Backtest: thử trên dữ liệu quá khứ

Vài tín hiệu đúng không chứng minh chiến lược tốt. Backtest chạy quy tắc liên tục qua cả giai đoạn lịch sử.

```mermaid
flowchart LR
    IN["Strategy + pair<br/>+ timeframe + giai đoạn"] --> SIM["Mô phỏng"] --> TR["Danh sách trades"] --> CH["Entry / Exit<br/>trên biểu đồ"]
```

| Giao dịch | Entry | Exit | Kết quả |
|---|---|---|---|
| #1 | $82, 000 | $86, 000 | Lãi |
| #2 | $88, 000 | $87, 000 | Lỗ |

## 4. Evaluation: hiệu quả và rủi ro

Đếm lệnh thắng chưa đủ; cần nhìn cả lợi nhuận lẫn rủi ro.

| Chỉ số | Câu hỏi người dùng |
|---|---|
| Total Return | Vốn tăng/giảm bao nhiêu? |
| Win Rate | Bao nhiêu % lệnh có lãi? |
| Maximum Drawdown | Sụt giảm lớn nhất bao nhiêu? |
| Number of Trades | Dựa trên bao nhiêu lệnh? |

Return cao hơn chưa chắc tốt hơn. Hai chiến lược cùng bắt đầu với 100 đơn vị vốn:

```mermaid
xychart-beta
    title "Vốn theo thời gian: A (đi sâu) và B (đi đều)"
    x-axis ["T1", "T2", "T3", "T4", "T5", "T6", "T7"]
    y-axis "Vốn" 60 --> 140
    line [100, 115, 125, 90, 69, 95, 130]
    line [100, 106, 112, 103, 110, 118, 125]
```

| Strategy | Return | Max Drawdown | Người dùng trải qua |
|---|---|---|---|
| A | +30% | -45% (125 → 69) | Có lúc mất gần nửa vốn trước khi hồi lại |
| B | +25% | -8% (112 → 103) | Lãi ít hơn một chút nhưng gần như không sụt sâu |

## 5. Leaderboard: so sánh nhiều chiến lược

Đặt kết quả cạnh nhau, sắp xếp theo Return, Win Rate, MDD hoặc điểm tổng hợp; giữ Top-K.

| Hạng | Strategy | Return | Win rate | MDD |
|---|---|---|---|---|
| 1 | MA + RSI + SR | 24.2% | 62% | -7.1% |
| 2 | MA + BB | 21.7% | 55% | -8.4% |
| 3 | RSI + SR | 18.4% | 64% | -6.7% |

## 6. Search: tự động tìm chiến lược để thử

Quá nhiều tổ hợp và tham số để thử thủ công.

```mermaid
flowchart LR
    SE["<b>Search</b><br/>Sinh candidate"] --> BT["Backtest"] --> EV["Evaluation"] --> LB["Leaderboard"] --> SE
    USR(["Người dùng"]) -.->|"Số candidate · thời gian · điều kiện dừng"| SE
```

Người dùng theo dõi trạng thái phiên Search để phân biệt "chưa tìm thấy candidate tốt hơn", "đang tạm dừng" và "gặp lỗi":

```mermaid
stateDiagram-v2
    direction LR
    state "Chưa chạy" as ChuaChay
    state "Đang chạy" as DangChay
    state "Tạm dừng" as TamDung
    state "Hoàn tất" as HoanTat
    state "Lỗi" as Loi
    [*] --> ChuaChay
    ChuaChay --> DangChay: Bắt đầu
    DangChay --> TamDung: Tạm dừng
    TamDung --> DangChay: Tiếp tục
    DangChay --> HoanTat: Đạt điều kiện dừng
    DangChay --> Loi: Gặp lỗi
```

Candidate đứng đầu chỉ là tốt nhất theo dữ liệu đã thử, không chắc có lợi nhuận thật.

## 7. News: bổ sung bối cảnh

```mermaid
flowchart LR
    N["Tin tức<br/>theo coin / pair"] --> SM{"Sentiment"}
    SM --> POS(["Positive"]) & NEU(["Neutral"]) & NEG(["Negative"])
    POS & NEU & NEG -.->|"chỉ khi có quy tắc"| ST["Strategy"]
```
