export interface IAuthEvent {
  type: string;
  methodArn: string;
  resource: string;
  path: string;
  httpMethod: string;
  headers: Headers;
  queryStringParameters: QueryStringParameters;
  pathParameters: PathParameters;
  stageVariables: StageVariables;
  requestContext: RequestContext;
}

interface RequestContext {
  path: string;
  accountId: string;
  resourceId: string;
  stage: string;
  requestId: string;
  identity: Identity;
  resourcePath: string;
  httpMethod: string;
  apiId: string;
}

interface Identity {
  apiKey: string;
  sourceIp: string;
  clientCert: ClientCert;
}

interface ClientCert {
  clientCertPem: string;
  subjectDN: string;
  issuerDN: string;
  serialNumber: string;
  validity: Validity;
}

interface Validity {
  notBefore: string;
  notAfter: string;
}

interface StageVariables {
  StageVar1: string;
}

interface PathParameters {}

interface QueryStringParameters {
  QueryString1: string;
}

interface Headers {
  'X-AMZ-Date': string;
  'Accept': string;
  'HeaderAuth1': string;
  'CloudFront-Viewer-Country': string;
  'CloudFront-Forwarded-Proto': string;
  'CloudFront-Is-Tablet-Viewer': string;
  'CloudFront-Is-Mobile-Viewer': string;
  'User-Agent': string;
}
