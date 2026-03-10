import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql',
});

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    let token = '';
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('token') || '';
    }
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    }
});

export const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
});
