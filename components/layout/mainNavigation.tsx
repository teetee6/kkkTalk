import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

import classes from './mainNavigation.module.css';
import { useState } from 'react';
import Profile from '../profile/profile';

function MainNavigation() {
  const { data, status } = useSession();
  const [showProfileModal, setShowProfileModal] = useState(false);

  function logoutHandler() {
    signOut({ callbackUrl: '/' });
  }

  return (
    <header className={classes.header}>
      <div className={classes.logo}>
        <Link href="/">KKKTalk</Link>
      </div>

      <nav>
        <ul>
          {!data && status === 'unauthenticated' && (
            <li>
              <Link href="/signIn">Login</Link>
            </li>
          )}
          {data && status === 'authenticated' && (
            <li>
              <Link href="/chat/-1">Chat</Link>
            </li>
          )}
          {data && status === 'authenticated' && (
            <li
              onClick={() => {
                setShowProfileModal((prev) => !prev);
              }}
            >
              Profile
            </li>
          )}
          {data && status === 'authenticated' && (
            <li>
              <button onClick={logoutHandler}>Logout</button>
            </li>
          )}
          {data && status === 'authenticated' && (
            <Profile
              showProfileModal={showProfileModal}
              setShowProfileModal={setShowProfileModal}
            />
          )}
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
