import { useRef, useState } from "react";
import type { UserListProps } from "../types/types";
import { Search } from "lucide-react";
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
 <div className="bg-white/20 backdrop-blur-md flex flex-col h-full min-w-0 overflow-x-hidden">

  {/* Header */}
  <div className="px-4 py-3 border-b border-white/20 flex-shrink-0">
    <h3 className="text-lg font-light tracking-wide text-gray-700 truncate">Users</h3>
  </div>

  {/* Search */}
  <div className="px-4 py-3 border-b border-white/10">
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search users"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/30 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-200/30 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 font-light"
      />
    </div>
  </div>

  {/* User list */}
  <ul className="flex-1 overflow-y-auto min-w-0 overflow-x-hidden">
    {filteredUsers.length > 0 ? (
      filteredUsers.map((user) => (
       <li
  key={user.id}
  onClick={() => onSelectUser(user)}
  className={`relative p-4 cursor-pointer transition-all duration-300 font-light tracking-wide rounded-xl ${
    selectedUser?.id === user.id
      ? "bg-white/40 backdrop-blur-md shadow-inner shadow-white/30 scale-[1.02]"
      : "hover:bg-white/20"
  }`}
>
  <div className="flex items-center space-x-3 min-w-0">
    <div className="flex-shrink-0">
      <span
        className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-white text-sm font-light transition-colors duration-300 ${
          selectedUser?.id === user.id
            ? "bg-gray-700/90"
            : "bg-gray-500/80"
        }`}
      >
        {user.username.charAt(0).toUpperCase()}
      </span>
    </div>
    <span
      className={`truncate transition-colors duration-300 ${
        selectedUser?.id === user.id
          ? "text-gray-800 font-medium"
          : "text-gray-700"
      }`}
    >
      {user.username}
    </span>
  </div>
</li>
      ))
    ) : (
      <li className="p-4 text-gray-500 font-light text-center">No users found.</li>
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
</div>

  );


};
