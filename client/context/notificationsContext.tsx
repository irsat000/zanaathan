import React, { useContext, useState } from 'react';
import notificationTypes from '@/assets/site/notificationTypes.json'

export interface UserNotification {
    id: number,
    type: keyof typeof notificationTypes,
    isSeen: boolean,
    extra: {
        postId?: number,
        postTitle?: string,
        postCreatedAt?: string
    }
}


const NotificationsContext = React.createContext<{
    notifications: UserNotification[] | null;
    setNotifications: React.Dispatch<React.SetStateAction<UserNotification[] | null>>;
}>({
    notifications: null,
    setNotifications: () => { },
});

export const UserContext: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [notifications, setNotifications] = useState<UserNotification[] | null>(null);

    return (
        <NotificationsContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export const useNotifications = () => {
    return useContext(NotificationsContext);
};