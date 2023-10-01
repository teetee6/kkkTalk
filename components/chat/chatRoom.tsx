import { useCallback, useEffect, useState } from 'react';
import classes from './chatRoom.module.css';
import { Modal } from '../modal/modal';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Socket } from 'socket.io-client';

// type
export interface roomDataType {
  _id: string;
  title: string;
  SenderId: string;
  createdAt: string;
}

async function postCreateRoom(title: string): Promise<string> {
  return await fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
    }),
  }).then((res) => {
    return res.json();
  });
}

const pageSize = 7; // 페이지 크기
const fetchPaginatedData = async (page: number, pageSize: number) => {
  const response = await fetch(`/api/rooms?page=${page}&pageSize=${pageSize}`);
  const data = await response.json();
  return data;
};

function ChatRoom({
  socket,
  setShowDeleteRoomModal,
}: {
  socket: Socket | undefined;
  setShowDeleteRoomModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [title, setTitle] = useState('');
  const session = useSession();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  // const { data: roomDatas, isLoading: isLoadingRooms } = useQuery<
  //   roomDataType[]
  // >(['roomlist'], () => fetch(`/api/rooms/`).then((res) => res.json()));

  const {
    data: roomDatas,
    isLoading: isLoadingPaginatedRoomlist,
    isError,
  } = useQuery(['roomlist', currentPage], () =>
    fetchPaginatedData(currentPage, pageSize)
  );

  //prefetch next page
  useEffect(() => {
    const nextPage = currentPage + 1;
    queryClient.prefetchQuery(['posts', nextPage], () =>
      fetchPaginatedData(nextPage, pageSize)
    );
  }, [currentPage, queryClient]);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((previousValue) => previousValue - 1);
    }
  };

  const goToNextPage = () => {
    setCurrentPage((previousValue) => previousValue + 1);
  };

  const { mutate: mutateRoom } = useMutation<
    string,
    unknown,
    { title: string },
    unknown
  >(({ title }) => postCreateRoom(title), {
    onSuccess: () => {
      queryClient.invalidateQueries(['roomlist']);
    },
  });

  const onChangeTitle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setTitle(e.target.value);
    },
    []
  );

  const onCloseCreateRoomModal = useCallback(() => {
    setShowCreateRoomModal(
      (prevShowCreateRoomModal) => !prevShowCreateRoomModal
    );
    setTitle('');
  }, []);

  const onCreateRoom = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      mutateRoom({ title });
      onCloseCreateRoomModal();
    },
    [title, mutateRoom, onCloseCreateRoomModal]
  );

  const onEnterEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      const roomId = e.currentTarget.dataset.id;
      const roomTitle = e.currentTarget.children[0].textContent;
      const senderId = e.currentTarget.children[1].textContent;

      fetch('/api/rooms/enter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          roomTitle,
          senderId,
        }),
      }).then((res) => {
        console.log(res.status);
        if (res.status === 200 || 201) {
          socket?.emit('joinRoom', roomId, session?.data?.user?.email);
          router.replace(`/chat/${roomId}`);
        }
      });
    },
    [router, socket, session?.data?.user?.email]
  );

  const onNewRoom = useCallback(
    async (data: {
      _id: string;
      createdAt: string;
      SenderId: string;
      title: string;
    }) => {
      if (!roomDatas) return;
      queryClient.setQueryData(['roomlist'], () => {
        console.log(`newRoom: ${data}`);
        return [...roomDatas, data];
      });
      queryClient.invalidateQueries(['roomlist']);
    },
    [queryClient, roomDatas]
  );

  const onRemoveRoom = useCallback(
    async (data: number) => {
      if (!roomDatas) return;
      const new_rooms = roomDatas.filter(
        (room: roomDataType) => String(room._id) !== String(data)
      );
      queryClient.setQueryData(['roomlist'], () => {
        return new_rooms;
      });
      queryClient.invalidateQueries(['roomlist']);
      setShowDeleteRoomModal(
        (prevShowDeleteRoomModal) => !prevShowDeleteRoomModal
      );
      router.replace('/chat/-1');
    },
    [queryClient, roomDatas, router, setShowDeleteRoomModal]
  );

  useEffect(() => {
    socket?.on('newRoom', onNewRoom);
    socket?.on('removeRoom', onRemoveRoom);
    return () => {
      socket?.off('newRoom', onNewRoom);
      socket?.off('removeRoom', onRemoveRoom);
    };
  }, [onNewRoom, onRemoveRoom, socket]);

  // if (isLoadingRooms) return <div> isLoading...</div>;

  if (!roomDatas || !session) return <div> isLoading... </div>;

  if (isLoadingPaginatedRoomlist) return <div> isLoading...</div>;

  return (
    <div className={classes.roomContainer}>
      <div className={classes.createRoom}>
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowCreateRoomModal(
              (prevShowCreateRoomModal) => !prevShowCreateRoomModal
            );
          }}
          title="방 만들기"
        >
          <Image
            src="/assets/tab.png"
            alt="createRoom"
            width={60}
            height={60}
          ></Image>
        </button>
      </div>
      <div className={classes.roomList}>
        {roomDatas?.map((roomInfo: roomDataType) => {
          return (
            <div
              className={classes.eachRoom}
              data-id={roomInfo._id}
              key={roomInfo._id}
              onClick={onEnterEvent}
            >
              <div>{roomInfo.title}</div>
              <div>{roomInfo.SenderId}</div>
            </div>
          );
        })}
      </div>
      <div className={classes.pagination}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={goToPreviousPage}
        >
          이전
        </button>
        <span>{currentPage}</span>
        <button
          type="button"
          // disabled={currentPage * pageSize < totalRoomsCount}
          onClick={goToNextPage}
        >
          다음
        </button>
      </div>
      <Modal show={showCreateRoomModal} onCloseModal={onCloseCreateRoomModal}>
        <form onSubmit={onCreateRoom}>
          <div>
            <input
              type="text"
              name="title"
              placeholder="방 제목"
              value={title}
              onChange={onChangeTitle}
              style={{
                borderRadius: '2rem',
                border: '0.3rem solid black',
                backgroundColor: 'rgb(243, 242, 240)',
                padding: '1rem',
                margin: '1rem',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              margin: '1rem',
              padding: '0.5rem',
              borderRadius: '1rem',
              backgroundColor: '#64E469',
              border: '0.3rem solid black',
              width: '4rem',
              height: '4rem',
            }}
            title="방 만들기(모달)"
          >
            <Image
              src="/assets/createPage.png"
              alt="createRoomButton(모달)"
              width={40}
              height={40}
            />
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default ChatRoom;
