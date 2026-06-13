/**
 * @typedef {Object} ScraperState
 * @property {boolean} running
 * @property {boolean} paused
 * @property {Set<string>} buffer
 * @property {number} totalSaved
 * @property {MutationObserver|null} observer
 * @property {HTMLElement|null} overlay
 */

const state = {
    running: false,
    paused: false,
    buffer: new Set(),
    totalSaved: 0,
    observer: null,
    overlay: null
};

let db = null;
const DB_NAME = "PsXDB";
const STORE_NAME = "imageUrls";
const BATCH_SIZE = 200;

/** @returns {Promise<IDBDatabase>} */
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => {
            const d = e.target.result;
            if (!d.objectStoreNames.contains(STORE_NAME)) {
                d.createObjectStore(STORE_NAME, { keyPath: "url" });
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

/**
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
async function saveBatch(urls) {
    if (!db) db = await openDB();
    return new Promise(resolve => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        urls.forEach(url => store.put({ url }));
        tx.oncomplete = resolve;
    });
}

/**
 * @param {string} url
 * @returns {string}
 */
function cleanUrl(url) {
    return url
        .replace(/\/(webp|236x|474x|736x)\//g, "/originals/")
        .replace(/\.webp$/, ".jpg");
}

/**
 * @param {HTMLImageElement} img
 */
function processImage(img) {
    if (state.paused) return;

    let raw = img.src || "";
    if (img.srcset) {
        const parts = img.srcset.split(",");
        raw = parts[parts.length - 1].trim().split(" ")[0];
    }
    if (!raw.includes("pinimg.com") || raw.includes("/user/")) return;

    const hd = cleanUrl(raw);
    if (!state.buffer.has(hd)) {
        state.buffer.add(hd);

        if (state.buffer.size >= BATCH_SIZE) {
            const batch = Array.from(state.buffer);
            state.buffer.clear();
            saveBatch(batch).then(() => {
                state.totalSaved += batch.length;
                updateOverlay();
                sendStatus();
            });
        }
    }
}

function injectCSS() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("overlay.css");
    document.head.appendChild(link);
}

function createOverlay() {
    injectCSS();
    const box = document.createElement("div");
    box.id = "pinterest-scraper-overlay";
    document.body.appendChild(box);
    state.overlay = box;
    updateOverlay();
}

function updateOverlay() {
    if (!state.overlay) return;
    state.overlay.innerHTML =
        `Running: ${state.running}<br>` +
        `Paused: ${state.paused}<br>` +
        `Saved: ${state.totalSaved}<br>` +
        `Buffer: ${state.buffer.size}`;
}

function sendStatus() {
    chrome.runtime.sendMessage({
        type: "statusUpdate",
        tabId: document.visibilityState === "visible" ? null : null,
        running: state.running,
        paused: state.paused,
        totalSaved: state.totalSaved,
        bufferSize: state.buffer.size
    });
}

function startScraper() {
    if (state.running) return;
    state.running = true;
    state.paused = false;
    if (!state.overlay) createOverlay();

    state.observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.tagName === "IMG") processImage(node);
                else if (node.querySelectorAll)
                    node.querySelectorAll("img").forEach(processImage);
            });
        }
        updateOverlay();
        sendStatus();
    });

    state.observer.observe(document.body, { childList: true, subtree: true });
    updateOverlay();
    sendStatus();
}

function pauseScraper() {
    state.paused = true;
    updateOverlay();
    sendStatus();
}

function resumeScraper() {
    state.paused = false;
    updateOverlay();
    sendStatus();
}

/** @returns {Promise<void>} */
async function stopScraper() {
    if (!state.running) return;
    state.running = false;
    state.paused = false;

    if (state.observer) state.observer.disconnect();

    if (state.buffer.size > 0) {
        const batch = Array.from(state.buffer);
        state.buffer.clear();
        await saveBatch(batch);
        state.totalSaved += batch.length;
    }

    updateOverlay();
    sendStatus();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.command === "start") startScraper();
    if (msg.command === "pause") pauseScraper();
    if (msg.command === "resume") resumeScraper();
    if (msg.command === "stop") stopScraper();
    if (msg.command === "export") exportAll();
    sendResponse({ ok: true });
});
