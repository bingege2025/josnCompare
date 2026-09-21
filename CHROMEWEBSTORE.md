# Chrome Web Store 发布信息指南 (JSON Compare)

本文档是提交至 Chrome Web Store (Chrome 开发者后台) 时的单一信息源，包含多语言商店文案、权限审查理由、隐私合规声明与审核清单。

---

## 一、基本元数据 (Store Listing Metadata)

- **版本号 (Version)**：`1.0.0`
- **类别 (Category)**：开发者工具 (Developer Tools)
- **支持语言**：中文 (简体)、English、Deutsch、Français、Русский
- **扩展包**：`json-compare-v1.0.0.zip`
- **主机权限 (Host Permissions)**：无
- **敏感权限 (Sensitive Permissions)**：无

---

## 二、多语言商品详情 (Localized Store Listings)

### 中文 (简体) / zh-CN

- **名称**：`JSON Compare - 接口差异对比工具`
- **简短说明**：
```text
面向开发者的结构化 JSON 对比工具，精准排查接口字段变化、类型异常与数据变更，支持一键忽略噪声字段。
```
- **详细说明**：
```text
JSON Compare 是一款专为后端、前端及测试工程师打造的高性能结构化 JSON 对比扩展。

核心功能：
1. 结构化深度对比：不同于传统逐行文本 diff，按 JSON 解析结构进行比较，键名顺序无关，精准定位新增、删除、值变化与类型变化。
2. 高精度无损解析：支持超长整数 ID，避免 JavaScript 数字精度丢失造成误判；可将 1 与 1.0、100 与 1e2 判定为相同数值。
3. 严格区分边界状态：明确区分字段缺失、null、空字符串、数字 0 与 false，避免接口排查中的隐式类型误判。
4. 路径级噪声过滤：支持 RFC 6901 JSON Pointer，可一键忽略 requestId、timestamp、traceId 等动态字段；忽略父路径时自动级联其全部子节点。
5. 独立大屏工作台：点击扩展图标即可在新标签页打开双栏对比界面，适合查看长接口响应和复杂嵌套数据。
6. 多语言界面：支持简体中文、英语、德语、法语和俄语，适合跨地区开发团队使用。
7. 本地使用统计：仅在浏览器本地记录打开次数、比对次数和功能触发次数，便于了解自己的使用频率。

隐私与安全：
- 所有 JSON 解析和对比都在浏览器本地内存中完成。
- 不申请任何主机权限，不读取网页内容。
- 不上传 JSON 内容、差异值、字段路径或使用日志。
- 断网也可使用核心对比功能。
```

### English / en

- **Name**: `JSON Compare - API Diff Tool`
- **Short Description**:
```text
A developer-friendly structural JSON diff tool for spotting API changes, type shifts, and noisy dynamic fields.
```
- **Detailed Description**:
```text
JSON Compare is a high-performance structural JSON comparison extension built for backend, frontend, and QA engineers.

Key features:
1. Structured deep comparison: unlike line-by-line text diff tools, it compares parsed JSON structures, ignores object key order, and pinpoints additions, removals, value changes, and type changes.
2. Lossless numeric parsing: supports very long integer IDs and avoids false positives caused by JavaScript number precision loss. Values such as 1 and 1.0, or 100 and 1e2, are treated as the same number.
3. Precise edge-state handling: clearly distinguishes missing fields, null, empty strings, numeric 0, and false.
4. Path-level noise filtering: supports RFC 6901 JSON Pointer, so dynamic fields such as requestId, timestamp, and traceId can be ignored with one click. Ignoring a parent path also ignores all of its children.
5. Dedicated full-page workspace: clicking the extension icon opens a two-column comparison view in a new tab, designed for long API responses and deeply nested data.
6. Multilingual interface: supports Simplified Chinese, English, German, French, and Russian for international development teams.
7. Local usage statistics: stores only local counters such as page opens, comparison runs, and feature usage counts.

Privacy and security:
- All JSON parsing and comparison run locally in browser memory.
- No host permissions are requested and web page content is never read.
- JSON content, diff values, field paths, and usage logs are never uploaded.
- Core comparison features work offline.
```

### Deutsch / de

