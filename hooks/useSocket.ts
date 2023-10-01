import { useCallback, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

const server_public_ip = 'localhost';
const server_port = '3000';

const sockets: { [key: string]: Socket } = {};

// const useSocket = (key?: string): [Socket | undefined, () => void] => {
//   const disconnect = useCallback(() => {
//     if (key && sockets[key]) {
//       sockets[key].disconnect();
//       delete sockets[key];
//     }
//   }, [key]);
//   if (!key) return [undefined, disconnect];
//   if (!sockets[key]) {
//     // sockets[key] = io(`http://${server_public_ip}:${server_port}/${key}`, {
//     //   transports: ['websocket'],
//     // });
//     (async () => {
//       await fetch(`http://${server_public_ip}:${server_port}${key}`);
//     })();
//     sockets[key] = io(`http://${server_public_ip}:${server_port}`, {
//       path: `${key}`,
//     });
//   }
//   return [sockets[key], disconnect];
// };

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
      await fetch(`http://${server_public_ip}:${server_port}${key}`);
    }
    initServerSocket();
  }, []);

  useEffect(() => {
    const initSocket = async () => {
      if (key && !socket && !sockets[key]) {
        // await fetch(`http://${server_public_ip}:${server_port}${key}`);
        const newSocket = io(`http://${server_public_ip}:${server_port}`, {
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
