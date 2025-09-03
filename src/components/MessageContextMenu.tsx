import React, { useEffect, useRef, useState } from "react";
import { type MessageContextMenuProps } from "../types/types"
import { TaskCreationModal } from "./TaskCreationModal";

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    message,
    position,
    onClose,
    isVisible,
    onDelete
}) => {
    const [showTaskModal, setShowTaskModal] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Only close if clicking outside context menu AND modal is not open
            if (
                isVisible &&
                !showTaskModal &&
                contextMenuRef.current &&
                !contextMenuRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showTaskModal) {
                    setShowTaskModal(false);
                } else if (isVisible) {
                    onClose();
                }
            }
        };

        // Only add event listeners if context menu is visible and modal is not open
        if (isVisible && !showTaskModal) {
            // Small delay to prevent race conditions
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
                document.addEventListener('keydown', handleEscapeKey);
            }, 50);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [isVisible, onClose, showTaskModal]);

    const handleMarkAsTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (message.pending) {
            // блокируем создание таска для неподтверждённых сообщений
            console.warn("⏳The message has not yet been sent to server, task can't be created");
            return;
        }
        setShowTaskModal(true);
        // Don't close the context menu immediately - let the modal handle it
    };

    const handleCopyMessage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(message.content);
            console.log('Message copied to clipboard');
        } catch (error) {
            console.error('Failed to copy message:', error);
        }
        onClose();
    };
    const handleDeleteMessage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (message.id) {
            
            onDelete(message.id); // ✅ calls parent’s delete handler
        } else {
            console.warn("Message has no ID, cannot delete");
        }
        onClose();
    };

    const handleTaskModalClose = () => {
        setShowTaskModal(false);
        onClose(); // Close the context menu when modal closes
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Context Menu */}
            <div
                ref={contextMenuRef}
                className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleMarkAsTask}
                    disabled={message.pending} // 🔑 кнопка неактивна для pending
                    className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm transition-colors
      ${message.pending
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-100"}`}
                >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5V3a2 2 0 012-2h2a2 2 0 012 2v2"
                        />
                    </svg>
                    Mark as Task
                </button>


                <button
                    onClick={handleCopyMessage}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm transition-colors"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2"
                        />
                    </svg>
                    Copy Message
                </button>

                <button
                    onClick={handleDeleteMessage}
                    disabled={!message.id} 
                    className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm transition-colors
      ${!message.id ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                    Delete Message
                </button>
            </div>

            {/* Task Creation Modal */}
            <TaskCreationModal
                modalRef={modalRef}
                isOpen={showTaskModal}
                onClose={handleTaskModalClose}
                message={message}
            />
        </>
    );
};