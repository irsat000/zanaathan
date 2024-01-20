import { UserNotification } from "@/context/notificationsContext";
import React, { useRef } from "react";
import notificationTypes from '@/assets/site/notificationTypes.json'


// np = new post
export const Notifications: React.FC<{
    notificationBoxActive: boolean,
    notifications: UserNotification[] | null,
    setNotifications: React.Dispatch<React.SetStateAction<UserNotification[] | null>>,
    setActiveNotificationIndex: React.Dispatch<React.SetStateAction<number | null>>
}> = ({ notificationBoxActive, notifications, setNotifications, setActiveNotificationIndex }) => {

    return (
        <div className={`notification-container ${notificationBoxActive ? 'active' : ''}`}>
            <h3 className='notification-box-header'>Bildirimler</h3>
            {notifications && notifications.map((not, index) =>
                <div className='notification-item' key={index} onClick={() => {
                    // Reveal notification content
                    setActiveNotificationIndex(index);
                    // Update seen status if not seen
                    if (!not.isSeen) {
                        const updated = [...notifications];
                        updated[index].isSeen = true;
                        setNotifications(updated);
                    }
                }}>
                    <span className={`unread ${not.isSeen ? '' : 'active'}`}></span>
                    <div className="notification-details">
                        <h4>{notificationTypes[not.type].title}</h4>
                        <p>{notificationTypes[not.type].description}</p>
                    </div>
                </div>
            )}
        </div>
    )
};