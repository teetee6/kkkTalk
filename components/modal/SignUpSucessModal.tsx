import { useCallback } from 'react';
import { Modal } from '../modal/modal';

interface SignUpSuccessModalProps {
  showSignUpSuccessModal: boolean;
  setShowSignUpSuccessModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const SignUpSuccessModal: React.FC<SignUpSuccessModalProps> = ({
  showSignUpSuccessModal,
  setShowSignUpSuccessModal,
}) => {
  const onCloseSignUpSuccessModal = useCallback(() => {
    setShowSignUpSuccessModal(
      (prevSignUpSuccessModalModal) => !prevSignUpSuccessModalModal
    );
  }, [setShowSignUpSuccessModal]);
  return (
    <Modal
      show={showSignUpSuccessModal}
      onCloseModal={onCloseSignUpSuccessModal}
    >
      <div className="SignUpSuccessModalModalContainer">
        <div className="SignUpSuccessModalModal">안녕하세요!</div>
      </div>
    </Modal>
  );
};

export default SignUpSuccessModal;
