# Privacy Policy for JSON Compare

**Last updated:** September 21, 2026

This privacy policy explains how **JSON Compare** ("we", "the extension") handles user data when you use the browser extension.

---

## 1. Single Purpose

JSON Compare is designed strictly as a developer utility to compute structural differences between two JSON payloads and display field-level additions, deletions, value modifications, and type shifts in an intuitive side-by-side interface.

---

## 2. What Data We Process and Where It Stays

### A. Your JSON Content (Zero Transmission)
- All JSON text you paste, type, format, or compare remains **100% inside your browser's local memory**.
- **No JSON data is ever transmitted** to external servers, cloud services, third-party APIs, or AI models.
- When you refresh or close the extension tab, your JSON input and comparison results are immediately cleared from memory.

### B. Usage Statistics (Local Storage by Default)
- To help users track their usage frequency, the extension maintains counters for:
  - Total times the extension tab is opened
  - Number of comparisons performed today and all-time
  - Function interaction counts (such as formatting, swapping sides, ignoring fields, copying paths)
- **Where it is stored:** These aggregate counters are saved locally on your device via the `chrome.storage.local` API.
- **No Personal Identifiable Information (PII)** is collected or attached to these statistics.

### C. No Remote Endpoint or Network Upload
- The extension does not include a remote analytics endpoint, external tracking script, or telemetry upload feature.
- Usage counters stay on your device and are not transmitted to the developer or any third party.

---

## 3. Permissions Justification

| Permission | Purpose |
| :--- | :--- |
| `storage` | Required solely to persist local usage counters and the selected interface language on the user's machine. The extension does not store JSON payloads, diff values, field paths, personal information, or page content. |

**Host Permissions:** None requested. The extension does not inspect web pages, inject scripts, or intercept web traffic.

---

## 4. Data Sharing and Third-Party Disclosure

- **We do NOT sell, rent, or monetize your data under any circumstances.**
- **We do NOT share your data with advertisers, data brokers, or credit evaluation entities.**
- **We do NOT use external tracking scripts, third-party analytics (e.g., Google Analytics), or tracking cookies.**

---

## 5. User Control and Data Deletion

You retain full control over your local data:
- You can clear all usage statistics at any time by clicking the clear statistics button inside the extension's Usage Statistics panel.
- Uninstalling the extension automatically removes all stored data from `chrome.storage.local`.

---

## 6. Changes to This Policy

If we update our privacy practices, we will post the revised policy here and update the "Last updated" date.

---

## 7. Contact Us

If you have questions about this privacy policy or the extension's data practices, please open an issue on the project repository or contact the developer.
