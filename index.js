const core = require('@actions/core');
const github = require('@actions/github');
var { execSync } = require("child_process");

try {
    const targetBranch = process.env.GITHUB_BASE_REF;
    const baseBranch = process.env.GITHUB_REF;

    const commitList = execSync(`git log --grep="GA-" --pretty=format:"%s" --no-merges --author-date-order ${targetBranch}...${baseBranch}`);
    const featurePattern = /GA-\d+/gi;
    const features = [];
    const chores = [];

    commitList.forEach((item) => {
        if(item.match(featurePattern)) {
            features.push(item);
        } else {
            chores.push(item);
        }
    });


} catch (error) {
    core.setFailed(error.message);
}
