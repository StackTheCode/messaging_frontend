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
    <div className="w-1/4 bg-white border-r border-gray-300 flex flex-col h-full">
      <h3 className="p-4 text-lg font-bold border-b border-gray-300 flex-shrink-0">Users</h3>

      <div className="p-4 border-b border-gray-300">
        <input 
          type="text"
          placeholder="Search users"
          value={searchQuery}
          onChange={(e) => { onSearchChange(e.target.value); }}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      <ul className="flex-1 overflow-y-auto">
        {users.length > 0 ? ( // Added check for users.length
          filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedUser?.id === user.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
            >
              {user.username}
            </li>
          ))
        ) : (
          <li className="p-4 text-gray-500 text-center">No users found.</li> // Message if no users
        )}
      </ul>

      {loggedInUser && (
        <div className="p-4 bg-gray-50 border-t border-gray-300 shadow-md flex-shrink-0 relative" ref={logoutMenuRef}> {/* Added relative and ref */}
          <div 
            className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setLogoutMenuOpen(!logoutMenuOpen)} // Clickable card to toggle menu
          >
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-semibold">
                {loggedInUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-700">Logged in as:</p>
              <p className="font-semibold text-gray-900">{loggedInUser.username}</p>
            </div>
            {/* Optional: Add a small caret icon here to indicate dropdown */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Logout Dropdown Menu */}
          {logoutMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10"> {/* Positioned above the card */}
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
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
