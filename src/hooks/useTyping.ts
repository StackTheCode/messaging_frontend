import { useCallback, useRef } from 'react';

export const useTyping = (
  onTypingStatusChange: (typing: boolean) => void
) => {
  // Use useRef to track timeout and current status without causing re-renders
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastInputLengthRef = useRef(0);

  const sendTypingStatus = useCallback((typing: boolean) => {
    // Prevent sending duplicate typing status
    if (isTypingRef.current === typing) {
      return;
    }
    
    console.log('Sending typing status:', typing);
    isTypingRef.current = typing;
    onTypingStatusChange(typing);
  }, [onTypingStatusChange]);

  const clearCurrentTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const handleInputChange = useCallback((value: string) => {
    const currentLength = value.length;
    const previousLength = lastInputLengthRef.current;
    lastInputLengthRef.current = currentLength;

    // Clear any existing timeout first
    clearCurrentTimeout();

    if (currentLength > 0) {
      // Only send typing=true if user is actively adding content
      // and we're not already in typing state
      if (!isTypingRef.current) {
        sendTypingStatus(true);
      }

      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
        typingTimeoutRef.current = null;
      }, 2000); // Increased to 2 seconds for better UX
    } else {
      // If input is empty, stop typing immediately
      sendTypingStatus(false);
    }
  }, [sendTypingStatus, clearCurrentTimeout]);

  const handleInputBlur = useCallback(() => {
    // When user loses focus, stop typing after a short delay
    // This prevents immediate stop if they're just clicking elsewhere momentarily
    clearCurrentTimeout();
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
      typingTimeoutRef.current = null;
    }, 500); // 500ms delay on blur
  }, [sendTypingStatus, clearCurrentTimeout]);

  const clearTyping = useCallback(() => {
    clearCurrentTimeout();
    sendTypingStatus(false);
    lastInputLengthRef.current = 0;
  }, [sendTypingStatus, clearCurrentTimeout]);

  return {
    handleInputChange,
    handleInputBlur,
    clearTyping,
  };
};