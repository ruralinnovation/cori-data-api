import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  concat,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import aws_config from "../amplifyConfig";
import AmplifyService from '../services/AmplifyService';
import AppContext, { AppContextPropsType } from './AppContext';

export interface IApiContext { bcatApi: any; }
export const ApiContext = createContext<IApiContext>(null as any);

Amplify.configure(aws_config);

function ApiContextProvider(props: { children: any }) {
  const { config, authUser, updateAuthUser } = useContext<AppContextPropsType>(AppContext);
  const [ready, setReady] = useState<boolean>(false);
  const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);

  useEffect(() => {
    if (authUser) {
      createApolloClient()
        .then(c => console.log('Apollo Client created'));
    }
  }, [authUser]);
  const [state, setState] = useState<IApiContext>(null as any);

  useEffect(() => {
    if (config) {
      const useAuth = config.environment !== 'local';
      setState({
        bcatApi: () => null,
      });
      if (!config.cognito || !config.loaded) return;

      AmplifyService.setHubListener(updateAuthUser);

      AmplifyService.isAuthenticated()
        .then(bool => {
          console.log('Authenticationed ', bool);
          if (bool) {
            AmplifyService.getClaims()
              .then(claims => {
                if (!claims) {
                  console.log('not auth');
                  AmplifyService.federatedLogin();
                } else {
                  updateAuthUser({
                    username: claims.username,
                    userType: 'admin',
                    groups: claims.groups,
                    email: claims.email,
                  });
                }
              })
              .catch(err => {
                console.log(err);
                updateAuthUser(null);
              });
          } else {
            AmplifyService.federatedLogin('');
          }
        })
        .catch(err => {
          console.log('ERROR', err);
        });
    }
  }, [config, updateAuthUser]);

  const createApolloClient = async () => {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken();
    const link = new HttpLink({
      uri: `${config.apiUrl}/graphql`,
    });
    const authMiddleware = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      return forward(operation);
    });
    const client = new ApolloClient({
      link: concat(authMiddleware, link),
      cache: new InMemoryCache({
        dataIdFromObject: o => (o.id ? `${o.__typename}-${o.id}` : `${o.__typename}-${o.cursor}`),
      }),
      credentials: 'include',
    });

    setApolloClient(client);
    setReady(true);
  };

  return (
    <ApiContext.Provider value={state}>
      {authUser && state && ready && apolloClient ? (
        <ApolloProvider client={apolloClient}>{props.children}</ApolloProvider>
      ) : (
        <div>LOADING</div>
      )}
    </ApiContext.Provider>
  );
}

export default ApiContextProvider;
