import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

import classes from './mainNavigation.module.css';
import { useState } from 'react';
import Profile from '../profile/profile';
import SignUpSuccessModal from '../modal/SignUpSucessModal';

function MainNavigation() {
  const { data, status } = useSession();
  const [showProfileModal, setShowProfileModal] = useState(false);
  // const [showSignUpSucessModal, setShowSignUpSucessModal] = useState(false);

  function logoutHandler() {
    signOut({ callbackUrl: '/' });
  }

  return (
    <header className={classes.header}>
      <Link href="/">
        <div className={classes.logo}>KKKTalk</div>
      </Link>
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
          {/* {data && status === 'authenticated' && (
            <div
              onClick={() => {
                setShowProfileModal((prev) => !prev);
              }}
            >
              Profile
            </div>
          )} */}
          {data && status === 'authenticated' && (
            <li>
              <button onClick={logoutHandler}>Logout</button>
            </li>
          )}
        </ul>
        {data && status === 'authenticated' && (
          <Profile
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
          />
        )}
      </nav>
      {/** Main Modal */}
      {/* {
        <div
          onClick={() => {
            setShowSignUpSucessModal((prev) => !prev);
          }}
        >
          dddd
        </div>
      }
      <SignUpSuccessModal
        showSignUpSuccessModal={showSignUpSucessModal}
        setShowSignUpSuccessModal={setShowSignUpSucessModal}
      /> */}
    </header>
  );
}

export default MainNavigation;
