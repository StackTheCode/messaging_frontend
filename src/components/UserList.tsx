import type { UserListProps } from "../types/types";

export const UserList: React.FC<UserListProps> = ({ users, selectedUser, onSelectUser, currentUser }) => {
  const filteredUsers = users.filter(user => user.id !== currentUser);
  const capitalizeFirstLetter = (str:string) =>{
if(!str) return '';
str.charAt(0).toUpperCase() +str.slice(1);
  }
  return (
    <div className="w-1/4 bg-white border-r border-gray-300">
      <h3 className="p-4 text-lg font-bold border-b border-gray-300">Users</h3>
      <ul className="overflow-y-auto">
        {filteredUsers.map(user => (
          <li
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedUser?.id === user.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}`}
          >
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
};