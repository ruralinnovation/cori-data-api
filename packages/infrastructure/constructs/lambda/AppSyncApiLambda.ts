import { Construct } from 'constructs';
import { AwsIntegration, CognitoUserPoolsAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ApiLambda, ApiLambdaProps } from './ApiLambda';
import { Api } from '../api';
import {
  GraphqlApi,
  Schema,
  FieldLogLevel,
  AuthorizationType,
  MappingTemplate,
  HttpDataSource,
} from '@aws-cdk/aws-appsync-alpha';

type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS';

interface ApiPathResolverConfig {
  path: string;
  methods: HttpMethod[];
  typeName: string;
  fieldName: string;
  body?: any;
}

export interface AppSyncApiLambdaProps extends ApiLambdaProps {
  apiOriginPath: string;
  httpSource: HttpDataSource;
}

/**
 * Configures lambda for API GW execution ad provides syntax sugar for binding paths.
 */
export class AppSyncApiLambda extends ApiLambda {
  paramsRegex = new RegExp(/({(.*?)})/g);
  apiOriginPath: string;
  httpSource: HttpDataSource;
  constructor(scope: Construct, id: string, protected props: AppSyncApiLambdaProps) {
    super(scope, id, props);
    this.apiOriginPath = props.apiOriginPath;
    this.httpSource = props.httpSource;
  }

  createResourcePath(path: string): string {
    let p = `/prod${path}`;
    // @ts-ignore
    const matches = path.matchAll(this.paramsRegex);
    if (matches) {
      [...matches].forEach(match => {
        const replacer = `$context.arguments.${match[2]}`;
        p = p.replace(match[1], replacer);
      });
      return p;
    }
    return p;
  }

  private attachReadResolver(typeName: string, fieldName: string, resourcePath: string, method: HttpMethod) {
    this.httpSource.createResolver({
      typeName,
      fieldName,
      requestMappingTemplate: MappingTemplate.fromString(
        JSON.stringify({
          version: '2018-05-29',
          method,
          resourcePath: resourcePath,
          params: {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        })
      ),
      responseMappingTemplate: MappingTemplate.fromString('$ctx.result.body'),
    });
  }
  private attachUpdateResolver(
    typeName: string,
    fieldName: string,
    resourcePath: string,
    method: HttpMethod,
    body: string
  ) {
    this.httpSource.createResolver({
      typeName,
      fieldName,
      requestMappingTemplate: MappingTemplate.fromString(
        JSON.stringify({
          version: '2018-05-29',
          method,
          resourcePath: resourcePath,
          params: {
            headers: {
              'Content-Type': 'application/json',
            },
            body,
          },
        })
      ),
      responseMappingTemplate: MappingTemplate.fromString('$ctx.result.body'),
    });
  }

  addPathAndResolver(config: ApiPathResolverConfig): ApiLambda {
    config.methods.forEach(method => {
      this.addMethod(method, config.path);
      if (method === 'GET') {
        this.attachReadResolver(config.typeName, config.fieldName, this.createResourcePath(config.path), 'GET');
      } else if (['PUT', 'POST'].includes(method)) {
        this.attachUpdateResolver(
          config.typeName,
          config.fieldName,
          this.createResourcePath(config.path),
          method,
          JSON.stringify(config.body)
        );
      } else {
        console.log('We have not implemented DELETE resolvers');
      }
    });
    return this;
  }

  addPathsAndResolvers(pathConfigs: ApiPathResolverConfig[]): ApiLambda {
    pathConfigs.forEach(config => {
      this.addPathAndResolver(config);
    });
    return this;
  }
}
