import { GetServerSidePropsContext } from 'next';
// import { getSession, useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import ChatMainContainer from '@/components/chat/chatMainContainer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// function ChatPage() {
//   return <ChatMainContainer />;
// }

// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const session = await getSession({ req: context.req });

//   if (!session) {
//     return {
//       redirect: {
//         destination: '/auth',
//         permanent: false,
//       },
//     };
//   }

//   return {
//     props: { session },
//   };
// }

function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  return <ChatMainContainer />;
}

export default ChatPage;
