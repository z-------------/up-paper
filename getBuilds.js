const semverSatisfies = require("semver/functions/satisfies");
const semverMajor = require("semver/functions/major");
const semverMinor = require("semver/functions/minor");
const semverParse = require("semver/functions/parse");
const p = require("phin");

const getDownloadsList = require("./getDownloadsList");

const MSG_NO_MATCHING_VERSION = "No matching version.";

async function getBuilds(currentVersion, args) {
    const currentBuild = currentVersion !== null ? semverParse(currentVersion).build : null;

    const json = await getDownloadsList();

    // find matching version
    let matchingVersion;
    for (const key in json) {
        const apiVersion = json[key].api_version;
        if (
            json[key].api_endpoint === "paper"
            && (currentVersion === null || semverSatisfies(apiVersion, `~${currentVersion}`))
        ) {
            matchingVersion = apiVersion;
            break;
        }
    }
    if (!matchingVersion) throw MSG_NO_MATCHING_VERSION;

    // get builds
    const major = `${semverMajor(matchingVersion)}.${semverMinor(matchingVersion)}`;
    const { builds } = (await p({
        url: `https://papermc.io/ci/job/Paper-${major}/api/json?tree=builds[number,timestamp,changeSet[items[comment,commitId,msg]]]`,
        parse: "json",
    }).then(r => r.body));

    const newerBuilds = builds
        .filter(build => build.number > currentBuild)
        .filter(build => {
            for (let commit of build.changeSet.items) {
                if (commit.comment.includes("[CI-SKIP]")) return false;
            }
            return true;
        });
    if (!newerBuilds.length) throw MSG_NO_MATCHING_VERSION;

    const result = [];
    for (const build of newerBuilds) {
        result.push({
            versionString: `${matchingVersion}+${build.number}`,
            downloadUrl: `https://papermc.io/api/v1/paper/${matchingVersion}/${build.number}/download`,
            notes: build.changeSet.items.map(item => `[${item.commitId.substr(0, 7)}] ${item.comment}`).join("\n"),
            date: new Date(build.timestamp),
        });
    }
    return result;
}

module.exports = getBuilds;
