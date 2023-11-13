import React, { useContext, useState } from 'react';

export interface UserContact {
    ReceiverId: number;
    LastMessage: string | null;
    LastMessageDate: string | null;
    ReceiverAvatar: string | null;
    ReceiverFullName: string | null;
    ReceiverUsername: string;
    CachedThread: ThreadMessage[] | undefined;
}

export interface ThreadMessage {
    Id: number;
    Body: string;
    SenderId: number;
    CreatedAt: string;
}

const ContactsContext = React.createContext
    <{ userContacts: UserContact[], setUserContacts: React.Dispatch<React.SetStateAction<UserContact[]>> }>({
        userContacts: [],
        setUserContacts: () => { },
    });

export const ContactsProvider: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [userContacts, setUserContacts] = useState<UserContact[]>([]);

    return (
        <ContactsContext.Provider value={{ userContacts, setUserContacts }}>
            {children}
        </ContactsContext.Provider>
    );
}

export const useContacts = () => {
    return useContext(ContactsContext);
};