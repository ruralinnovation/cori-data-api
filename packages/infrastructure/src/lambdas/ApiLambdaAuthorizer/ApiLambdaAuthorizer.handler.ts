import { EnvConfig } from './EnvConfig';
export const handler = function (event: any, context: any, callback: any) {
  console.log('EVENT ', event);
  console.log('Secret', EnvConfig.API_KEY);
  var token = event.authorizationToken;
  switch (token) {
    case 'allow':
      callback(null, generatePolicy('user', 'Allow', event.methodArn));
      break;
    case 'deny':
      callback(null, generatePolicy('user', 'Deny', event.methodArn));
      break;
    case 'unauthorized':
      callback('Unauthorized'); // Return a 401 Unauthorized response
      break;
    default:
      callback('Error: Invalid token'); // Return a 500 Invalid token response
  }
};

// Help function to generate an IAM policy
var generatePolicy = function (principalId: string, effect: string, resource: string) {
  var authResponse: any = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument: any = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    var statementOne: any = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  // Optional output with custom properties of the String, Number or Boolean type.
  authResponse.context = {
    stringKey: 'stringval',
    numberKey: 123,
    booleanKey: true,
  };
  return authResponse;
};
