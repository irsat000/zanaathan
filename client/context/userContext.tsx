import React, { useContext, useState } from 'react';

/*
export interface IUserData {
    username: string;
    email: string;
    full_name: string | null;
}*/

export const UserData = React.createContext({} as any);

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