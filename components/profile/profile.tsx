import { useCallback } from 'react';
import { Modal } from '../modal/modal';
import Image from 'next/image';
import styles from './profile.module.css';
import { useMutation, useQuery, useQueryClient } from 'react-query';

interface ProfileProps {
  showProfileModal: boolean;
  setShowProfileModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const Profile: React.FC<ProfileProps> = ({
  showProfileModal,
  setShowProfileModal,
}) => {
  const queryClient = useQueryClient();

  const { data: profileImageData, isLoading: isLoadingProfileImage } =
    useQuery<string>(['profileImage'], async () => {
      const response = await fetch(`/api/profileImage`);
      const res = await response.json();
      if (!response.ok) {
        const error = new Error('not ok!');
        error.message = res.message;
        throw error;
      }
      return res;
    });

  const { mutate: mutateProfileImage } = useMutation<
    unknown,
    unknown,
    { formData: any },
    unknown
  >(
    async ({ formData }) => {
      const response = await fetch('/api/profileImage', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profileImage']);
      },
    }
  );
  const onCloseProfileModal = useCallback(() => {
    setShowProfileModal((prevProfileModal) => !prevProfileModal);
  }, [setShowProfileModal]);

  const onChangeFile = useCallback(
    (e: any) => {
      const formData = new FormData();
      if (e.target.files) {
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          formData.append('image', file);
        }
      }

      mutateProfileImage({ formData });
    },
    [mutateProfileImage]
  );

  if (isLoadingProfileImage) {
    return <p>Loading...</p>;
  }

  return (
    <Modal show={showProfileModal} onCloseModal={onCloseProfileModal}>
      <div className={styles.profileModalContainer}>
        <div>
          <Image
            className={styles.profileImage}
            alt="profileImage"
            width={30}
            height={30}
            src={`/api/${profileImageData}`}
          />
        </div>
        <label htmlFor="fileInput" className={styles.customFileUpload}>
          이미지 바꾸기
        </label>
        <input
          id="fileInput"
          className={styles.inputImage}
          type="file"
          onChange={onChangeFile}
        />
      </div>
    </Modal>
  );
};

export default Profile;
