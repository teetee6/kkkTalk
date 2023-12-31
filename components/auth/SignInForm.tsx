import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import useValidation from '../../hooks/useValidation';
import { useRouter } from 'next/router';
import classes from './SignIn.module.css';
import { signIn } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSocket from '@/hooks/useSocket';

function SignInForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();
  const [chat_socket, disconnect_chat_socket] = useSocket(
    '/api/socket/socketio'
  );

  const [
    onChangeEmail,
    onChangePassword,
    emailError,
    passwordError,
    handleValidation,
  ] = useValidation(setEmail, setPassword);

  const handleSignIn = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
      });

      if (!result!.error) {
        chat_socket?.emit('login', email);
        router.push('/chat/-1');
      } else {
        toast.error(result!.error, {
          closeOnClick: true,
        });
      }
    },
    [email, password, router, chat_socket]
  );

  return (
    <form onSubmit={handleSignIn} className={classes.signin_container}>
      <ToastContainer limit={1} />
      <h2>로그인</h2>
      <div className={classes.input_container}>
        <label>Email:</label>
        <input
          type="text"
          data-testid="email-input"
          value={email}
          onChange={onChangeEmail}
        />
        <p className={classes.error_message}>{emailError}</p>
      </div>
      <div className={classes.input_container}>
        <label>Password:</label>
        <input
          type="password"
          data-testid="password-input"
          value={password}
          onChange={onChangePassword}
        />
        <p className={classes.error_message}>{passwordError}</p>
      </div>
      <button
        className={classes.login_button}
        data-testid="signin-button"
        type="submit"
        disabled={!handleValidation()}
      >
        로그인
      </button>
      <button
        type="button"
        className={classes.signup_button}
        onClick={() => router.replace('/signUp')}
      >
        회원가입하러 가기
      </button>
    </form>
  );
}

export default SignInForm;
