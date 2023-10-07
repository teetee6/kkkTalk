import classes from './chatMainContainer.module.css';
import ChatListContainer from './chatContainer';
import ChatRoom from './chatRoom';
import { useRouter } from 'next/router';
import useSocket from '@/hooks/useSocket';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from '../modal/modal';
import { useSession } from 'next-auth/react';

function ChatMainContainer() {
  const router = useRouter();
  const session = useSession();
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [chat_socket, disconnect_chat_socket] = useSocket(
    '/api/socket/socketio'
  );

  useEffect(() => {
    return () => {
      disconnect_chat_socket();
    };
  }, [disconnect_chat_socket]);

  const onCloseDeleteRoomModal = useCallback(() => {
    setShowDeleteRoomModal(
      (prevShowDeleteRoomModal) => !prevShowDeleteRoomModal
    );
  }, []);

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
        {session?.data?.user?.email && (
          <ChatRoom
            socket={chat_socket}
            setShowDeleteRoomModal={setShowDeleteRoomModal}
          />
        )}
      </div>
      <Modal show={showDeleteRoomModal} onCloseModal={onCloseDeleteRoomModal}>
        <div className="deleteRoomModalContainer">
          <div className="deleteRoomModal">방이 폭파되었습니다</div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatMainContainer;