- **Name**: `JSON Compare - API-Diff-Werkzeug`
- **Kurzbeschreibung**:
```text
Strukturiertes JSON-Diff-Werkzeug für Entwickler, um API-Änderungen, Typwechsel und dynamische Störfelder zu finden.
```
- **Ausführliche Beschreibung**:
```text
JSON Compare ist eine leistungsstarke Erweiterung zum strukturierten Vergleich von JSON-Daten für Backend-, Frontend- und QA-Teams.

Hauptfunktionen:
1. Strukturierter Tiefenvergleich: statt zeilenweisem Text-Diff werden geparste JSON-Strukturen verglichen. Die Reihenfolge von Objektschlüsseln spielt keine Rolle; Hinzufügungen, Löschungen, Wertänderungen und Typänderungen werden präzise angezeigt.
2. Verlustfreie Zahlenverarbeitung: unterstützt sehr lange Integer-IDs und verhindert Fehlalarme durch JavaScript-Präzisionsverluste. Werte wie 1 und 1.0 oder 100 und 1e2 werden als gleiche Zahl erkannt.
3. Exakte Behandlung von Randfällen: fehlende Felder, null, leere Zeichenketten, 0 und false werden eindeutig unterschieden.
4. Pfadbasierte Rauschfilterung: unterstützt RFC 6901 JSON Pointer. Dynamische Felder wie requestId, timestamp oder traceId können mit einem Klick ignoriert werden; ein ignorierter Elternpfad schließt automatisch alle Kindpfade ein.
5. Eigenständiger Arbeitsbereich: ein Klick auf das Erweiterungssymbol öffnet eine zweispaltige Vergleichsansicht in einem neuen Tab, ideal für lange API-Antworten und verschachtelte Daten.
6. Mehrsprachige Oberfläche: unterstützt vereinfachtes Chinesisch, Englisch, Deutsch, Französisch und Russisch.
7. Lokale Nutzungsstatistik: speichert nur lokale Zähler wie Seitenaufrufe, Vergleichsläufe und Funktionsnutzung.

Datenschutz und Sicherheit:
- JSON-Parsing und Vergleich erfolgen vollständig lokal im Browser-Speicher.
- Es werden keine Host-Berechtigungen angefordert und keine Webseiteninhalte gelesen.
- JSON-Inhalte, Diff-Werte, Feldpfade und Nutzungsprotokolle werden niemals hochgeladen.
- Die Kernfunktionen funktionieren auch offline.
```

### Français / fr

- **Nom** : `JSON Compare - Outil de diff API`
- **Description courte** :
```text
Outil de diff JSON structuré pour repérer les changements d’API, les changements de type et les champs dynamiques bruyants.
```
- **Description détaillée** :
```text
JSON Compare est une extension de comparaison JSON structurée et performante, conçue pour les équipes backend, frontend et QA.

Fonctions principales :
1. Comparaison structurée en profondeur : contrairement aux outils de diff ligne par ligne, l’extension compare les structures JSON analysées, ignore l’ordre des clés d’objet et localise précisément les ajouts, suppressions, changements de valeur et changements de type.
2. Analyse numérique sans perte : prend en charge les très grands identifiants entiers et évite les faux positifs liés à la précision numérique de JavaScript. Les valeurs comme 1 et 1.0, ou 100 et 1e2, sont traitées comme le même nombre.
3. Gestion précise des états limites : distingue clairement les champs absents, null, les chaînes vides, le nombre 0 et false.
4. Filtrage du bruit par chemin : prend en charge RFC 6901 JSON Pointer. Les champs dynamiques comme requestId, timestamp ou traceId peuvent être ignorés en un clic ; ignorer un chemin parent ignore aussi tous ses enfants.
5. Espace de travail dédié : un clic sur l’icône de l’extension ouvre une vue de comparaison à deux colonnes dans un nouvel onglet, adaptée aux longues réponses API et aux données imbriquées.
6. Interface multilingue : prend en charge le chinois simplifié, l’anglais, l’allemand, le français et le russe.
7. Statistiques locales : stocke uniquement des compteurs locaux tels que les ouvertures de page, le nombre de comparaisons et l’utilisation des fonctions.

Confidentialité et sécurité :
- Toute l’analyse et la comparaison JSON s’effectuent localement en mémoire dans le navigateur.
- Aucune permission d’hôte n’est demandée et aucun contenu de page web n’est lu.
- Le contenu JSON, les valeurs de diff, les chemins de champs et les journaux d’utilisation ne sont jamais envoyés.
- Les fonctions principales restent disponibles hors ligne.
```

