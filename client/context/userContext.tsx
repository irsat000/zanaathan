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
    sub: 11
    username: "lala1",
    avatar: "image.webp" | null
*/

export interface UserDataType {
    email: string;
    exp: number;
    fullName: string | null;
    sub: number;
    username: string;
    avatar: string | null;
    roles?: string[];
}

const UserData = React.createContext<{
    userData: UserDataType | null;
    setUserData: React.Dispatch<React.SetStateAction<UserDataType | null>>;
}>({
    userData: null,
    setUserData: () => { },
});

export const UserContext: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [userData, setUserData] = useState<UserDataType | null>(null);

    return (
        <UserData.Provider value={{ userData, setUserData }}>
            {children}
        </UserData.Provider>
    );
}

export const useUser = () => {
    return useContext(UserData);
};