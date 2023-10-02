import { useState } from 'react';

type ValidationHook = (
  setEmail: React.Dispatch<React.SetStateAction<string>>,
  setPassword: React.Dispatch<React.SetStateAction<string>>
) => [
  (e: React.ChangeEvent<HTMLInputElement>) => void,
  (e: React.ChangeEvent<HTMLInputElement>) => void,
  string,
  string,
  () => boolean,
];

const useValidation: ValidationHook = (setEmail, setPassword) => {
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  const validateEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailPattern.test(email);
    setEmailError(isValid ? ('' as any) : '유효한 이메일을 입력하세요.');
    return isValid;
  };

  const validatePassword = (password: string) => {
    const isValid = password.length >= 8;
    setPasswordError(
      isValid ? ('' as any) : '비밀번호는 8자 이상이어야 합니다.'
    );
    return isValid;
  };

  const handleValidation = () => {
    if (emailError === '' && passwordError === '') {
      return true;
    }
    return false;
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed_email = e.target.value;
    setEmail(typed_email);
    const validate_message = validateEmail(typed_email)
      ? ''
      : '이메일 형식이 올바르지 않습니다.';
    setEmailError(validate_message as any);
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed_password = e.target.value;
    setPassword(typed_password);
    const validate_message = validatePassword(typed_password)
      ? ''
      : '패스워드는 8자 이상이어야 합니다.';
    setPasswordError(validate_message as any);
  };

  return [
    onChangeEmail,
    onChangePassword,
    emailError,
    passwordError,
    handleValidation,
  ];
};

export default useValidation;
