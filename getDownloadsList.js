const p = require("phin");

async function getDownloadsList() {
    const body = (await p("https://papermc.io/js/downloads.js").then(r => r.body)).toString();

    let openCount = 0, closeCount = 0;
    let startIndex = -1, endIndex = -1;
    const chars = body.split("");
    for (let i = 0; i < chars.length; ++i) {
        const char = chars[i];
        if (char === "{") {
            ++openCount;
            if (startIndex === -1) startIndex = i;
        }
        else if (char === "}") ++closeCount;
        if (openCount > 1 && openCount == closeCount) {
            endIndex = i + 1;
            const sub = body
                .substring(startIndex, endIndex)
                .replace(/\/\/.*/g, "")
                .replace(/,\s*(?=})/g, "");
            return JSON.parse(sub);
        }
    }
}

module.exports = getDownloadsList;
