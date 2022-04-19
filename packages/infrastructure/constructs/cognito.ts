import { Construct } from "constructs";
import { Fn, CfnCondition, CfnOutput, RemovalPolicy, Token } from "aws-cdk-lib";

import {
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  IUserPool,
  CfnUserPoolUser,
  CfnUserPoolUserToGroupAttachment,
  CfnUserPoolGroup,
  CfnUserPoolDomain,
  OAuthScope,
  CfnUserPool,
} from "aws-cdk-lib/aws-cognito";

export interface CognitoConstructProps {
  prefix: string;
  userPoolName: string;

  /**
   * What to name the user pool domain (if created)
   */
  userPoolDomainName: string;
  adminUserEmail?: string;

  appUrl: string;
  callbackUrls: string[];
  logoutUrls: string[];

  /**
   * Retain User Pool on delete
   */
  retain: boolean;

  /**
   * Optional. When provided, will attach to existing user pool
   */
  userPoolId?: string;

  /**
   * Optional. When provided, will re-use existing user pool domain
   */
  existingUserPoolDomain?: string;
}

export class Cognito extends Construct {
  userPool: IUserPool;
  userPoolClient: UserPoolClient;
  userPoolDomain: string;

  constructor(
    scope: Construct,
    id: string,
    private props: CognitoConstructProps
  ) {
    super(scope, id);

    if (props.userPoolId) {
      this.userPool = UserPool.fromUserPoolId(
        this,
        "UserPool",
        props.userPoolId
      );
    } else {
      this.userPool = new UserPool(this, "UserPool", {
        userPoolName: this.props.userPoolName,
        userInvitation: {
          emailSubject: "Your CORI API temporary password",
          emailBody: `Your username is {username} and temporary password is {####}. The CORI API address is: ${this.props.appUrl}`,
          smsMessage:
            "Your username is {username} and temporary password is {####}.",
        },
        autoVerify: {
          email: true,
        },
        selfSignUpEnabled: false,
        removalPolicy: this.props.retain
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      });
      // Override logical name for backwards compatibility
      (this.userPool.node.defaultChild as CfnUserPool).overrideLogicalId(
        "CognitoUserPool"
      );
    }

    if (props.existingUserPoolDomain) {
      this.userPoolDomain = props.existingUserPoolDomain;
    } else {
      const domain = new CfnUserPoolDomain(this, "CognitoDomain", {
        userPoolId: this.userPool.userPoolId,
        domain: this.props.userPoolDomainName,
      });
      domain.overrideLogicalId("CognitoDomain");

      this.userPoolDomain = domain.domain;
    }

    const adminGroup = new CfnUserPoolGroup(this, "AdminGroup", {
      groupName: "admin",
      description: "Administrator Group",
      precedence: 0,
      userPoolId: this.userPool.userPoolId,
    });
    adminGroup.overrideLogicalId("AdminUserPoolGroup");

    if (this.props.adminUserEmail) {
      const adminUser = new CfnUserPoolUser(this, "AdminUser", {
        userPoolId: this.userPool.userPoolId,
        username: this.props.adminUserEmail,
        desiredDeliveryMediums: ["EMAIL"],
        userAttributes: [
          { name: "email", value: this.props.adminUserEmail },
          { name: "email_verified", value: "true" },
        ],
      });
      adminUser.overrideLogicalId("CognitoAdminUser");

      const groupAttachment = new CfnUserPoolUserToGroupAttachment(
        this,
        "AdminGroupAttachment",
        {
          userPoolId: this.userPool.userPoolId,
          groupName: adminGroup.groupName as string,
          username: adminUser.username as string,
        }
      );
      groupAttachment.overrideLogicalId("AdminGroupAttachment");
      groupAttachment.addDependsOn(adminGroup);
      groupAttachment.addDependsOn(adminUser);

      if (Token.isUnresolved(this.props.adminUserEmail)) {
        // Admin User is a CloudFormation Token, Add Condition
        const createAdminUserCondition = new CfnCondition(
          this,
          "CreateAdminUserCondition",
          {
            expression: Fn.conditionNot(
              Fn.conditionEquals(this.props.adminUserEmail, "")
            ),
          }
        );
        adminUser.cfnOptions.condition = createAdminUserCondition;
        groupAttachment.cfnOptions.condition = createAdminUserCondition;
      }
    }

    this.userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPoolClientName: this.props.prefix,
      userPool: this.userPool,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      generateSecret: false,
      oAuth: {
        flows: {
          implicitCodeGrant: true,
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: this.props.callbackUrls,
        logoutUrls: this.props.logoutUrls,
      },
    });

    new CfnOutput(this, "DomainOutput", {
      value: this.userPoolDomain,
    });
    new CfnOutput(this, "UserPoolOutput", {
      value: this.userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolClientOutput", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
