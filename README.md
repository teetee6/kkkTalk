## kkkTalk

- Next.js로 구현한 웹채팅 입니다.

### 배포주소
https://kkkkkktalk.com/

### 기술 스택

<div>
  <img src="https://img.shields.io/badge/react-61DAFB?style=flat&logo=react&logoColor=white">
  <img src="https://img.shields.io/badge/typescript-3178C6?style=flat&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/next.js-214156?style=flat&logo=next.js&logoColor=white">
  <img src="https://img.shields.io/badge/react-query-333333?style=flat&logo=react-query&logoColor=white">
  <img src="https://img.shields.io/badge/next.js-214156?style=flat&logo=next.js&logoColor=white">
  <img src="https://img.shields.io/badge/socket.io-512312?style=flat&logo=socket.io&logoColor=white">
</div>

<br/>

### 🗂️ 폴더 구조

```
📦src
 ┣ 📂components
 ┣ 📂hooks
 ┣ 📂lib (db관련 연결)
 ┣ 📂pages
 ┣ 📂public
 ┣ 📂styles
 ┣ 📂types
 ┗ 📂uploads (이미지 업로드 로컬파일 시스템 저장경로)
```

## 💡 주요 기능(프론트엔드)

### 1. API 라우트 보호

<details>
  <summary>설명</summary>
  <div>
  
next.js에선 서버와 클라이언트가 동일한 서버에서 공간에서 실행된다는 장점을 이용하여, next-auth의 세션을 적극 이용하여 API 라우트를 다음과 같은 방식으로 보호하였습니다.
```jsx
import ChatMainContainer from '@/components/chat/chatMainContainer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function ChatPage() {
const { data: session } = useSession();
const router = useRouter();

useEffect(() => {
if (!session) {
router.push('/'); // 세션이 없으면 '/'로 이동
}
}, [session, router]);

return <ChatMainContainer />; // 세션이 있으면 채팅으로 이동
}

export default ChatPage;

````
</div>
</details>

### 2.소켓 관리

<details>
  <summary>설명</summary>
  <div>
key('/api/socket/socketio')에 따라 프론트엔드에서 소켓의 네임스페이스를 분리하여 관리하게 하였습니다. 또한 Next.js는 클라이언트가 보내는 요청(request)에 대해서 백엔드에서 초기 작업으로 데이터베이스를 connection하는 작업 및 io를 request에 바인딩 시켜줘야 하는데 그것을 위하여 fetch()메소드를 호출하는 작업이 필요합니다.

```js
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}${key}`);
    } // 백엔드
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
````

</div>
</details>

### 3. 방 목록 pagination 및 다음페이지 pre-fetch

<details>
  <summary>설명</summary>
  <div>

react-query를 이용하여 방 목록을 다음과 같이 pagiation 합니다.

```js
const pageSize = 7;
const fetchPaginatedData = async (page: number, pageSize: number) => {
  const response = await fetch(`/api/rooms?page=${page}&pageSize=${pageSize}`);
  const data = await response.json();
  return data;
};

const {
    data: roomDatas,
    isLoading: isLoadingPaginatedRoomlist,
    isError,
  } = useQuery(['roomlist', currentPage], () =>
    fetchPaginatedData(currentPage, pageSize)
  );
