const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require("child_process");

const run = async () => {
    const githubToken = core.getInput('github_token', { required: true });
    const descriptionTemplate = core.getInput('description_template') || `
        **Features:**
        {{feature_commits}}
        **Chores:**
        {{chores_commits}}
    `;
    const titleTemplate = core.getInput('title_template') || `Deployment {{date}}`;

    const octokit = github.getOctokit(githubToken);
    const params = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    };

    const targetBranch = process.env.GITHUB_BASE_REF;
    const baseBranch = process.env.GITHUB_REF;

    const [_, pull, pullNumber] = baseBranch.split('/');

    if (pull === 'pull') {
        throw new Error('This is not a Pull Request');
    }

    const featurePattern = core.getInput("feature_commit_pattern");

    const commitList = execSync(`git log --pretty=format:"%s" --no-merges --author-date-order ${targetBranch}...${baseBranch}`);
    const features = [];
    const chores = [];

    commitList.forEach((item) => {
        if(item.match(featurePattern)) {
            features.push(item);
        } else {
            chores.push(item);
        }
    });

    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });

    const url = `/repos/${params.owner}/${params.repo}/pulls/${pullNumber}`;

    params.description = descriptionTemplate
        .replace('{{feature_commits}}', features.reduce((prev, curr) => prev += `\n- ${curr}`, ''))
        .replace('{{chores_commits}}', chores.reduce((prev, curr) => prev += `\n- ${curr}`, ''));
    params.title = titleTemplate.replace('{{date}}', `${date.getDate()} ${month}`);

    await octokit.request(`PATCH ${url}`, params);
}

run().then(() => {
        core.info('Pull request updated succesfully');
    })
    .catch((e) => {
        core.setFailed(e.message);
    });
