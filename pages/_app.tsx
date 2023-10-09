import Layout from '@/components/layout/layout';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEffect } from 'react';
import useSocket from '@/hooks/useSocket';

const queryClient = new QueryClient();

async function initServerSocket() {
  await fetch(
    process.env.NEXT_PUBLIC_API_URL + process.env.NEXT_PUBLIC_SOCKET_URL!
  );
}
initServerSocket();

export default function App({ Component, pageProps }: AppProps) {
  const [chat_socket, disconnect_chat_socket] = useSocket(
    '/api/socket/socketio'
  );

  useEffect(() => {
    return () => {
      disconnect_chat_socket();
    };
  }, [disconnect_chat_socket]);

  return (
    <SessionProvider session={pageProps.session}>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </QueryClientProvider>
    </SessionProvider>
  );
}
