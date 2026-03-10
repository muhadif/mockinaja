'use client';

import { HeroUIProvider } from '@heroui/react';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/lib/apollo-client';
import { useRouter } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    return (
        <ApolloProvider client={client}>
            <HeroUIProvider navigate={router.push}>
                {children}
            </HeroUIProvider>
        </ApolloProvider>
    );
}
