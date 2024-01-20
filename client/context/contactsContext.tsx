import React, { useContext, useState } from 'react';

export interface UserContact {
    ReceiverId: number;
    LastMessage: string | null;
    LastMessageDate: string | null;
    ReceiverUsername: string;
    ReceiverFullName: string | null;
    ReceiverAvatar: string | null;
    IsBlocked: boolean;
    NotificationCount: number;
    CachedThread?: ThreadMessage[];
    ThreadHasMore?: boolean;
}

export interface ThreadMessage {
    Id: number;
    Body: string;
    SenderId: number;
    CreatedAt: string;
}

const ContactsContext = React.createContext
    <{
        userContacts: UserContact[] | null,
        setUserContacts: React.Dispatch<React.SetStateAction<UserContact[] | null>>
    }>({
        userContacts: null,
        setUserContacts: () => { },
    });

export const ContactsProvider: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [userContacts, setUserContacts] = useState<UserContact[] | null>(null);

    return (
        <ContactsContext.Provider value={{ userContacts, setUserContacts }}>
            {children}
        </ContactsContext.Provider>
    );
}

export const useContacts = () => {
    return useContext(ContactsContext);
};