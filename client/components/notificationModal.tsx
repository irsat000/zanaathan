import { UserNotification } from '@/context/notificationsContext';
import { apiUrl, formatDateString, toShortLocal } from '@/lib/utils/helperUtils';
import Link from 'next/link';
import { useRef, useState } from 'react'
import { XLg } from 'react-bootstrap-icons';


const NotificationModal: React.FC<{
    activeNotificationIndex: number | null,
    setActiveNotificationIndex: React.Dispatch<React.SetStateAction<number | null>>,
    notification: UserNotification
}> = ({ activeNotificationIndex, setActiveNotificationIndex, notification }) => {
    // On and off auth modal by value
    const closeModal = () => {
        setActiveNotificationIndex(null);
    };

    return (
        <div className={`notification-modal-container modal-container ${activeNotificationIndex !== null ? 'active' : ''}`} onMouseDown={closeModal}>
            <div className='notification-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-modal-button' onClick={closeModal}><XLg /></button>
                <div className="notification-content">
                    {notification.type === 'postExpiration' ?
                        <>
                            <div className="post-expiration-question">
                                <p>{notification.extra.postCreatedAt} tarihinde oluşturduğunuz</p>
                                <h4>{notification.extra.postTitle}</h4>
                                <p>başlıklı gönderi tamamlandı mı, yoksa hâlâ cevap mı bekliyor? İşlem yapmadığınız takdirde bir hafta daha yayında kalıp sonrasında tamamlandı olarak ayarlanacaktır.</p>
                            </div>
                            <div className="post-expiration-actions">
                                <button type="button" className='negative'>Cevap bekliyor</button>
                                <button type="button" className='positive'>Tamamlandı</button>
                            </div>
                        </>
                        : <></>
                    }
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;