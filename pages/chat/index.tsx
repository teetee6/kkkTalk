import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import ChatMainContainer from '@/components/chat/chatMainContainer';
import { useRouter } from 'next/router';

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
