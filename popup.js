/**
 * @param {"start"|"stop"|"pause"|"resume"|"export"} command
 */
function send(command) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        chrome.runtime.sendMessage(
            { type: "control", command, tabId: tab.id },
            res => {
                document.getElementById("status").textContent =
                    `Running: ${res.running}, Paused: ${res.paused}`;
            }
        );
    });
}

document.getElementById("start").onclick = () => send("start");
document.getElementById("pause").onclick = () => send("pause");
document.getElementById("resume").onclick = () => send("resume");
document.getElementById("stop").onclick = () => send("stop");
document.getElementById("export").onclick = () => send("export");
