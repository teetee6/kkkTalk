import ChatMainContainer from '@/components/chat/chatMainContainer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

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
