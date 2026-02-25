import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

if (!endpoint) {
  throw new Error('VITE_GRAPHQL_ENDPOINT is required in front/.env.local or front/.env');
}

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: endpoint,
    credentials: 'same-origin',
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});
