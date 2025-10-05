import { useRef, useState } from "react";
import type { UserListProps } from "../types/types";
import { MessageSquarePlus, Search, X } from "lucide-react";
export const UserList: React.FC<UserListProps> = ({ users,
  allUsers,
  selectedUser,
  onSelectUser,
  onSelectUserFromSearch,
  currentUser,
  currentUserData,
  searchQuery,
  onSearchChange,
  showNewMessageModal,
  setShowNewMessageModal,
  handleLogout }) => {
  const loggedInUser = currentUserData;

  const filteredUsers = users.filter(user => user.id !== currentUser);
  const [logoutMenuOpen, setLogoutMenuOpen] = useState(false); // New state for logout menu visibility
  const logoutMenuRef = useRef<HTMLDivElement>(null);

  const onLogout = () => {
    handleLogout()
    setLogoutMenuOpen(false)
  }
  return (
    <div className="bg-white/20 backdrop-blur-md flex flex-col h-full min-w-0 overflow-x-hidden relative">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/20 flex-shrink-0 flex items-center justify-between">
        <h3 className="text-lg font-light tracking-wide text-gray-700 truncate">Users</h3>
        <button
          onClick={() => setShowNewMessageModal(true)}
          className="p-2 hover:bg-white/30 rounded-lg transition-colors"
          title="New Message"
        >
          <MessageSquarePlus className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* User list */}
      <ul className="flex-1 overflow-y-auto min-w-0 overflow-x-hidden">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {

            const conversationUser = user as any; // Cast to access lastMessage properties

            const formatTimestamp = (timestamp?: string) => {
              if (!timestamp) return '';
              const date = new Date(timestamp);
              const now = new Date();
              const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

              if (diffInHours < 24) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              } else if (diffInHours < 168) {
                return date.toLocaleDateString('en-US', { weekday: 'short' });
              } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
            };

            const truncateMessage = (content?: string) => {
              if (!content) return '';
              return content.length > 30 ? content.substring(0, 30) + '...' : content;
            };

            return (
              <li
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={`relative p-4 cursor-pointer transition-all duration-300 font-light tracking-wide rounded-xl ${selectedUser?.id === user.id
                    ? "bg-white/40 backdrop-blur-md shadow-inner shadow-white/30 scale-[1.02]"
                    : "hover:bg-white/20"
                  }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center justify-center h-10 w-10 rounded-full text-white text-sm font-light transition-colors duration-300 ${selectedUser?.id === user.id
                          ? "bg-gray-700/90"
                          : "bg-gray-500/80"
                        }`}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`truncate transition-colors duration-300 font-medium ${selectedUser?.id === user.id
                            ? "text-gray-800"
                            : "text-gray-700"
                          }`}
                      >
                        {user.username}
                      </span>
                      {conversationUser.lastMessageTimestamp && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTimestamp(conversationUser.lastMessageTimestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {conversationUser.lastMessageContent && (
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {conversationUser.lastMessageSenderId === currentUser && (
                            <span className="text-gray-500">You: </span>
                          )}
                          {conversationUser.lastMessageType === 'FILE'
                            ? '📎 File'
                            : truncateMessage(conversationUser.lastMessageContent)}
                        </p>
                      )}
                      {conversationUser.unreadCount && conversationUser.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-1 flex-shrink-0">
                          {conversationUser.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        ) : (
          <li className="p-8 text-gray-500 font-light text-center">
            <MessageSquarePlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="mb-2">No conversations yet</p>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="px-4 py-2 bg-gray-600/80 text-white rounded-lg hover:bg-gray-700/90 transition-colors"
            >
              Start New Chat
            </button>
          </li>
        )}
      </ul>

      {/* Footer (logged in user) */}
      {loggedInUser && (
        <div
          className="px-4 py-3 bg-white/10 backdrop-blur-sm border-t border-white/20 flex-shrink-0 relative"
          ref={logoutMenuRef}
        >
          <div
            className="bg-white/20 backdrop-blur-sm p-3 border border-white/20 flex items-center space-x-3 cursor-pointer hover:bg-white/30 transition-all duration-300 min-w-0"
            onClick={() => setLogoutMenuOpen(!logoutMenuOpen)}
          >
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-gray-700/80 backdrop-blur-sm text-white text-sm font-light">
                {loggedInUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-light tracking-wide">
                Logged in as:
              </p>
              <p className="font-normal text-gray-700 truncate">
                {loggedInUser.username}
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 
                  10.586l3.293-3.293a1 1 0 
                  111.414 1.414l-4 4a1 1 0 
                  01-1.414 0l-4-4a1 1 0 
                  010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {logoutMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-black/5 z-10">
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/20 rounded-2xl font-light transition-all duration-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  onSearchChange('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  autoFocus
                />
              </div>
            </div>

            {/* All Users List */}
            <div className="flex-1 overflow-y-auto">
              {allUsers
                .filter(user => user.id !== currentUser)
                .map((user) => (
                  <div
                    key={user.id}
                    onClick={() => onSelectUserFromSearch(user)}
                    className="p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-500/80 flex items-center justify-center text-white font-light flex-shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{user.username}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              {allUsers.filter(user => user.id !== currentUser).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No users found' : 'Loading users...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );


};
