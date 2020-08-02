const github = require('@actions/github');

// Returns the PR number from a commit message, or null if one can't be found.
function extractPRNumber(commitMsg) {
    const re = /Merge pull request #(\d+) from/
    const matches = commitMsg.match(re)
    if (matches !== null && matches.length > 1) {
        return matches[1].trim()
    }

    return null
}

// Fetches the details of a pull request.
async function fetchPR(num, config) {
    try {
        const data = await config.octokit.pulls.get({
            ...github.context.repo,
            pull_number: num
        });

        return data.data;
    }
    catch (fetchError) {
        throw new Error(`failed to fetch data for PR #${num}: ${fetchError.message}`);
    }
}

// Retuns the release type (major, minor, or patch) based on the tags in the PR.
function getReleaseType(pr, config) {
    const labelNames = pr.labels.map(label => label.name)
    const releaseLabelsPresent = labelNames.filter(name => Object.keys(config.releaseLabels).includes(name))
    if (releaseLabelsPresent.length === 0) {
        throw new Error('no release label specified on PR')
    } else if (releaseLabelsPresent.length > 1) {
        throw new Error(`too many release labels specified on PR: ${releaseLabelsPresent}`)
    }

    return config.releaseLabels[releaseLabelsPresent[0]]
}

// Extracts the release notes from the PR body.
function getReleaseNotes(pr, config) {
    let notes = ''
    if (pr.body !== null && pr.body !== '') {
        const matches = pr.body.match(config.releaseNotesRegex)
        if (matches !== null && matches.length > 1) {
            notes = matches[1].trim()
        }
    }

    if (notes === ''  && config.requireReleaseNotes) {
        throw new Error('missing release notes')
    }

    return notes
}

exports.extractPRNumber = extractPRNumber
exports.fetchPR = fetchPR
exports.getReleaseType = getReleaseType
exports.getReleaseNotes = getReleaseNotes