import { Construct } from 'constructs';
import { MFNodejsFunction, MFNodejsFunctionProps } from './MFNodejsFunction';
import { HttpMethod } from '../../models/interfaces';
import { CognitoUserPoolsAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { addApiMethod } from './addApiMethod';

export interface VfApiNodejsFunctionProps extends MFNodejsFunctionProps {
  /**
   * Which API to associate with
   */
  api: IRestApi;

  /**
   * Provide an authorizer for non-public APIs
   */
  authorizer?: CognitoUserPoolsAuthorizer;

  /**
   * This simply adds OPTIONS method
   * TODO: Add mock CORS integration (maybe)
   */
  enableCORS?: boolean;

  /**
   * Which paths and methods are used.
   * i.e. [{'/api/users': ['GET', 'PUT', 'DELETE']}]
   */
  paths: { [name: string]: HttpMethod[] };
}

/**
 * Configures lambda for API GW execution ad provides syntax sugar for binding paths.
 */
export class ApiNodejsFunction extends MFNodejsFunction {
  constructor(scope: Construct, id: string, private props: VfApiNodejsFunctionProps) {
    super(scope, id, props);

    this.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'));
    this.node.addDependency(props.api);

    Object.keys(props.paths).forEach(path => {
      const resource = this.props.api.root.resourceForPath(path.startsWith('/') ? path : `/${path}`);

      const methods = props.paths[path];

      if (this.props.enableCORS && !methods.includes('OPTIONS')) {
        // Add mapping for CORS Preflight. Mock integrations dont work with `sam start-api`
        methods.push('OPTIONS');
      }

      methods.forEach(method => {
        addApiMethod(resource, method, this.functionArn, props.authorizer);
      });
    });
  }
}
