import { useState, useCallback } from 'react';

export const useImageModal = () => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  const openImageModal = useCallback((imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setImageModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setModalImageUrl('');
    setImageModalOpen(false);
  }, []);

  return {
    imageModalOpen,
    modalImageUrl,
    openImageModal,
    closeImageModal,
  };
};