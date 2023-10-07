import React from 'react';
import { useCallback, useState } from 'react';
import { chatDataWithHmsType } from './chatList';
import classes from './Chat.module.css';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useQuery } from 'react-query';

function Chat({
  index,
  chatData,
}: {
  index: string;
  chatData: chatDataWithHmsType;
}) {
  const { data: session } = useSession();
  const [selectedChatProfile, setSelectedChatProfile] =
    useState<boolean>(false);

  const handleChatProfileClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
      e.stopPropagation();
      setSelectedChatProfile((prev) => !prev);
    },
    []
  );

  return (
    <div
      className={`${classes.chatItem} ${
        chatData.SenderId !== session?.user?.email ? classes.otherUser : ''
      }`}
      key={`${index}`}
    >
      <div className={classes.chatProfile}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
      </div>
      {/* <div> chatMenu</div> */}
      <div
        className={`${classes.chatMain} ${
          chatData.SenderId !== session?.user?.email ? classes.otherUser : ''
        }`}
      >
        <span>{chatData.SenderId}</span>
        <span>{chatData.hms}</span>
        {chatData.content.startsWith('uploads\\') ||
        chatData.content.startsWith('uploads/') ? (
          <Image
            alt="chatImage"
            src={`/api/${chatData.content}`}
            width={200}
            height={200}
          />
        ) : (
          <div
            className={`${classes.chatBubble} ${
              chatData.SenderId !== session?.user?.email
                ? classes.otherUser
                : ''
            }`}
          >
            {chatData.content}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(Chat);