### Русский / ru

- **Название**: `JSON Compare - инструмент сравнения API`
- **Краткое описание**:
```text
Структурный JSON diff для разработчиков: изменения API, типы данных и динамические шумные поля.
```
- **Подробное описание**:
```text
JSON Compare — это расширение для высокопроизводительного структурного сравнения JSON, созданное для backend-, frontend- и QA-инженеров.

Основные возможности:
1. Глубокое структурное сравнение: вместо построчного текстового diff расширение сравнивает разобранные JSON-структуры, не учитывает порядок ключей объектов и точно показывает добавления, удаления, изменения значений и изменения типов.
2. Точная обработка чисел без потерь: поддерживает очень длинные целочисленные ID и предотвращает ложные отличия из-за потери точности JavaScript. Значения 1 и 1.0, а также 100 и 1e2 считаются одинаковыми числами.
3. Точное различение граничных состояний: отсутствующее поле, null, пустая строка, число 0 и false различаются явно.
4. Фильтрация шума по пути: поддерживается RFC 6901 JSON Pointer. Динамические поля, такие как requestId, timestamp и traceId, можно игнорировать одним кликом; игнорирование родительского пути автоматически исключает все дочерние узлы.
5. Отдельная рабочая область: нажатие на значок расширения открывает двухколоночное окно сравнения в новой вкладке, удобное для длинных ответов API и глубоко вложенных данных.
6. Многоязычный интерфейс: поддерживаются упрощенный китайский, английский, немецкий, французский и русский языки.
7. Локальная статистика использования: сохраняются только локальные счетчики, например открытия страницы, запуски сравнения и использование функций.

Конфиденциальность и безопасность:
- Весь разбор и сравнение JSON выполняются локально в памяти браузера.
- Расширение не запрашивает host permissions и не читает содержимое веб-страниц.
- JSON-данные, значения отличий, пути полей и журналы использования никогда не загружаются на сервер.
- Основные функции работают без подключения к интернету.
```

---

## 三、权限与审查理由说明 (Permissions Justification)

在开发者后台权限说明栏填入以下合规原因：

| 声明权限 | 用途与审查理由 (Plain-English Justification) |
| :--- | :--- |
| `storage` | Required solely to persist local usage counters and the selected interface language on the user's machine. The extension does not store JSON payloads, diff values, field paths, personal information, or page content. |

> **主机权限 (Host Permissions)**：无。不申请任何全网域名或特定域名的读取/注入权限。  
> **敏感权限 (Sensitive Permissions)**：无。

---

## 四、隐私与数据合规披露 (Privacy & Data Use)

- **单用途说明 (Single Purpose)**：仅用于在本地对比两段 JSON 数据的结构化差异并展示字段级变更项。
- **数据使用承诺 (Data Usage Declarations)**：
  - [x] 不会向任何第三方出售用户数据。
  - [x] 不会将用户数据用于与扩展核心功能无关的用途（如广告定位、信贷评估等）。
  - [x] 不会将用户数据用于判定信用度或用于借贷目的。
- **个人身份信息 (PII)**：不收集任何个人身份信息、健康信息、财务信息或身份凭证。
- **远程传输**：无。扩展不上传 JSON 内容、差异值、字段路径或使用日志。

---

## 五、商店素材规范 (Store Assets)

- **图标 (Icons)**：
  - 16×16 px (`icons/icon-16.png`)
  - 48×48 px (`icons/icon-48.png`)
  - 128×128 px (`icons/icon-128.png`)
- **截图 (Screenshots)**：
  - 推荐尺寸：1280×800 或 640×400
  - 已准备 5 张真实界面 1280×800 截图：结构化对比、多语言界面、忽略路径、使用统计、俄语界面。
