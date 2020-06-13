const getBuilds = require("./getBuilds");

class PaperFetcher {
    async fetchLatest(currentVersion, args) {
        return await getBuilds(currentVersion, args);
    }
}

module.exports = PaperFetcher;
