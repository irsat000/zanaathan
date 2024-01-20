import { UserNotification } from "@/context/notificationsContext";
import React, { useEffect } from "react";
import notificationTypes from '@/assets/site/notificationTypes.json'
import { apiUrl } from "@/lib/utils/helperUtils";
import { fetchJwt } from "@/lib/utils/userUtils";
import { useUser } from "@/context/userContext";


export const Notifications: React.FC<{
    notificationBoxActive: boolean,
    notifications: UserNotification[] | null,
    setNotifications: React.Dispatch<React.SetStateAction<UserNotification[] | null>>,
    setActiveNotificationIndex: React.Dispatch<React.SetStateAction<number | null>>
}> = ({ notificationBoxActive, notifications, setNotifications, setActiveNotificationIndex }) => {
    // User context
    const { userData } = useUser();

    // Fetch notifications
    const fetchNotifications = () => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;
        // Get the user's notifications
        fetch(`${apiUrl}/get-notifications`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            },
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                const sanitizedNotifications: UserNotification[] = data.notifications.map((not: any) =>
                ({
                    id: not.Id,
                    type: not.NotificationTypeId.toString() as keyof typeof notificationTypes,
                    isSeen: not.IsSeen,
                    extra: {
                        postId: not.PostId,
                        postTitle: not.PostTitle,
                        postCreatedAt: not.PostCreatedAt.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
                    }
                } as UserNotification));
                setNotifications(sanitizedNotifications);
            })
            .catch(res => {
                console.log("Couldn't fetch messages");
            });
    };
    // Fetch notifications once for the entire session
    // Optional TODO: If user wants, they can click on a refresh button and run fetchNotifications() freely
    useEffect(() => {
        // Only if notifications are not fetched before
        if (!userData || notifications !== null) return;
        fetchNotifications();
    }, [userData]);

    // Fetch notifications
    const updateNotificationSeen = async (notificationId: number): Promise<boolean> => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return false;
        // Get the user's notifications
        return await fetch(`${apiUrl}/notification-seen/${notificationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            },
        })
            .then(res => res.ok ? true : Promise.reject(res))
            .catch(err => {
                console.log("Failed to set notification seen");
                return false;
            });
    };

    return (
        <div className={`notification-container ${notificationBoxActive ? 'active' : ''}`}>
            <h3 className='notification-box-header'>Bildirimler</h3>
            {notifications && notifications.length > 0 ? notifications.map((not, index) =>
                <div className='notification-item' key={index} onClick={() => {
                    // Reveal notification content
                    setActiveNotificationIndex(index);
                    if (!not.isSeen) {
                        // Update seen status on the server
                        updateNotificationSeen(not.id).then(success => {
                            if (success) {
                                // Update seen status on the client
                                const updated = [...notifications];
                                updated[index].isSeen = true;
                                setNotifications(updated);
                            }
                        })
                    }
                }}>
                    <span className={`unread ${not.isSeen ? '' : 'active'}`}></span>
                    <div className="notification-details">
                        <h4>{notificationTypes[not.type].title}</h4>
                        <p>{notificationTypes[not.type].description}</p>
                    </div>
                </div>
            ) : <div className="no-notification">Bildirim kutunuz boş.</div>}
        </div>
    )
};