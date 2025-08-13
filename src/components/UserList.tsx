import { useRef, useState } from "react";
import type { UserListProps } from "../types/types";

export const UserList: React.FC<UserListProps> = ({ users, selectedUser,
   onSelectUser,
    currentUser,
     searchQuery,
      onSearchChange,
      handleLogout }) => {
  const loggedInUser = users.find(user => user.id === currentUser);
  const filteredUsers = users.filter(user => user.id !== currentUser);
    const [logoutMenuOpen, setLogoutMenuOpen] = useState(false); // New state for logout menu visibility
  const logoutMenuRef = useRef<HTMLDivElement>(null);

const onLogout = () =>{
  handleLogout()
  setLogoutMenuOpen(false)
}
  return (
    <div className="w-1/4 bg-white/20 backdrop-blur-md border-r border-white/20 flex flex-col h-full">
      <h3 className="p-4 text-lg font-light tracking-wide border-b border-white/20 flex-shrink-0 text-gray-700">Users</h3>

      <div className="p-4 border-b border-white/10">
        <input 
          type="text"
          placeholder="Search users"
          value={searchQuery}
          onChange={(e) => { onSearchChange(e.target.value); }}
          className="w-full p-3 border border-white/20 bg-white/30 backdrop-blur-sm   rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200/30
           focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 font-light" 
        />
      </div>

      <ul className="flex-1 overflow-y-auto">
        {users.length > 0 ? ( // Added check for users.length
          filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`p-4 cursor-pointer hover:bg-white/20 transition-all duration-300 font-light tracking-wide ${selectedUser?.id === user.id ? 'bg-white/30 border-l-2 border-gray-400/50' : ''}`}
            >
              {user.username}
            </li>
          ))
        ) : (
          <li className="p-4 text-gray-700 font-light text-center">No users found.</li> // Message if no users
        )}
      </ul>

      {loggedInUser && (
        <div className="p-4 bg-white/10 backdrop-blur-sm border-t border-white/20 flex-shrink-0 relative" ref={logoutMenuRef}> {/* Added relative and ref */}
          <div 
            className="bg-white/20 backdrop-blur-sm p-4 rounded-3xl border border-white/20 flex items-center space-x-3 cursor-pointer
             hover:bg-white/30 transition-all duration-300"
            onClick={() => setLogoutMenuOpen(!logoutMenuOpen)} // Clickable card to toggle menu
          >
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-gray-700/80 backdrop-blur-sm text-white text-sm font-light">
                {loggedInUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-light tracking-wide">Logged in as:</p>
              <p className="font-normal text-gray-700">{loggedInUser.username}</p>
            </div>
            {/* Optional: Add a small caret icon here to indicate dropdown */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Logout Dropdown Menu */}
          {logoutMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-black/5 z-10"> {/* Positioned above the card */}
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
    </div>
  );


};
