CORI Data API
=============

# Overview

The [`cori-data-api`](https://github.com/ruralinnovation/cori-data-api/) repository (as distinct from the `cori.data.api` package) houses all the code to:

1. Create a RestApi with Python Lambdas connecting to a PostgreSQL Database.
2. Create a GraphQL Api with Typescript Lambdas connecting to the Python RestAPI (as a DataSource).
3. Create a CICD Pipeline that connects to this Github repository, is triggered on commits/PRs to specific branches, and re-builds and re-deploys the two updated APIs.

# Architecture

![image](https://user-images.githubusercontent.com/47429329/179373858-d5ec71ac-03b3-40c6-b39c-591f795675d4.png)

![image](https://user-images.githubusercontent.com/47429329/179630808-6a129b60-440c-44ea-8b60-f69470f56db1.png)

![image](https://user-images.githubusercontent.com/47429329/179631056-13152301-0818-4357-a6a9-a49dc0786137.png)

# External Dependencies

This project has two external dependencies:

1. PostgreSQL database (Amazon RDS)
2. Redis Cache (Hosted on Redis Cloud)

> You can safely customize and update these services in their respective interfaces.  All other updates to this project should be handled IN CODE and deployed through the CICD Pipeline by committing to a specific branch.

# Environment Setup

## Requirements

- NodeJS 16.x+ - [Installing NodeJS](https://nodejs.org/en/download/)
- npm 8.x+ - (needed for NPM Workspaces) - (should be installed as part of NodeJS installation)
- AWS CLI - [Installing AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS SAM CLI [Installing SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- AWS CDK V2 - [Installing AWS CDK V2](https://docs.aws.amazon.com/cdk/api/v2/)
- Python 3.9+ - [Installing Python](https://www.python.org/downloads/)

### NodeJS 16.x+ and NPM 8.x+

> This project uses NPM Workspaces to managing multiple packages from your local file system from within a singular top-level, root package. NPM workspaces requires NPM version 8+. This should be installed as part of the installation of NodeJS 16.x+

[Installing NodeJS](https://nodejs.org/en/download/)

### AWS CLI

The AWS Command Line Interface (AWS CLI) is an open source tool that enables you to interact with AWS services using commands in your command-line shell. With minimal configuration, the AWS CLI enables you to start running commands that implement functionality equivalent to that provided by the browser-based AWS Management Console from the command prompt in your terminal program:

[Installing AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

### AWS SAM CLI

AWS SAM provides you with a command line tool, the AWS SAM CLI, that makes it easy for you to create and manage serverless applications. You need to install and configure a few things in order to use the AWS SAM CLI.

[Installing SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

### AWS CDK V2

The AWS CDK lets you build reliable, scalable, cost-effective applications in the cloud with the considerable expressive power of a programming language. This approach yields many benefits, including:

- Build with high-level constructs that automatically provide sensible, secure defaults for your AWS resources, defining more infrastructure with less code.

- Use programming idioms like parameters, conditionals, loops, composition, and inheritance to model your system design from building blocks provided by AWS and others.

- Put your infrastructure, application code, and configuration all in one place, ensuring that at every milestone you have a complete, cloud-deployable system.

- Employ software engineering practices such as code reviews, unit tests, and source control to make your infrastructure more robust.

- Connect your AWS resources together (even across stacks) and grant permissions using simple, intent-oriented APIs.

- Import existing AWS CloudFormation templates to give your resources a CDK API.

- Use the power of AWS CloudFormation to perform infrastructure deployments predictably and repeatedly, with rollback on error.

- Easily share infrastructure design patterns among teams within your organization or even with the public.

[Installing AWS CDK V2](https://docs.aws.amazon.com/cdk/api/v2/)

### Python 3.9+

[Installing Python](https://www.python.org/downloads/)

### Additional Suggested Environment Setup

- A Node Version Manager [Installing NVM](https://github.com/nvm-sh/nvm) or [Installing n](https://github.com/tj/n)

## Installation and Development

### Getting started

1. Clone the repo

   `git clone https://github.com/ruralinnovation/cori-data-api.git`

2. Change into project directory

   `cd cori-data-api`

3. Install libraries for all packages

   `npm install`

4. Set local environment (shell) varibles:
```bash
    $ export INTEGRATION_TESTING_USERNAME=<aws-cognito-username>
    $ export INTEGRATION_TESTING_PASSWORD=<aws-cognito-pasword>
```

At this point, you should be able to build the api and run the test suite:

    $ npm run build
    $ npm run test


## Working with NPM Workspaces

> We suggest reading through the NPM Workspaces documentation before attempting to install any new packages or work with this repository.

[NPM Workspaces Documentation](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

Workspaces allows you to organize your code in a mono-repo with multiple packages (projects). There is a shared dependency tree to reduce build time and redundant packages.

# Project Structure

### Directory Structure

#### Overview

- `.github` - Configuration for Github Actions
- `.vscode` - VSCode Configuration for local debugging
- `docs` - Documentation resources
- `postgresql` - supportive database scripts and documentation
- `packages/infrastructure` - Typescript/NodeJS Infrastructure (CDK) code
- `packages/graphql-schemas` - Typescript/NodeJS GraphQL (Lambda) Code
- `packages/python-lambdas` - Python Lambdas, Business Logic and Code

infrastructure

graphql-schemas

python-lambdas

> This project uses NPM Workspaces to managing multiple packages from your local file system from within a singular top-level, root package.

> For more information please [READ THE DOCS](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

# Database Integration

The main data source for the APIs is a PostgreSQL RDS hosted in AWS. The Python RestAPI is the only integration point to the database. All endpoints provisioned in the Python RestAPI are served by Python lambdas that house the database queries, and transformations.

The Python lambdas are located in the same VPC as the PostgreSQL RDS database. These lambdas have no connection to the public internet to protect the database. In addition, the RestAPI is a READ_ONLY API, which allows us to create a READ_ONLY database user/role for the lambdas to use for database access, which limits security risks.

## Prerequisites

### User/Role Setup

#### Create a READ_ONLY user

1. Log in to database as admin with psql
2. Create read only role and new user with:

```sql
CREATE ROLE read_only_access;

GRANT CONNECT ON DATABASE (DB_NAME} TO read_only_access;

GRANT USAGE ON SCHEMA public TO read_only_access;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_access;

GRANT SELECT ON ALL TABLES IN SCHEMA bcat TO read_only_access;

CREATE USER read_only_user WITH PASSWORD  ________________;

GRANT read_only_access TO read_only_user;
```

3. Keep note of password for next step

#### Save database credentials in AWS Parameter Store

1. Log into AWS Console
2. Go to Systems Manager/Parameter Store
3. Save the database password in a parameter with a prefix e.g. `/cori/api/password`
4. Keep note of the parameter name

<img width="1432" alt="image" src="https://user-images.githubusercontent.com/47429329/178010306-ab430097-ad80-4769-92fe-6d8d835e3116.png">

<img width="1431" alt="image" src="https://user-images.githubusercontent.com/47429329/178010527-e8cdc728-e8d2-4666-9fe4-d1ec982277f7.png">

## Update Api Configuration File

The `ApiStackProps` has an `databaseConfig` attribute with the following schema:

```Typescript

interface DatabaseConfig {
  vpcId: string;
  databaseSecurityGroupId: string;
  host: string;
  dbname: string;
  dbuser: string;
  parameterName: string;
}

```

Open the main configuration file for your environment in `config/config.ts`. Update the attributes values with your database information.

The `dbuser` attribute value should be `read_only_user` if that is how you configured the previous section.

The `paramaterName` attribute value should be the name of the password parameter you stores in AWS Parameter Store in the previous step. (e.g. `/cori/api/password`)

# Redis Cache Integration

todo

## Prerequisites

### User/Role Setup

todo

## Update Api Configuration

todo

# Local Development and Testing

You can test your python business logic with the local development server. In order to bypass the use of the Lambda Layers (which don't play nice with local servers), there is a lambda dedicated to local testing located in the `python-lambdas/local` directory.

The `index.py` file houses the lambda handler that is triggered by all local api queries. You can copy your business logic into this lambda to test out functionality. All queries should be prefixed with `/local`:

The local server url is `http://localhost:2000/local/`

## Starting the Local Server

```bash

npm run start

```

# CICD Pipeline

The CICD pipeline has been deployed in your AWS Account and re-builds/re-deploys will be triggered by PRs to the `dev` and `main` branches in your github repository.

[CDK Pipelines](https://aws.amazon.com/blogs/developer/cdk-pipelines-continuous-delivery-for-aws-cdk-applications/)
[CDK Pipelines Workshops](https://cdkworkshop.com/50-java/70-advanced-topics/100-pipelines.html)

## CICD Setup

### Github Setup

1. Create a new user in Github for CICD
2. Create a Personal Access Token for this user
3. Store the Personal Access Token in AWS Secrets Manager with the name `github-token`

## Pipeline Infrastructure

The Pipeline is configured using CDK Pipeline construct.

> CDK Pipelines is an opinionated construct library. It is purpose-built to deploy one or more copies of your CDK applications using CloudFormation with a minimal amount of effort on your part. It is not intended to support arbitrary deployment pipelines, and very specifically it is not built to use CodeDeploy to applications to instances, or deploy your custom-built ECR images to an ECS cluster directly: use CDK file assets with CloudFormation Init for instances, or CDK container assets for ECS clusters instead.

[CDK Pipelines Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html)

### Pipeline code

The Pipeline code is located in the `packages/infrastructure/src/stacks/PipelineStack.ts` file.

In order to be deployed this stack requires configuration parameters for connecting to Github as well as deploying the ApiStack.

```Typescript

interface PipelineStackProps {
  /**
   * GitHub source configuration
   */
  source: {
    /**
     * Case-sensitive GitHub repo name
     *  i.e. mergingfutures/cori-data-api
     */
    repo: string;
    /**
     * Which branch to listen on
     * When changes are committed, the pipeline will trigger
     */
    branch: string;

    /**
     * Personal access token for authentication
     *  i.e. cdk.SecretValue.secretsManager('mergingfutures-pat')
     */
    authentication: SecretValue;

    /**
     * How to trigger the pipeline.
     *  Must have admin access on repo to use WEBHOOK.
     *  Only read access is required for POLL
     */
    trigger?: GitHubTrigger;
  };

  /**
   * Use this to re-use an existing S3 bucket.
   */
  artifactBucketName?: string;

  /**
   * Configures the api to be deployed by the pipeline
   */
  ApiConfig: ApiStackProps;

  /**
   * Credentials for Integration Testing
   */
  integrationConfig: {
    userName: string;
    password: string;
  };
}

```

### Pipeline deployment

Each pipeline is associated with a branch and an environment.

> We have setup a DEV and PROD Pipeline for you, but you can have other pipelines connected to other branches as well.

1. Check out the associated branch.
2. Ensure the branch code is pushed to the remote repo
3. Create a entry for the branch in `config/configs`

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

# Python Microservices

The Python Microservices are located in the `python-lambdas` directory.

## Directory Structure

```text

├── dependency-layer                        # Shared dependency/libraries layer
├── bcat                                    # BCAT Service
├── local                                   # Local Development service
└── scaffolding                             # Scaffolding for new service (See Creating New Service Section)

```

## Python Dependency Layer

Lambda layers provide a convenient way to package libraries and other dependencies that you can use with your Lambda functions. Using layers reduces the size of uploaded deployment archives and makes it faster to deploy your code.

A layer is a .zip file archive that can contain additional code or data. A layer can contain libraries, a custom runtime, data, or configuration files. Layers promote code sharing and separation of responsibilities so that you can iterate faster on writing business logic.

You can use layers only with Lambda functions deployed as a .zip file archive. For functions defined as a container image, you package your preferred runtime and all code dependencies when you create the container image. For more information, see Working with Lambda layers and extensions in container images on the AWS Compute Blog.

You can create layers using the Lambda console, the Lambda API, AWS CloudFormation, or the AWS Serverless Application Model (AWS SAM). For more information about creating layers with AWS SAM, see Working with layers in the AWS Serverless Application Model Developer Guide.

[Creating and sharing Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)

It is import that you only include packages in your layer that a majority of the lambdas will use, as redundant libraries will increase container start time and reduce performance.

> You are not limited to using a single layer in a lambda and can include up to 5 layers for each individual lambda. As the API grows you may find creating an assortment of dependency layers specific to certain typological functions is necessary. The total unzipped size of the function and all layers cannot exceed the unzipped deployment package size quota of 250 MB.

The dependencies for the Python Microservices are packaged and zipped in the `packages/python-lambdas/dependency-layer` directory.

This zipped filed is then deployed as a lambda layer dependency for all python lambdas. This will cut down on container start time by sharing these resources across many lambdas.

### Included Packages

1. psycopg = "^3.0.14"
2. psycopg-binary = "^3.0.14"
3. aws-lambda-powertools = "^1.26.0"

#### Psycopg & Psycopg-Binary

Psycopg is the most popular PostgreSQL adapter for the Python programming language. Its core is a complete implementation of the Python DB API 2.0 specifications. Several extensions allow access to many of the features offered by PostgreSQL.

[Documentation](https://www.psycopg.org/)

#### AWS Python Lambda Powertools

We leverage AWS Lambda Powertools library, which is a suite of utilities for AWS Lambda functions to ease adopting best practices such as tracing, structured logging, custom metrics, idempotency, batching, and more.

Check out this [detailed blog post](https://aws.amazon.com/blogs/opensource/simplifying-serverless-best-practices-with-lambda-powertools/) with a practical example.

In our experience it has a developer friendly (Flask-like) Api. It makes it very easy to configure routing/endpoints in each Python Microservice.

For more information [READ THE DOCS](https://awslabs.github.io/aws-lambda-powertools-python/latest/)

### Adding New Dependencies to the Layer

```bash
# Change into the Python Microservices directory
cd packages/python-lambdas

# Activate the Python environment
source .env/bin/activate

# Add new packages
pip install package1, package2

# Copy Packages directory into the Dist directory
cp -r ./.env/lib/python3.8/site-packages ./dist/python

# Zip up the dist directory packages
...
```

## Creating New Services

1. Copy/paste scaffolding directory
2. Rename service directory and the name in the `pyproject.toml` file
3. Update `index.py` with custom endpoints and logic.
4. [OPTIONAL]: Update `___.robot` testing files with testing logic.
5. [OPTIONAL]: Add new integration tests in `./packages/infrastructure/spec/integration-test.spec.ts`.
6. Create a new ApiEndpoint in the ApiStack with the new service as handler for the endpoints. (see Creating a new Api Endpoint)
7. Push changes to current branch to re-deploy with pipeline.
8. Check Integration Tests Step in `CodePipeline` interface.
9. [OPTIONAL]: Once the new endpoints are deployed you can add new integration tests and run them locally.  You cannot use the integration tests on new endpoints until they are available.

# Api Stack & Supporting Constructs

The Core ApiStack is composed of:

1. Networking Construct
2. Authentication (Construct) Construct
3. Python Data Server Construct
4. Apollo (GraphQL) Server Construct
5. Hosting (CloudFront) Construct

Constructs are located in the `packages/infrastructure/src/constructs`

## Core ApiStack

The Root Stack for the entire API project is the `ApiStack`.

This stack is located at: `packages/infrastructure/src/stacks/ApiStack.ts`

Familiarize yourself with the `ApiStackProps` specified at the top of the file. These props are all the required and optional parameters that drive the configuration and deployment of the two APis and supporting lambdas, the networking, the hosting and the authentication.

```Typescript

export interface DatabaseConfig {
  vpcId: string;
  databaseSecurityGroupId: string;
  host: string;
  dbname: string;
  dbuser: string;
  parameterName: string;
}
export interface CacheConfig {
  host: string;
  port: number;
  username: string;
  parameterName: string;
  globalTTL: string;
}

interface AppSyncUserPoolConfig {
  userPoolId: string;
}

export interface ServiceConfig {
  /**
   * The Logical Name of the service (NO SPACES) e.g. BCATService
   */
  logicalName: string;
  /**
   * The Core path to trigger the Microservice e.g. /bcat
   */
  corePath: string;
  /**
   * The name of the directory this service is located.  e.g. bcat
   */
  directoryName: string;
}

interface AppSyncConfig {
  /**
   * Optional: When provided will configure additional user pools in the app sync authorization configuration
   */
  additionalUserPools: AppSyncUserPoolConfig[];
}

export interface ApiStackProps extends StackProps {
  env: {
    account: string;
    region: string;
  };
  client: string;
  stage: string;
  project: string;

  loggingLevel: string;

  /**
   * Retain Dynamo Table and UserPool on delete
   */
  retain: boolean;

  /**
   * Database integration configuration
   * Puts lambdas in VPC. Expecting VPC to be in another stack or deployed already.
   * DB creds are accessed through parameter store and deployed as part of the lambda service environment.
   *
   */
  databaseConfig: DatabaseConfig;

  /**
   *
   */
  cacheEnabled: boolean;
  cacheConfig: CacheConfig;

  /**
   * Optional. When provided, will attach to existing Cognito for authentication.
   */
  existingCognito?: ExistingCognitoConfig;

  microservicesConfig: ServiceConfig[];
}

```

## Custom Constructs

### Networking Construct

The **Networking Construct** is responsible for creating a new `Security Group` for all of the Python Lambdas, and enabling communication between this new Lambda Security Group and the existing Database Security Group. This construct accepts the `DatabaseConfig` in order to instantiate the required resources.

> All Python Lambdas are placed within your existing VPC and have no connection to the public internet.  
> The only INGRESS communication allowed to these lambdas are from **Api Gateway** on Core AWS Network.  
> The only EGRESS communication allowed from these lambdas is to the PostgreSQL Database and this is opened from the link between the two security groups.  
> This eliminates any security risks from the public internet.

#### AWS CDK V2 Constructs Used

1. [VPC Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html)
2. [Security Group Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SecurityGroup.html)

#### More Information

1. [Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
2. [Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)

### Authentication (Cognito) Construct

The **Authentication (Cognito) Construct** is responsible for one of two things:

1. If you have an existing Cognito UserPool you want to use as a directory for controlling access to the APIs, this construct imports a reference to that UserPool and adds a new Postman client for development testing.

   **OR**

2. If you don't have an existing UserPool, this construct creates a new UserPool, adds a new Authentication domain, and then adds the Postman client for development testing.

> This construct is then passed into the ApiGateways in both servers (PythonDataServer & ApolloServer) for attaching CognitoAuthorizers as access controls.

#### AWS CDK V2 Constructs Used

1. [UserPool Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPool.html)
2. [CfnUserPoolDomain Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.CfnUserPoolDomain.html)
3. [UserPoolClient Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolClient.html)

#### More Information

1. [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
2. [User Pool Domains](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain.html)
3. [User Pool App Clients](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)

### Python Data Server Construct

The **Python Data Server Construct** is responsible for:

1. Create the `ApiGateway` for your Python Microservices.
2. Deploy the Dependency Layer
3. Deploy new Python Microservices.
4. Create Endpoints on the `ApiGateway` to trigger new Microservices.

#### Custom CDK V2 Constructs Used

1. [ApiGw Construct](https://github.com/mergingfutures/cori-data-api/blob/dev/packages/infrastructure/src/constructs/api/ApiGw.ts)

Creates Api Gateway with Cognito Authorization.  Has supporting methods for adding new endpoints with lambda triggers.

2. [Python Lambda Construct](https://github.com/mergingfutures/cori-data-api/blob/dev/packages/infrastructure/src/constructs/lambda/PythonLambda.ts)

Create a new Python Lambda (microservice) with an associated Log Group

> [IMPORTANT]:  Keep in mind that you create logic for your microservices in the `python-lambdas/` directory.  The Python Lambda Construct builds/packages the code from your service directory and deploys it to AWS Lambda.

#### AWS CDK V2 Constructs Used

1. [RestApi](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html)
2. [CognitoUserPoolsAuthorizer](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.CognitoUserPoolsAuthorizer.html).
3. [PythonFunction](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-lambda-python-alpha.PythonFunction.html).
4. [LogGroup](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.LogGroup.html).

#### More Information


1. [Working With Rest Apis](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
2. [Control access to a REST API using Amazon Cognito user pools as authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)
3. [Building lambda functions with python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
4. [What is Amazon CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)

### Apollo (GraphQL) Server Construct

The Apollo GraphQL Server Construct is responsible for:

1. Create the `ApiGateway` for your GraphQL Server.
3. Deploy a single NodeJS Lambda function to respond to GraphQL requests.
4. Create Endpoint on the `ApiGateway` to trigger lambda.

#### Custom CDK V2 Constructs Used

1. [ApiGw Construct](https://github.com/mergingfutures/cori-data-api/blob/dev/packages/infrastructure/src/constructs/api/ApiGw.ts)

Creates Api Gateway with Cognito Authorization.  Has supporting methods for adding new endpoints with lambda triggers.

#### AWS CDK V2 Constructs Used

1. [RestApi](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html)
2. [CognitoUserPoolsAuthorizer](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.CognitoUserPoolsAuthorizer.html).
3. [NodejsFunction](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html).
4. [LogGroup](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.LogGroup.html).

#### More Information

1. [Working With Rest Apis](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
2. [Control access to a REST API using Amazon Cognito user pools as authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)
3. [Building lambda functions with Typescript](https://docs.aws.amazon.com/lambda/latest/dg/lambda-typescript.html)
4. [Building lambda functions with Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
4. [What is Amazon CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)

### Hosting (CloudFront) Construct

The `Hosting Construct` is responsible for:

1. Create a Cloudfront Distribution.
2. Create origin on `/` path for Python RestApi
3. Create origin on `/graphql` path for Apollo Server.
4. Create bucket for access logs.

#### AWS CDK V2 Constructs Used

1. [CloudFrontWebDistribution](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.CloudFrontWebDistribution.html)
2. [Bucket](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html)

#### More Information

1. [What is Amazon Cloudfront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
2. [Overview of distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-overview.html)
3. [Working with distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-working-with.html)
4. [Using various origins with CloudFront distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistS3AndCustomOrigins.html)
5. [CloudFront logging](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/logging.html)


### Resources

[CDK Day 2020 - Building Real-time Back Ends on AWS with AppSync and CDK](https://www.youtube.com/watch?v=--HTK0Y44ew)

[NPM Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

[GraphQL Tools](https://www.graphql-tools.com/)

[AWS CDK V2](https://docs.aws.amazon.com/cdk/api/v2/)

[Github Actions](https://docs.github.com/en/actions)

[Sharing DB Snapshot between Accounts](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html)
[Sharing KMS KEY](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html#USER_ShareSnapshot.Encrypted)

[Amazon RDS PostgreSQL verses Amazon Aurora PostgreSQL](https://aws.amazon.com/blogs/database/is-amazon-rds-for-postgresql-or-amazon-aurora-postgresql-a-better-choice-for-me/)

[Typescript / ESLint](https://typescript-eslint.io/)

[Typescript](https://www.typescriptlang.org/)
