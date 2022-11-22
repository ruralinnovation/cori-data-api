This project is best run/tested with the 2021 beta version of the SAM cli (`sam-beta-cdk`). To install this version do:
```
$ wget https://github.com/aws/aws-sam-cli/releases/download/sam-cli-beta-cdk/aws-sam-cli-linux-x86_64.zip
$ unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
$ [sudo] ./sam-beta-installation/install
$ sam-beta-cdk --version
SAM CLI, version 1.29.0.dev202108311500
```

Once installed, run:
```
$ npm install
$ npm run build
$ npm run deploy
$ npm run start:api
```
