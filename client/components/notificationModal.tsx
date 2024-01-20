import { UserNotification } from '@/context/notificationsContext';
import notificationTypes from '@/assets/site/notificationTypes.json'
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

    // Get the notification's code for different types of content
    const notificationCode = notificationTypes[notification.type].code;

    return (
        <div className={`notification-modal-container modal-container ${activeNotificationIndex !== null ? 'active' : ''}`} onMouseDown={closeModal}>
            <div className='notification-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-modal-button' onClick={closeModal}><XLg /></button>
                <div className="notification-content">
                    {notificationCode === 'postExpiration' ?
                        <>
                            <div className="post-expiration-question">
                                <p>{notification.extra.postCreatedAt} tarihinde oluşturduğunuz</p>
                                <h4>{notification.extra.postTitle}</h4>
                                <p>başlıklı gönderi tamamlandı mı, yoksa hâlâ cevap mı bekliyor? İşlem yapmadığınız takdirde bir hafta daha yayında kalıp sonrasında "Tamamlandı" olarak değiştirilecektir. Bu işlemi profilinizden de istediğiniz zaman yapabilirsiniz.</p>
                            </div>
                            <div className="post-expiration-actions">
                                <button type="button" className='negative'>Hâlâ bekliyor</button>
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