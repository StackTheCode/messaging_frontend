import type { UserListProps } from "../types/types";

export const UserList: React.FC<UserListProps> = ({ users, selectedUser, onSelectUser, currentUser }) => {
  const loggedInUser = users.find(user => user.id === currentUser);
  const filteredUsers = users.filter(user => user.id !== currentUser);

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1); 
  };

 return (
  <div className="h-screen w-1/4 bg-white border-r border-gray-300  flex flex-col">
      <h3 className="p-4 text-lg font-bold border-b border-gray-300 flex-shrink-0">Users</h3>

      {/* This div will grow and push the card to the bottom */}
      <div className="flex-1 overflow-y-auto">
        <ul>
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                selectedUser?.id === user.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              }`}
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>

      {/* This card is now a normal child of the flex container */}
      {loggedInUser && (
        <div className="p-4 bg-gray-50 border-t border-gray-300 shadow-md flex-shrink-0">
          <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white text-sm font-semibold">
                {loggedInUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-700">Logged in as:</p>
              <p className="font-semibold text-gray-900">{loggedInUser.username}</p>
            </div>
          </div>
        </div>
      )}
    </div>
);


};
