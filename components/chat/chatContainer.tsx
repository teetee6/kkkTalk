import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import classes from './chatContainer.module.css';
import ChatList from './chatList';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Element, animateScroll as scroll } from 'react-scroll';
import { Socket } from 'socket.io-client';
import { Scrollbars } from 'react-custom-scrollbars';
import { useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export interface chatDataType {
  _id: string;
  createdAt: string;
  SenderId: string;
  content: string;
}

export interface roomDataType {
  _id: number;
  title: string;
  owner: string;
  memberList: string[];
}

export interface userDataType {
  username: string;
}

async function postChat(roomId: string, data: string): Promise<string> {
  const res = await fetch(`/api/chats/${roomId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat: data,
    }),
  }).then((res) => res.json());
  return res;
}

function ChatContainer({ socket }: { socket: Socket | undefined }) {
  const router = useRouter();
  const { slug } = router.query;
  const roomId = slug === undefined ? undefined : slug[0];
  const [chat, setChat] = useState('');
  const scrollbarRef = useRef<Scrollbars>(null);
  const session = useSession();
  const [dragOver, setDragOver] = useState(false);

  const {
    data: chatDatas,
    isLoading: isLoadingChats,
    isError: isErrorChats,
    error: chatError,
    refetch: refetchChatList,
    isLoadingError: isLoadingErrorChats,
  } = useQuery<chatDataType[]>(
    ['chat', roomId],
    async () => {
      const response = await fetch(`/api/chats/${roomId}`);
      const res = await response.json();
      if (!response.ok) {
        const error = new Error('not ok!');
        error.message = res.message;
        throw error;
      }
      return res;
    },
    { initialData: [] }
  );

  const { data: roomDatas, isLoading: isLoadingRoom } = useQuery<roomDataType>(
    ['room', roomId],
    async () => {
      const response = await fetch(`/api/room/${roomId}`);
      const res = await response.json();
      if (!response.ok) {
        const error = new Error('not ok!');
        error.message = res.message;
        throw error;
      }
      return res;
    }
  );

  const queryClient = useQueryClient();
  const { mutate: mutateChat } = useMutation<
    unknown,
    unknown,
    { chat: string },
    unknown
  >(({ chat }) => postChat(roomId!, chat), {
    onSuccess: () => {
      queryClient.invalidateQueries(['chat', roomId]);
    },
  });

  const onSubmitChat = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!chat?.trim()) return;
      mutateChat({ chat });
      setChat('');
      scrollbarRef.current?.scrollToBottom();
    },
    [chat, mutateChat]
  );

  const onChangeChat = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      setChat(e.target.value);
    },
    []
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (event.nativeEvent.isComposing === true) return;
      event.preventDefault();
      if (!chat?.trim()) return;
      mutateChat({ chat });
      setChat('');
    } else if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      setChat((prevChat) => prevChat + '\n');
    }
  }

  const onJoin = useCallback(
    async (newChatData: chatDataType) => {
      queryClient.setQueryData(['chat', roomId], (chatData: any) => {
        console.log('join: ', newChatData);
        return [...chatData, newChatData];
      });
      queryClient.invalidateQueries(['chat', roomId]);
    },
    [queryClient, roomId]
  );

  const onMessage = useCallback(
    async (newChatData: chatDataType) => {
      queryClient.setQueryData(['chat', roomId], (chatData: any) => {
        console.log('새로받은 메세지: ', newChatData);
        return [...chatData, newChatData];
      });
      queryClient.invalidateQueries(['chat', roomId]);
      if (newChatData.SenderId === session?.data?.user?.email) {
        setTimeout(() => {
          scrollbarRef.current?.scrollToBottom();
        }, 100);
        return;
      }
      if (
        scrollbarRef.current &&
        scrollbarRef.current.getScrollHeight() <
          scrollbarRef.current.getClientHeight() +
            scrollbarRef.current.getScrollTop() +
            150
      ) {
        setTimeout(() => {
          scrollbarRef.current?.scrollToBottom();
        }, 50);
      } else {
        toast.success('새 메시지가 도착했습니다.', {
          onClick() {
            scrollbarRef.current?.scrollToBottom();
          },
          closeOnClick: true,
        });
        toast.clearWaitingQueue();
      }
    },
    [queryClient, roomId, session?.data?.user?.email]
  );

  function DeleteRoom() {
    fetch(`/api/room/${roomId}`, {
      method: 'DELETE',
    }).then((res) => {
      if (res.ok) {
      }
    });
  }

  useEffect(() => {
    socket?.on('message', onMessage);
    socket?.on('join', onJoin);
    return () => {
      socket?.off('message', onMessage);
      socket?.off('join', onJoin);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollbarRef.current?.scrollToBottom();
    }, 50);
  }, []);

  /** 파일관련 */
  const onChangeFile = useCallback(
    (e: any) => {
      const formData = new FormData();
      if (e.target.files) {
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          console.log(e, '.... file[' + i + '].name = ' + file.name);
          formData.append('image', file);
        }
      }
      fetch(`/api/rooms/${roomId}/images`, {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (res.ok) {
          refetchChatList();
        }
      });
    },
    [refetchChatList, roomId]
  );

  const onDrop = useCallback(
    (e: any) => {
      e.preventDefault();
      console.log(e);
      const formData = new FormData();
      if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            console.log(e, '.... file[' + i + '].name = ' + file.name);
            formData.append('image', file);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          console.log(
            e,
            '... file[' + i + '].name = ' + e.dataTransfer.files[i].name
          );
          formData.append('image', e.dataTransfer.files[i]);
        }
      }
      fetch(`/api/rooms/${roomId}/images`, {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (res.ok) {
          setDragOver(false);
          refetchChatList();
        }
      });
    },
    [refetchChatList, roomId]
  );

  const onDragOver = useCallback((e: any) => {
    e.preventDefault();
    console.log(e);
    setDragOver(true);
  }, []);
  /** 파일관련 끝 */

  if (!session) return <div>로그인이 필요합니다.</div>;

  if (!roomDatas || !chatDatas) return <div>로딩중...</div>;
  if (isLoadingRoom || isLoadingChats) return <div>로딩중...</div>;

  return (
    <div className={classes.container} onDrop={onDrop} onDragOver={onDragOver}>
      <div className={classes.chatList}>
        <Scrollbars autoHide ref={scrollbarRef}>
          <ChatList chatDatas={chatDatas} />
        </Scrollbars>
        <ToastContainer limit={1} />
      </div>
      <div className={classes.sendChat}>
        <textarea
          onChange={onChangeChat}
          onKeyDown={handleKeyDown}
          value={chat}
          title={chat}
        />
      </div>
      <div className={classes.buttonContainer}>
        <div className={classes.sendChatButton} onClick={onSubmitChat}>
          채팅보내기
        </div>
        <div className={classes.buttonContainer2}>
          {session.data?.user?.email === roomDatas.owner && (
            <div className={classes.deleteRoomButton} onClick={DeleteRoom}>
              방 폭파하기
            </div>
          )}
          <div
            className={classes.goBackButton}
            onClick={() => {
              router.replace('/chat/-1');
            }}
          >
            방 목록으로
          </div>
        </div>
      </div>
      {/* <input type="file" multiple onChange={onChangeFile} /> */}
      {dragOver && <div className={classes.dragOver}>업로드!</div>}
    </div>
  );
}

export default ChatContainer;
