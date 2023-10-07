import useValidation from '@/hooks/useValidation';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import classes from './SignUp.module.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function SignUpForm() {
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

  const handleSignUp = useCallback(async () => {
    if (handleValidation()) {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (response.status === 201) {
          toast.success('회원가입에 성공하였습니다.', {
            onClick() {
              router.replace('/signIn');
            },
            closeOnClick: true,
          });
        } else {
          response.json().then((data) => {
            toast.error(data.message, {
              closeOnClick: true,
            });
          });
        }
      } catch (error) {
        console.error('Error during signup:', error);
      }
    }
  }, [handleValidation, email, password, router]);

  return (
    <div className={classes.signup_container}>
      <ToastContainer limit={1} />
      <h2>회원가입</h2>
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
        className={classes.signup_button}
        data-testid="signup-button"
        onClick={handleSignUp}
        disabled={!handleValidation()}
      >
        회원가입
      </button>
      <button
        className={classes.login_link}
        onClick={() => router.replace('/signIn')}
      >
        로그인하러 가기
      </button>
    </div>
  );
}

export default SignUpForm;
