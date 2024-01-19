import React, { useContext, useState } from 'react';


export type NotificationType = 'postExpiration';
export interface UserNotification {
    type: NotificationType,
    isSeen: boolean,
    extra: any
}


const NotificationsContext = React.createContext<{
    notifications: UserNotification[];
    setNotifications: React.Dispatch<React.SetStateAction<UserNotification[]>>;
}>({
    notifications: [
        {
            type: "postExpiration",
            isSeen: Math.random() > 0.5 ? true : false,
            extra: {
                postId: 1,
                postTitle: "Klimam bozuldu, soğutuyor ama ısıtmıyor.",
                postCreatedAt: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        },
        {
            type: "postExpiration",
            isSeen: Math.random() > 0.5 ? true : false,
            extra: {
                postId: 2,
                postTitle: "100 metrekare evime boya yapılacak.",
                postCreatedAt: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        },
        {
            type: "postExpiration",
            isSeen: Math.random() > 0.5 ? true : false,
            extra: {
                postId: 3,
                postTitle: "1. kattaki evime demir parmaklık takılacak.",
                postCreatedAt: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
            }
        }
    ],
    setNotifications: () => { },
});

export const UserContext: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);

    return (
        <NotificationsContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export const useNotifications = () => {
    return useContext(NotificationsContext);
};