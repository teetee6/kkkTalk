import dayjs from 'dayjs';
import { chatDataType } from './chatContainer';
import classes from './chatList.module.css';
import Chat from './Chat';
import { Socket } from 'socket.io-client';
import React from 'react';

export interface chatDataWithHmsType {
  content: string;
  createdAt: string;
  SenderId: string;
  hms: string;
  _id: string;
  chatId: string;
}

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
            {obj[obj_key].map((chatData) => {
              return (
                <Chat
                  key={chatData._id}
                  index={chatData._id}
                  chatData={chatData}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(ChatList);
