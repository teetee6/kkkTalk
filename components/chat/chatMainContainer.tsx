import classes from './chatMainContainer.module.css';
import ChatListContainer from './chatContainer';
import ChatRoom from './chatRoom';
import { useRouter } from 'next/router';
import useSocket from '@/hooks/useSocket';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

function ChatMainContainer() {
  const router = useRouter();
  const session = useSession();
  const [chat_socket, disconnect_chat_socket] = useSocket(
    '/api/socket/socketio'
  );

  // useEffect(() => {
  //   return () => {
  //     disconnect_chat_socket();
  //   };
  // }, [disconnect_chat_socket]);

  return (
    <div className={classes.body}>
      <div className={classes.middleSide}>
        {session?.data?.user?.email &&
          router.query.slug &&
          router.query.slug[0] !== '-1' && (
            <ChatListContainer
              key={router.query.slug[0]}
              socket={chat_socket}
            />
          )}
      </div>
      <div className={classes.rightSide}>
        {session?.data?.user?.email && <ChatRoom socket={chat_socket} />}
      </div>
    </div>
  );
}

export default ChatMainContainer;
