# CORI Data API

### Requirements

- NodeJS 16.x+ - [Installing NodeJS](https://nodejs.org/en/download/)
- npm 8.x+ - (needed for NPM Workspaces) - (should be installed as part of NodeJS installation)
- AWS CLI - [Installing AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS SAM CLI [Installing SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- AWS CDK V2 - [Installing AWS CDK V2](https://docs.aws.amazon.com/cdk/api/v2/)
- Python 3.6+ - [Installing Python](https://www.python.org/downloads/)

### Additional Suggested Environment Setup

- A Node Version Manager [Installing NVM](https://github.com/nvm-sh/nvm) or [Installing n](https://github.com/tj/n)

### Directory Structure

#### Overview

- `.github` - Configuration for Github Actions
- `.vscode` - VSCode Configuration for local debugging
- `docs` - Documentation resources
- `postgresql` - supportive database scripts and documentation
- `packages/*` - Typescript/NodeJS Infrastructure and Code
- `python-microservices` - Python Lambdas, Business Logic and Code

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

[Github Actions](https://docs.github.com/en/actions)

[Sharing DB Snapshot between Accounts](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html)
[Sharing KMS KEY](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html#USER_ShareSnapshot.Encrypted)

[Amazon RDS PostgreSQL verses Amazon Aurora PostgreSQL](https://aws.amazon.com/blogs/database/is-amazon-rds-for-postgresql-or-amazon-aurora-postgresql-a-better-choice-for-me/)

Downloading the AWS CDK CLI Toolkit for local use.
CDK Bootstrapping
CDK CICD Pipelines

## CICD Setup

### Github Setup

1. Create a new user in Github for CICD
2. Create a Personal Access Token for this user
3. Store the Personal Access Token in AWS Secrets Manager with the name `github-token`

### DB Setup

#### Create a READ_ONLY user

1. Log in as admin with psql;
2. Create read only role and new user with:

   ```SQL
   CREATE ROLE read_only_access;

   GRANT CONNECT ON DATABASE (DB_NAME} TO read_only_access;

   GRANT USAGE ON SCHEMA public TO read_only_access;

   GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_access;

   GRANT SELECT ON ALL TABLES IN SCHEMA bcat TO read_only_access;

   CREATE USER read_only_user WITH PASSWORD  ________________;

   GRANT read_only_access TO read_only_user;
   ```

3. Save password in AWS Parameter store (keep note of parameter name)

### Pipeline deployment

#### Bootstrapping

1. In the main pipeline account

   ```bash
   npm run bootstrap:pipeline -- aws://{ACCOUNT-NUMBER}/{REGION} [--profile {PROFILE}]
   ```

2. In any other accounts (if using cross-account deploy)

   ```bash
   npm run bootstrap:pipeline -- aws://{ACCOUNT-NUMBER}/{REGION} --trust {PIPELINE-ACCOUNT-NUMBER} [--profile {PROFILE}]
   ```

#### Deploy the Pipeline

Each pipeline is associated with a branch and an environment.

1. Check out the associated branch.
2. Create a entry for the branch in `config/configs`
3. Deploy the pipeline

   ```bash
   cd packages/infrastructure
   npm run deploy:pipeline -- [--profile {PROFILE}]
   ```

Once deployed, the pipeline will trigger on new commits to the associated branch.

## Python Lambdas / Microservices

### AWS Lambda Powertools Python Library

We leverage AWS Lambda Powertools library which is a suite of utilities for AWS Lambda functions to ease adopting best practices such as tracing, structured logging, custom metrics, idempotency, batching, and more.

For more infomration [READ THE DOCS](https://awslabs.github.io/aws-lambda-powertools-python/latest/)

### Dependency Layer

The dependencies for the Python Microservices are packaged and zipped in the `python-microservices/dependency-layer` directory.

This zipped filed is then deployed as a labda layer dependency for all python lambdas. This will cut down on container start time by sharing these resources across many lambdas.

#### Adding New Dependencies to the Layer

```bash
# Change into the Python Microservices directory
cd python-microservices

# Activate the Python environment
source .env/bin/activate

# Add new packages
pip install package1, package2

# Copy Packages directory into the Dist directory
cp -r ./.env/lib/python3.8/site-packages ./dist/python

# Zip up the dist directory packages


```

### BCAT Service

There are 10 different tables in the BCAT Schema. Because we need GeoJSON and MVT from each table, we decided it was best to create a single BCAT Service that can dynamically query different tables based on URL params.
This reduces code redundancies. The BCAT Service Lambda is in the `python-microservices/bcat` directory. This service has supporting methods that parse incoming requests, and leverage a BCAT Database Configuration service to determine PostGIS query process.
