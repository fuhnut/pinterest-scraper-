/**
 * @typedef {"start"|"stop"|"pause"|"resume"|"export"|"getTabId"} Command
 */

/**
 * @typedef {Object} TabState
 * @property {boolean} running
 * @property {boolean} paused
 * @property {number} totalSaved
 * @property {number} bufferSize
 */

/** @type {Record<number, TabState>} */
const tabs = {};

/**
 * @param {number} tabId
 * @param {Command} command
 */
function sendToContent(tabId, command) {
    chrome.tabs.sendMessage(tabId, { command });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "statusUpdate") {
        const tabId = sender.tab?.id;
        if (tabId != null) {
            tabs[tabId] = {
                running: msg.running,
                paused: msg.paused,
                totalSaved: msg.totalSaved,
                bufferSize: msg.bufferSize
            };
        }
        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "getTabId") {
        sendResponse({ tabId: sender.tab?.id });
        return;
    }

    if (msg.type === "control") {
        const tabId = msg.tabId;
        if (!tabs[tabId]) {
            tabs[tabId] = { running: false, paused: false, totalSaved: 0, bufferSize: 0 };
        }

        if (msg.command === "start") tabs[tabId].running = true;
        if (msg.command === "stop") tabs[tabId].running = false;
        if (msg.command === "pause") tabs[tabId].paused = true;
        if (msg.command === "resume") tabs[tabId].paused = false;

        sendToContent(tabId, msg.command);
        sendResponse(tabs[tabId]);
    }
});
