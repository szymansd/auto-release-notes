const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs').promises;
const jira_connector = require('connectors/jira');

const issuesMappers = {
    jira: jira_connector
}

const run = async () => {
    const githubToken = core.getInput('github_token', { required: true });
    let descriptionTemplate = core.getInput('description_template') ||
        `# Features:
        {{features}}
        \n# Chores:
        {{chores}}
        `;
    const titleTemplate = core.getInput('title_template') || `Deployment {{date}}`;
    const descriptionTemplateFilepath = core.getInput('description_template_filepath');
    
    // Issues management systems
    const issuesManagementSystem = core.getInput('ticket_management');
    let issueFinder = null;
    if (issuesManagementSystem && issuesMappers[issuesManagementSystem]) {
        issueFinder = issuesMappers[issuesManagementSystem].connect(core);
    }

    try {
        const templateFileBuffer = await fs.readFile(descriptionTemplateFilepath);
        descriptionTemplate = templateFileBuffer.toString();
    } catch (e) {
        core.warning('Template file not found will fallback to description_template value');
    }

    const octokit = github.getOctokit(githubToken);

    const baseBranch = process.env.GITHUB_REF;

    const [_, pull, pullNumber] = baseBranch.split('/');

    const params = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pullNumber,
    };

    if (pull !== 'pull') {
        throw new Error('This is not a Pull Request');
    }

    const featurePattern = core.getInput("feature_commit_pattern");

    const regex = new RegExp(featurePattern+'\d*', 'gmi');
    const { data } = await octokit.request(`GET /repos/${params.owner}/${params.repo}/pulls/${params.pull_number}/commits`, {
        ...params,
    })
    const features = [];
    const chores = [];

    data.forEach(({ commit }) => {
        const commitId = commit.message.match(regex);
        if (commitId) {
            if (!features.find((featureMessage) => featureMessage.includes(commitId))) {
                if (issueFinder) {
                    let issueTitle = issueFinder.find(commitId);
                    features.push(`${commitId}-${issueTitle}`);
                } else {
                    features.push(commit.message);
                }
            }
        } else {
            chores.push(commit.message);
        }
    });

    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });
    const url = `/repos/${params.owner}/${params.repo}/pulls/${pullNumber}`;

    params.body = descriptionTemplate
        .replace('{{features}}', features.reduce((prev, curr) => prev += `\n- ${curr}`, ''))
        .replace('{{chores}}', chores.reduce((prev, curr) => prev += `\n- ${curr}`, ''));

    params.title = titleTemplate.replace('{{date}}', `${date.getDate()} ${month}`);

    await octokit.request(`PATCH ${url}`, params);
}

run().then(() => {
        core.info('Pull request updated successfully');
    })
    .catch((e) => {
        core.setFailed(e.message);
    });
