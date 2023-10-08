import React from 'react';
import { useCallback, useState } from 'react';
import { chatDataWithHmsType } from './chatList';
import classes from './Chat.module.css';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useRouter } from 'next/router';

async function kickUser(userId: string, chatId: string): Promise<string> {
  const res = await fetch(`/api/kick/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId,
    }),
  }).then((res) => res.json());

  return res;
}

function Chat({
  index,
  chatData,
}: {
  index: string;
  chatData: chatDataWithHmsType;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const showTooltip = !(
    chatData.SenderId === session?.user?.email ||
    chatData.SenderId === '[system]'
  );

  const queryClient = useQueryClient();
  const { mutate: mutateKick } = useMutation<
    unknown,
    unknown,
    { userId: string; chatId: string },
    unknown
  >(({ userId, chatId }) => kickUser(userId, chatId), {
    onSuccess: () => {
      // Invalidate and refetch?????
    },
  });

  return (
    <div
      className={`${classes.chatItem} ${
        chatData.SenderId !== session?.user?.email ? classes.otherUser : ''
      }`}
      key={`${index}`}
    >
      <div className={classes.chatProfile}>
        <div
          className={classes.profileImageContainer}
          onMouseEnter={() => setIsTooltipVisible(true)}
          onMouseLeave={() => setIsTooltipVisible(false)}
        >
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
          {isTooltipVisible && showTooltip && (
            <div className={classes.tooltip}>
              <div
                className={`${classes.tooltipContent} ${
                  chatData.SenderId !== session?.user?.email
                    ? classes.otherUser
                    : ''
                }`}
              >
                <div
                  className={classes.kick}
                  onClick={() => {
                    mutateKick({
                      userId: chatData.SenderId,
                      chatId: chatData.chatId,
                    });
                  }}
                >
                  강퇴하기
                </div>
                <div className={classes.mute}>채팅금지</div>
              </div>
            </div>
          )}
        </div>
      </div>
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
