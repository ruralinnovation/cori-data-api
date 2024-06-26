import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

import {
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  IUserPool,
  CfnUserPoolDomain,
  OAuthScope,
  CfnUserPool,
} from 'aws-cdk-lib/aws-cognito';

export interface ExistingCognitoConfig {
  userPoolId: string;
  userPoolDomain: string;
}

export interface CognitoConstructProps {
  prefix: string;

  /**
   * What to name the user pool domain (if created)
   */
  userPoolDomainName: string;

  /**
   * Retain User Pool on delete
   */
  retain: boolean;

  /**
   * Optional. When provided, will attach to existing Cognito for authentication.
   */
  existingCognito?: ExistingCognitoConfig;
}

export class Cognito extends Construct {
  userPool: IUserPool;
  userPoolDomain: string;
  prefix: string;
  postmanClient: UserPoolClient;

  constructor(scope: Construct, id: string, private props: CognitoConstructProps) {
    super(scope, id);
    this.prefix = props.prefix;
    if (props.existingCognito?.userPoolId) {
      this.userPool = UserPool.fromUserPoolId(this, 'UserPool', props.existingCognito.userPoolId);
    } else {
      this.userPool = new UserPool(this, 'UserPool', {
        userPoolName: this.props.prefix,
        userInvitation: {
          emailSubject: 'Your CORI Data API temporary password',
          emailBody: `Your username is {username} and temporary password is {####}.`,
          smsMessage: 'Your username is {username} and temporary password is {####}.',
        },
        autoVerify: {
          email: true,
        },
        selfSignUpEnabled: false,
        removalPolicy: this.props.retain ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      });
      // Override logical name for backwards compatibility
      (this.userPool.node.defaultChild as CfnUserPool).overrideLogicalId('CognitoUserPool');
    }

    if (props.existingCognito?.userPoolDomain) {
      this.userPoolDomain = props.existingCognito.userPoolDomain;
    } else {
      const domain = new CfnUserPoolDomain(this, 'CognitoDomain', {
        userPoolId: this.userPool.userPoolId,
        domain: this.props.userPoolDomainName,
      });
      domain.overrideLogicalId('CognitoDomain');

      this.userPoolDomain = domain.domain;
    }

    this.postmanClient = this.addClient(
      'PostmanUserPoolClient',
      ['https://www.getpostman.com/oauth2/callback'],
      ['https://www.getpostman.com/oauth2/callback']
    );
  }

  /**
   * Creates a cognito user pool client
   * @param name prefix will be added automatically
   * @param callbackUrls
   * @param logoutUrls
   */
  private addClient(id: string, callbackUrls: string[], logoutUrls: string[]) {
    return new UserPoolClient(this, id, {
      userPoolClientName: `${this.props.prefix}-${id}`,
      userPool: this.userPool,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      generateSecret: false,
      oAuth: {
        flows: {
          implicitCodeGrant: true,
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: callbackUrls,
        logoutUrls: logoutUrls,
      },
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });
  }
}
