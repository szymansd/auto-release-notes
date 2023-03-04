# Auto Release Notes
A GitHub action to create release notes for pull request.

## Usage

---------
### Pre-requisites
Create a workflow .yml file in your repositories `.github/workflows` directory. For more information, reference the [GitHub Help Documentation](https://docs.github.com/en/actions/using-workflows#creating-a-workflow-file).

This workflow will be running only if it's run for pull request. Otherwise it will fail with message: `This is not a Pull Request`.

### Inputs
- `github_token`: Github token
- `feature_commit_pattern`: Feature commit pattern. Example: `JIRA-`. You can use same pattern as for [autolinking issues](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls#issues-and-pull-requests).
- `description_template`: This is a description template use {{features}} to replace it by list of commits matched using feature_commit_pattern and {{chores}} will be replace by commit description list not matched feature_commit_pattern. Default value:
    ```
  # Features:
  {{features}}
  # Chores:
  {{chores}}
  ```
- `description_template_filepath`: If you need to use more complex template you can use MD file. Use {{feature_commits}} in the template to replace it with list of commits matched using feature_commit_pattern and {{chores_commits}} will be replace by commit description list not matched feature_commit_pattern. This will overwrite description_template. If file not exist will fallback to description_template. Sample template file can be found [here](https://github.com/szymansd/auto-release-notes/blob/main/.github/templates/deployment.md).
- `title_template`: This is a pattern for PR name. {{date}} will be replace by D MM. Default value: `Deployment {{date}}`
- `ticket_management`: If you use ticket management you can pass it here and job will replace feature commits with JIRA issue titles. Possible values: jira
- `jira_username`: If you are using JIRA as your ticket management system you can have add username and password so instead of commits release notes will have issue titles
- `jira_password`: If you are using JIRA as your ticket management system you can have add username and password so instead of commits release notes will have issue titles
- `jira_url`: If you are using JIRA as your ticket management system you can add JIRA url so job will connect and try to check all linked comits. Instead of commits messages it will display JIRA titles
 
### Example workflow

```yaml
name: Test Action

on:
  workflow_dispatch:
  pull_request:
    branches:
      - main

jobs:
  test-correct:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Test action
        uses: szymansd/auto-release-notes@v1.0.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          description_template_filepath: './.github/templates/deployment.md'

```

