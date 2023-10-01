import React from 'react';
import { useCallback, useState } from 'react';
import { chatDataWithHmsType } from './chatList';
import classes from './Chat.module.css';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

function Chat({
  index,
  chatData,
}: {
  index: number;
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
      key={index}
    >
      <div className={classes.chatProfile}>
        {/* <Image src="" alt="Profile Image" width={30} height={30} /> */}
      </div>
      {/* <div> chatMenu</div> */}
      <div
        className={`${classes.chatMain} ${
          chatData.SenderId !== session?.user?.email ? classes.otherUser : ''
        }`}
      >
        <span>{chatData.SenderId}</span>
        <span>{chatData.hms}</span>
        <div
          className={`${classes.chatBubble} ${
            chatData.SenderId !== session?.user?.email ? classes.otherUser : ''
          }`}
        >
          {chatData.content}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Chat);
