import { useCallback, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const sockets: { [key: string]: Socket } = {};
const useSocket = (key?: string): [Socket | undefined, () => void] => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);

  const disconnect = useCallback(() => {
    if (key && socket && sockets[key]) {
      socket.disconnect();
      delete sockets[key];
      setSocket(undefined);
    }
  }, [socket, key]);

  useEffect(() => {
    async function initServerSocket() {
      await fetch(`${key}`);
    }
    initServerSocket();
  }, [key]);

  useEffect(() => {
    const initSocket = async () => {
      if (key && !socket && !sockets[key]) {
        const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
          path: `${key}`,
          transports: ['websocket'],
        });
        sockets[key] = newSocket;
        setSocket(newSocket);
      }
    };

    initSocket();
  }, [key, socket]);

  return [socket, disconnect];
};

export default useSocket;
