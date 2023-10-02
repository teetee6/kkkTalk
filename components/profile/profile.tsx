import { useCallback } from 'react';
import { Modal } from '../modal/modal';

interface ProfileProps {
  showProfileModal: boolean;
  setShowProfileModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const Profile: React.FC<ProfileProps> = ({
  showProfileModal,
  setShowProfileModal,
}) => {
  const onCloseProfileModal = useCallback(() => {
    setShowProfileModal((prevProfileModal) => !prevProfileModal);
  }, [setShowProfileModal]);
  return (
    <Modal show={showProfileModal} onCloseModal={onCloseProfileModal}>
      <div className="profileModalContainer">
        <div className="profileModal">안녕하세요!</div>
      </div>
    </Modal>
  );
};

export default Profile;
