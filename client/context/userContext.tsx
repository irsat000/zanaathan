import React, { useContext, useState } from 'react';

/* DEPRECATED
export interface IUserData {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
}*/

/* Example;
    email: "aasf@gmail.com"
    exp: 1700076515069
    fullName: "İrşat Akdeniz" | null
    iat: 1699471715
    sub: 11    ---> id becomes sub in jwt
    username: "lala1"
*/

const UserData = React.createContext({} as any);

export const UserContext: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [userData, setUserData] = useState(null);

    return (
        <UserData.Provider value={{ userData, setUserData }}>
            {children}
        </UserData.Provider>
    );
}

export const useUser = () => {
    return useContext(UserData);
};