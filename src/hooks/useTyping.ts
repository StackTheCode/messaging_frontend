import { useState, useRef, useCallback } from 'react';

export const useTyping = (
  onTypingStatusChange: (typing: boolean) => void
) => {
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const sendTypingStatus = useCallback((typing: boolean) => {
    onTypingStatusChange(typing);
  }, [onTypingStatusChange]);

  const handleInputChange = useCallback((value: string) => {
    // Only send typing status if there's actual content
    if (value.trim()) {
      sendTypingStatus(true);

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to stop typing after 1 second of inactivity
      const timeout = setTimeout(() => {
        sendTypingStatus(false);
      }, 1000);

      setTypingTimeout(timeout);
    } else {
      // If input is empty, stop typing immediately
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      sendTypingStatus(false);
    }
  }, [typingTimeout, sendTypingStatus]);

  const handleInputBlur = useCallback(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    sendTypingStatus(false);
  }, [typingTimeout, sendTypingStatus]);

  const clearTyping = useCallback(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    sendTypingStatus(false);
  }, [typingTimeout, sendTypingStatus]);

  return {
    handleInputChange,
    handleInputBlur,
    clearTyping,
  };
};