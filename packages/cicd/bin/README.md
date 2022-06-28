# CI/CD


## Bootstrapping

In the main pipeline account `npx cdk bootstrap --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess" aws://{ACCOUNT-NUMBER}/{REGION} --profile {PROFILE}`

(use a different policy if you need to limit access)

### Cross-Account Deploys

In any other accounts `npm run bootstrap:pipeline -- aws://{ACCOUNT-NUMBER}/{REGION} --trust {PIPELINE-ACCOUNT-NUMBER} [--profile {PROFILE}]`

## Deployment

You should deploy a pipeline for every branch you intend to create an environment for.

1. Create a environment config in `config/configs.ts`
    - Each key in the `Configs` object should match a deployment branch
2. Commit and push your changes
3. Deploy using `cd packages/cicd && npm run deploy -- [--profile {PROFILE}]`

Once deployed, the pipeline will automatically trigger on new commits.