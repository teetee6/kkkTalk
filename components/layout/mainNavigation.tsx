import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

import classes from './mainNavigation.module.css';
import { useRouter } from 'next/router';
import { disconnectFromDatabase } from '@/lib/db';

function MainNavigation() {
  const { data, status } = useSession();
  // const router = useRouter();

  function logoutHandler() {
    signOut();
  }

  // const handleClick = (e: any) => {
  //   e.preventDefault();
  //   router.replace('/chat');
  // };

  return (
    <header className={classes.header}>
      <Link href="/">
        <div className={classes.logo}>KKKTalk</div>
      </Link>
      <nav>
        <ul>
          {!data && status === 'unauthenticated' && (
            <li>
              <Link href="/auth">Login</Link>
            </li>
          )}
          {data && status === 'authenticated' && (
            <li>
              <Link href="/chat/-1">Chat</Link>
            </li>
          )}
          {data && status === 'authenticated' && (
            <li>
              <button onClick={logoutHandler}>Logout</button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default MainNavigation;
