# CORI Data API

### Requirements

node >16

npm >8

### Directory Structure

packages
infrastructure
schemas
python-microservices

> This project uses NPM Workspaces to managing multiple packages from your local file system from within a singular top-level, root package.

> For more information please [READ THE DOCS](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

### Resources

[CDK Day 2020 - Building Real-time Back Ends on AWS with AppSync and CDK](https://www.youtube.com/watch?v=--HTK0Y44ew)

[NPM Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

[GraphQL Tools](https://www.graphql-tools.com/)

[AWS CDK V2](https://docs.aws.amazon.com/cdk/api/v2/)

[AppSync CDK V2](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-appsync-alpha-readme.html)

[Github Actions](https://docs.github.com/en/actions)

# CICD Setup

### Github Setup

1. Create a new user in Github for CICD
2. Create a Personal Access Token for this user
3. Store the Personal Access Token in AWS Secrets Manager with the name `github-token`
