import classes from './chatMainContainer.module.css';
import ChatListContainer from './chatContainer';
import ChatRoom from './chatRoom';
import { useRouter } from 'next/router';
import useSocket from '@/hooks/useSocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import Link from 'next/link';
import { Modal } from '../modal/modal';

function ChatMainContainer() {
  const router = useRouter();
  const [showCreateRoomModal, setShowDeleteRoomModal] = useState(false);
  const [chat_socket, disconnect_chat_socket] = useSocket(
    '/api/socket/socketio'
  );

  useEffect(() => {
    console.log('호출되었습니다.');
    return () => {
      console.log('컴포넌트가 사라집니다.');
      disconnect_chat_socket();
    };
  }, [disconnect_chat_socket]);

  const onCloseCreateRoomModal = useCallback(() => {
    setShowDeleteRoomModal(
      (prevShowDeleteRoomModal) => !prevShowDeleteRoomModal
    );
  }, []);

  return (
    <div className={classes.body}>
      <div className={classes.middleSide}>
        {router.query.slug && router.query.slug[0] !== '-1' && (
          <ChatListContainer socket={chat_socket} />
        )}
      </div>
      <div className={classes.rightSide}>
        <ChatRoom
          socket={chat_socket}
          setShowDeleteRoomModal={setShowDeleteRoomModal}
        />
      </div>
      <Modal show={showCreateRoomModal} onCloseModal={onCloseCreateRoomModal}>
        <div className="deleteRoomModalContainer">
          <div className="deleteRoomModal">방이 폭파되었습니다</div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatMainContainer;
