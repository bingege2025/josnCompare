# Chrome Web Store 商店发布实操指南 (JSON Compare)

本指南将手把手指导你将 **JSON Compare** 发布至 Chrome 应用商店（Chrome Web Store）。所有发布材料均已在本项目中准备就绪。

---

## 📦 已准备好的材料清单

| 材料类型 | 存放路径 | 尺寸/规格 | 说明 |
| :--- | :--- | :--- | :--- |
| **扩展发布安装包** | `json-compare-v1.0.0.zip` | ZIP 压缩包 | 符合 CWS 结构规范，直接上传 |
| **商店应用图标** | `store-assets/icon-128.png` | 128×128 px PNG | 商店展台大图标 |
| **功能截图 1** | `store-assets/screenshots/screenshot-1-compare-diff.png` | 1280×800 px PNG | 双栏结构化比对与差异高亮 |
| **功能截图 2** | `store-assets/screenshots/screenshot-2-ignore-and-stats.png` | 1280×800 px PNG | 噪声字段忽略与使用频次统计 |
| **小型宣传横幅** | `store-assets/promo-small-440x280.png` | 440×280 px PNG | 商店首页推荐卡片（可选上传） |
| **隐私权政策文档** | `docs/privacy-policy.html` / `docs/PRIVACY_POLICY.md` | HTML / Markdown | 托管在 GitHub Pages 或网站 |
| **填表文案与理由** | `CHROMEWEBSTORE.md` | Markdown | 复制粘贴到开发者后台各输入框 |

---

## 🚀 实操发布步骤

### 第一步：登录 Chrome 开发者控制台
1. 打开浏览器访问：[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 登录你的 Google 账号。
   *(注：若是首次注册开发者账号，Google 会收取一次性 5 美元的注册费)*

---

### 第二步：上传扩展安装包
1. 在控制台右上角点击 **「+ 新项」 (New Item)** 按钮。
2. 将项目根目录下的 **`json-compare-v1.0.0.zip`** 拖拽上传。
3. 系统解包校验成功后，会自动进入该扩展的编辑详情页。

---

### 第三步：填写“商品详情” (Store Listing)
从项目中的 **`CHROMEWEBSTORE.md`** 复制对应语言内容。当前已准备 5 套商品详情：中文（简体）、English、Deutsch、Français、Русский。

1. **默认商品说明**：
   - **名称**：`JSON Compare - 接口差异对比工具`
   - **简短说明** (不超过 132 字符)：
     ```text
     面向开发者的结构化 JSON 对比工具，精准排查接口字段变化、类型异常与数据变更，支持一键忽略噪声字段。
     ```
   - **详细说明**：复制 `CHROMEWEBSTORE.md` 中“中文 (简体) / zh-CN”的详细说明文本。
   - 在 Chrome Web Store 后台的本地化设置中，继续添加 `English`、`Deutsch`、`Français`、`Русский`，分别复制 `CHROMEWEBSTORE.md` 中对应语言的名称、简短说明和详细说明。
2. **图形素材 (Graphic Assets)**：
   - **128x128 像素图标**：上传 `store-assets/icon-128.png`
   - **屏幕截图 (Screenshots)**：
     - 点击上传 `store-assets/screenshots/screenshot-1-compare-diff.png`
     - 点击上传 `store-assets/screenshots/screenshot-2-ignore-and-stats.png`
   - **小型宣传图 (可选)**：上传 `store-assets/promo-small-440x280.png`
3. **分类与类别 (Categorization)**：
   - **类别**：选择 `开发者工具` (Developer Tools)
   - **主要语言**：建议选择 `中文 (简体)`；如面向海外发布，也可以选择 `English`

---

### 第四步：填写“隐私权实践” (Privacy Practices)
这是审核最关键的部分，务必准确填写以确保秒过审核：

1. **单一用途说明 (Single Purpose Description)**：
   ```text
   A developer utility to compute structural differences between two JSON payloads and display field-level additions, deletions, value modifications, and type shifts.
   ```
2. **权限理由 (Permission Justification)**：
   针对 `storage` 权限：
   ```text
   Required solely to persist user usage counters (e.g., today's comparison count, all-time count) and user preferences locally on the user's machine.
   ```
   或使用 `CHROMEWEBSTORE.md` 中更新后的权限说明：仅用于本地保存使用计数和界面语言，不保存 JSON 内容、差异值、字段路径、个人信息或网页内容。
3. **主机权限 (Host Permissions)**：无申请，保持留空。
4. **数据使用合规勾选 (Data Usage Declarations)**：
   - 勾选全部三项承诺（不向第三方出售、不用于非核心功能、不用于信贷评估）。
   - 用户数据类型选择：无收集个人信息 (No PII collected)。
5. **隐私权政策网址 (Privacy Policy URL)**：
   - 将 `docs/privacy-policy.html` 部署到你的 GitHub Pages 或个人网站，填入其公开链接。

---

### 第五步：提交审核 (Submit for Review)
1. 检查右上角状态，确认必填项均显示绿色勾选。
2. 点击右上角的 **「提交以供审核」 (Submit for Review)** 按钮。
3. 审核周期通常在 **24 ~ 48 小时** 内完成。审核通过后，你的扩展就会正式在 Chrome Web Store 上线！
