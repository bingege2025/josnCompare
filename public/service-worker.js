/**
 * JSON Compare Background Service Worker
 * 监听扩展图标点击，打开全屏独立标签页以便完整对比双栏大文本
 */
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('index.html');
  await chrome.tabs.create({ url });
});
