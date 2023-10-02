import React, { useState, useEffect } from 'react';
import useValidation from '../../hooks/useValidation';
import { useRouter } from 'next/router';
import classes from './SignIn.module.css';
import { signIn } from 'next-auth/react';

function SignInForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const [
    onChangeEmail,
    onChangePassword,
    emailError,
    passwordError,
    handleValidation,
  ] = useValidation(setEmail, setPassword);

  const handleSignIn = async () => {
    const result = await signIn('credentials', {
      redirect: false,
      email: email,
      password: password,
    });

    if (!result!.error) {
      // set some auth state

      router.replace('/chat/-1');
    }
  };

  return (
    <div className={classes.signin_container}>
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
        onClick={handleSignIn}
        disabled={!handleValidation()}
      >
        로그인
      </button>
      <button
        className={classes.signup_button}
        onClick={() => router.replace('/signUp')}
      >
        회원가입하러 가기
      </button>
    </div>
  );
}

export default SignInForm;
