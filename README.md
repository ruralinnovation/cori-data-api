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

[Sharing DB Snapshot between Accounts](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html)
[Sharing KMS KEY](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html#USER_ShareSnapshot.Encrypted)

[Amazon RDS PostgreSQL verses Amazon Aurora PostgreSQL](https://aws.amazon.com/blogs/database/is-amazon-rds-for-postgresql-or-amazon-aurora-postgresql-a-better-choice-for-me/)

Downloading the AWS CDK CLI Toolkit for local use.
CDK Bootstrapping
CDK CICD Pipelines

# CICD Setup

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

## Python Lambdas / Microservices

We have 10 different tables in the BCAT Schema

1. bcat_auction_904_subsidy_awards

### bcat_auction_904_subsidy_awards

| Column Name | Data Type |
| geoid | text |
| state_abbr | text |
| name_co | text |
| subsidy_recipient | text |
| tier | text |
| geoms | geometry |
| geoid_co | text |
| valid_raw | text |

### Endpoints

## **Auction 904 Subsidy Awards**

---

### Properties

- **URL**

  `/bcat/auction_904_subsidy_awards/properties`

- **Method:**

  `GET`

- **URL Params**

  **NOT REQUIRED**
  `geoids=[geoid], state_abbrs=[state_abbr]`

- **Returns**

  {
  geoid: string
  state_abbr: string
  name_co: string
  subsidy_recipient: string
  tier: string
  geoid_co: string
  valid_raw: string
  }

### Feature Collection

- **URL**

  `/bcat/auction_904_subsidy_awards/geojson/feature_collection?`

- **Method:**

  `GET`

- **URL Params**

  **NOT REQUIRED**
  `geoids=[geoid]`

- **Returns**

  {
  geoid: string
  state_abbr: string
  name_co: string
  subsidy_recipient: string
  tier: string
  geoid_co: string
  valid_raw: string
  }
