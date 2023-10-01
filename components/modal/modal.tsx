import { useCallback } from 'react';
import classes from './modal.module.css';

export function Modal({
  children,
  onCloseModal,
  show,
}: {
  children: any;
  onCloseModal: any;
  show: any;
}) {
  const stopPropagation = useCallback((e: any) => {
    e.stopPropagation();
  }, []);

  if (!show) return null;

  return (
    <div className={classes.createModal} onClick={onCloseModal}>
      <div onClick={stopPropagation}>
        <button className={classes.closeModalButton} onClick={onCloseModal}>
          x
        </button>
        {children}
      </div>
    </div>
  );
}
