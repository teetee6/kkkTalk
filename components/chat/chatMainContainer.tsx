import classes from './chatMainContainer.module.css';
import ChatListContainer from './chatContainer';
import ChatRoom from './chatRoom';
import { useRouter } from 'next/router';
import useSocket from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { Modal } from '../modal/modal';
import { useCallback, useState } from 'react';

function ChatMainContainer() {
  const router = useRouter();
  const session = useSession();
  const [showKickedModal, setShowKickedModal] = useState(false);
  const [chat_socket, disconnect_chat_socket] = useSocket(
    '/api/socket/socketio'
  );

  const onCloseKickedModal = useCallback(() => {
    setShowKickedModal((prevShowKickedModal) => !prevShowKickedModal);
  }, []);

  return (
    <div className={classes.body}>
      <div
        className={`${classes.middleSide} ${
          router.query.slug && router.query.slug[0] === '-1'
            ? classes.hidden
            : ''
        }`}
      >
        {session?.data?.user?.email &&
          router.query.slug &&
          router.query.slug[0] === 'kicked' && <div> hi</div>}
        {session?.data?.user?.email &&
          router.query.slug &&
          router.query.slug[0] !== '-1' && (
            <ChatListContainer
              key={router.query.slug[0]}
              socket={chat_socket}
              setShowKickedModal={setShowKickedModal}
            />
          )}
      </div>

      <div
        className={`${classes.rightSide} ${
          router.query.slug && router.query.slug[0] !== '-1'
            ? classes.hidden
            : ''
        }`}
      >
        <div className={classes.mobileToggle}>
          {session?.data?.user?.email && <ChatRoom socket={chat_socket} />}
        </div>
      </div>

      <Modal show={showKickedModal} onCloseModal={onCloseKickedModal}>
        <div className="kickedModalContainer">
          <div className="kickedModal">강퇴당했습니다</div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatMainContainer;
