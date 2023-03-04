import JiraApi from 'jira-client';

let jira = null;

function connect(core) {
  jira = new JiraApi({
    protocol: 'https',
    host: core.getInput('jira_url'),
    username: core.getInput('jira_username'),
    password: core.getInput('jira_password'),
    apiVersion: '2',
    strictSSL: true
  });
}

function find(issueNumber) {
  jira.findIssue(issueNumber)
    .then(issue => {
      return issue.fields.summary;
    })
    .catch(err => {
      console.error(err);
      return issueNumber;
    });
}

module.exports = {
  connect: connect,
  find: find
}