```

다음 페이지 목록에 대해 빠른 로딩을 위해 미리 데이터를 받아옵니다.

```js
useEffect(() => {
  const nextPage = currentPage + 1;
  queryClient.prefetchQuery(['posts', nextPage], () =>
    fetchPaginatedData(nextPage, pageSize)
  );
}, [currentPage, queryClient]);
```

  </div>
</details>

### 4. 채팅 메세지 요일 기반으로 묶어서 정렬하기

<details>
  <summary>설명</summary>
  <div>

dayjs 라이브러리를 이용하여 채팅데이터들을 요일별에 맞게 파싱합니다.

```jsx
const weekDays: { [key: string]: string } = {
  Sunday: '일',
  Monday: '월',
  Tuesday: '화',
  Wednesday: '수',
  Thursday: '목',
  Friday: '금',
  Saturday: '토',
};
function ChatList({ chatDatas }: { chatDatas: chatDataType[] }) {
  const obj: { [key: string]: chatDataWithHmsType[] } = {};
  const obj_keys: string[] = [];

  chatDatas.forEach((chatData: chatDataType) => {
    const date = dayjs(chatData.createdAt);
    const key = date.format('YYYY-MM-DD');
    const hms = date.format('h:mm:ss a');
    if (!(key in obj)) {
      obj[key] = [{ ...chatData, hms: hms, content: chatData.content }];
      obj_keys.push(key);
    } else {
      obj[key].push({ ...chatData, hms: hms, content: chatData.content });
    }
  });

  obj_keys.sort((a, b) => a.localeCompare(b));

  return (
    <div className={classes.chatLists}>
      {obj_keys.map((obj_key, index) => {
        const week = weekDays[dayjs(obj_key).locale('ko').format('dddd')];

        return (
          <div key={index}>
            <div className={classes.YYYY_MM_DD}>
              {obj_key} {week}
            </div>
            {obj[obj_key].map((chatData, index2) => {
              return <Chat key={index2} index={index2} chatData={chatData} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default ChatList;
```

  </div>
</details>

### 5. 드래그&드롭 업로드 이미지 처리

<details>
  <summary>설명</summary>
  <div>

드래그 상태를 나타내는 state변수를 만듭니다<br>
drop 상태가 되면, [프로젝트 폴더]/api/rooms/[roomId]/images.ts로 POST요청을 보내 백엔드의 로컬파일 시스템에 저장합니다.

```jsx
const [dragOver, setDragOver] = useState(false);

const onDragOver = useCallback((e: any) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

const onDrop = useCallback(
    (e: any) => {
      e.preventDefault();
      const formData = new FormData();
      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            formData.append('image', file);
          }
        }
      } else {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
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
```

채팅 메세지가 uploads/로 경로로써 시작할 경우 이미지 이므로,<br>
[프로젝트 폴더]/api/uploads/[...segments].ts로 api요청을 보내 이미지 서빙을 요청합니다.
(uploads/651aa51d5fc00a8d92a6dc0f/1696245029128_tab.png 같은 형태입니다.)

```jsx
{
  chatData.content.startsWith('uploads\\') ||
  chatData.content.startsWith('uploads/') ? (
    <Image
      alt="chatImage"
      src={`${process.env.NEXT_PUBLIC_API_URL}/api/${chatData.content}`}
      width={200}
      height={200}
    />
  ) : (
    <div
      className={`${classes.chatBubble} ${
        chatData.SenderId !== session?.user?.email ? classes.otherUser : ''
      }`}
    >
      {chatData.content}
    </div>
  );
}
```

  </div>
</details>

### 6. 프로필 이미지 처리

<details>
  <summary>설명</summary>
  <div>


profileImage 소켓이벤트가 발생하면 다음과 같이 해당 방의 채팅 내역을 다시 불러와 이미지를 업데이트 시켜줍니다.
    
```jsx
 const onProfileImage = useCallback(async () => {
    queryClient.invalidateQueries(['chat', roomId]);
  }, [queryClient, roomId]);
```

src='/api/chatProfile/teetee6@naver.com'<br>
src='/api/chatProfile/teetee6@naver.com'<br>
과 같은 형식으로 요청을 하였더니, 브라우저에서 캐싱을 한다고 하여, 요청이 한번밖에 가지 않는 이슈가 있었습니다. 따라서 여러번 요청이 가도록 뒤에 랜덤 쿼리파라미터를 넣어주었습니다.

```jsx
<Image
          src={
            chatData.SenderId === '[system]'
              ? '/assets/system.png'
              : `/api/chatProfile/${chatData.SenderId}?${Math.random()}`
          }
          alt="Profile Image"
          width={30}
          height={30}
          loading="lazy"
        />
```

또한 채팅목록이 여러개 있으면, 채팅입력 할때 렉이 걸리는 최적화 문제가 발생하였습니다. 따라서 다음과 같이 메모이제이션을 사용하였습니다.

```jsx
React.memo(ChatList)
```

  </div>
</details>

## 💡 주요 기능(백엔드)

### 1. db 연결풀 생성

<details>
  <summary>설명</summary>
  <div>

db풀을 만들고, connection비용을 최소화하기 위해 cachedClient를 만들었습니다.

```jsx

export async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(address, {
    maxPoolSize: 10,
  });

  cachedClient = await client.connect();
  return cachedClient;
}
```

  </div>
</details>

### 2. 최초입장 및 이미 입장했을 시 항상 소켓 해당방 join

<details>
  <summary>설명</summary>
  <div>
최초 방입장과 이미 입장한 방에 대해 구현하다 보니, 소켓이 끊기는 상황(새로고침 및 다른 페이지로 이동하는 상황)이 있을 경우 소켓 갱신 후에 필요시마다 해당 room에 대한 join도 다시 해줘야 해줬습니다. <br>
따라서, 입장했음을 DB의 해당 방 멤버리스트에 저장하고, 그에 따라 처리하도록 하였습니다.

pages/api/rooms/enters.ts 발췌

```jsx
// 방에 이미 입장했는지 확인
const room = await roomsCollection.findOne({
  chatId: chatsDocument?._id,
  memberList: session.user!.email,
});
```

```jsx
 // 방에 처음 입장한 사람인 경우
const now_time = new Date().toISOString();

const chatsCollection = client
  .db()
  .collection(`chats-${req.body.roomId}`);
const chats_result = await chatsCollection.insertOne({
  createdAt: now_time,
  SenderId: '[system]',
  content: `${session.user!.email}님이 입장하셨습니다.`,
});

res.socket.server.io.to(req.body.roomId).emit('join', {
  _id: chats_result.insertedId,
  createdAt: now_time,
  SenderId: '[system]',
  content: `${session.user!.email}님이 입장하셨습니다.`,
});

res
  .status(201)
  .json({ message: 'Entered the room for the first time' });
```

위 요청후, 클라이언트는 status code 200 or 201을 받게되는데, 200이던 201이던 상관없이 백엔드로 joinRoom emit 합니다.(새로고침 및 페이지 이동후 돌아와서 소켓이 끊기지 않김을 위함입니다)

pages/api/socket/socketio.ts 발췌

```jsx
socket.on('joinRoom', async (roomId, email) => {
  socket.join(roomId);
});
```

  </div>
</details>

### 3. 이미지 업로드 구현

<details>
  <summary>설명</summary>
  <div>

formidable 라이브러리를 차용했습니다.<br>
[프로젝트 폴더]/uploads/[해당roomId]/[새로운fileName] 으로 저장하였습니다.

pages/api/rooms/[roomId]/images.ts 발췌

```jsx
async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'Not authenticated!' });
      return;
    }

    const uploadsPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath);
    }
    const roomId = req.query.roomId as string;
    const roomFolderPath = path.join(uploadsPath, roomId);
    if (!fs.existsSync(roomFolderPath)) {
      fs.mkdirSync(roomFolderPath);
    }

    let new_filename;
    const now_time = Date.now();
    const readFile = (req: NextApiRequest, saveLocally: boolean = true) => {
      const options: formidable.Options = {};

      if (saveLocally) {
        options.uploadDir = roomFolderPath;
        options.filename = (name, ext, path, form) => {
          new_filename = now_time.toString() + '_' + path.originalFilename;
          return new_filename;
        };
      }

      return new Promise<{
        fields: formidable.Fields;
        files: formidable.Files;
      }>((resolve, rejects) => {
        const form = formidable(options);

        form.parse(req, (err, fields, files) => {
          if (err) {
            rejects(err);
          }
          resolve({ fields, files });
        });
      });
    };

    const data = await readFile(req, true);

    const completePath = path.join(roomFolderPath, new_filename!);
    const relativePath = path.relative(process.cwd(), completePath);

    const client = await connectToDatabase();
    const result = await client.db().collection(`chats-${roomId}`).insertOne({
      SenderId: session.user!.email,
      content: relativePath,
      createdAt: now_time,
    });

    res.socket.server.io.to(`${roomId}`).emit('message', {
      _id: result.insertedId,
      createdAt: now_time,
      SenderId: session.user!.email,
      content: relativePath,
    });

    return res.status(201).json({ message: 'OK' });
  }
}
```

  </div>
</details>

### 4. 방 폭파기능 구현

<details>
  <summary>설명</summary>
  <div>

관련된 항목들을 db및 로컬파일 시스템에서 모두 빠짐없이 삭제하도록 합니다.

```jsx
if (req.method === 'DELETE') {
  try {
    const chatsCollection = client.db().collection('chats');
    const chats = await chatsCollection
      .find({
        _id: new ObjectId(req.query.index as string),
      })
      .toArray();

    if (chats[0].SenderId !== session.user!.email) {
      res.status(401).json({ message: 'Not authenticated!' });
      return;
    }

    // chats document 삭제
    await chatsCollection.deleteOne({
      _id: new ObjectId(req.query.index as string),
    });
    // chats-채팅방번호 collection 삭제
    await client.db().dropCollection(`chats-${req.query.index}`);
    // rooms collection에서 해당 채팅방 삭제
    await client
      .db()
      .collection('rooms')
      .deleteOne({
        chatId: new ObjectId(req.query.index as string),
      });

    res.socket.server.io
      .to(`${req.query.index}`)
      .emit('removeRoom', req.query.index);

    // 채팅방 이미지 삭제
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const roomFolderPath = path.join(uploadsPath, req.query.index as string);
    // 이미지 폴더가 존재하는지 확인
    if (fs.existsSync(roomFolderPath)) {
      fs.rmdirSync(roomFolderPath, { recursive: true });
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Failed to fetch chat messages' });
  }
```

  </div>
</details>

### 5. 프로필 이미지 처리

<details>
  <summary>설명</summary>
  <div>
회원가입시 기존 public폴더 안의 assets/user.png파일을 프로젝트폴더/uploads/[몽고 유저_id]/user.png 위치로 저장합니다. 그 후, 유저가 프로필 이미지를 제출하면 기존의 파일을 지운후, 프로젝트폴더/uploads/[몽고 유저 _id]/'현재시각_원본명' 위치로 저장합니다. <br>
 그 후, 해당 유저가 join되어있는 방에게 profileImage 이벤트 소켓통신으로 이미지가 갱신되었음을 알립니다.

  </div>
</details>

# 💡 시현 영상


- 기본 채팅 및 방폭파 확인, 파일업로드<br>

https://github.com/teetee6/kkkTalk/assets/17748068/e85dd707-ee0f-4c5a-983a-5131f9314c60



- 최초방 입장 및 프리페칭 페이지네이션, 새로고침 소켓원활함<br>

https://github.com/teetee6/kkkTalk/assets/17748068/a3aa1bce-e767-45df-b23a-c236101dc61b

- 프로필 이미지 변경<br>


https://github.com/teetee6/kkkTalk/assets/17748068/bf4a7ca3-83c5-4e73-a696-5b9f9f766e29


