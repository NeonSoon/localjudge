# LocalJudge

LocalJudge 是一個 VS Code Extension，目標是在編輯器內直接提交程式碼至遠端 Judge Server，並取得評測結果。本專案核心在於建立完整的程式評測流程，同時實踐模組化與分層架構設計。

---

## 專案目標

- 在 VS Code 內完成登入、提交與查詢評測結果
- 與自建後端 API 串接
- 使用 JWT Token 驗證機制
- 降低模組耦合與 merge 衝突風險
- 建立可擴充的 Judge 系統架構

---

## 目前進度

### 1. Extension 基本架構

- Command 註冊與事件綁定
- OutputChannel 日誌系統
- TypeScript 編譯流程
- 設定檔讀取與管理

### 2. API 串接模組

已實作以下功能：

- `log-in/log-out`
- `getProject`
- `getOberservation`
- `getBlock`
- `getQuiz`

藉由log-in 讀取API 取得Token之後帶去接下來API呼叫的session 完成帶有使用者Token的API呼叫

### 3. Token 認證流程

- 串接登入 API
- 取得並儲存 JWT Token（VS Code Secret Storage）
- Authorization Bearer Header 驗證
- 登出時同步刪除本地與伺服器端 Token

### 4. 架構優化

- 將 API、Token、Command 拆分為獨立模組
- 強化 debug log 與 request/response 紀錄
- 建立分支測試與 merge 流程

---

## 待強化項目

- 明確化 API 規格與錯誤碼設計
- 進一步拆分 UI 與 Service Layer
- 強化錯誤處理與 Token 過期機制
- 建立後端 Queue 與 Worker 架構
- 加入多語言與資源限制支援

---

## 未來展望

### 短期

- 完成完整 OJ 流程
- 題目列表與題目詳情
- 歷史提交紀錄查詢
- 本地測試案例模擬

### 中期

- Extension 完全定位為 Client
- 後端微服務化
- 導入 Message Queue
- Docker Sandbox 執行環境

### 長期

- 建立 Web 版 Judge UI
- 排行榜與使用者系統
- CI 整合（如 GitHub Actions）
- 教學與課程應用場景

---

## 技術重點

- VS Code Extension API
- TypeScript 模組化設計
- JWT 認證流程
- RESTful API 設計
- Git 分支管理與協作策略
- 前後端分層架構設計

---

LocalJudge 是一個從工具型專案逐步走向平台化架構的實作過程，重點在於透過實際開發，深化對軟體工程分層、模組化與系統設計的理解。
