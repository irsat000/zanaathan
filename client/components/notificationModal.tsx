import { UserNotification } from '@/context/notificationsContext';
import notificationTypes from '@/assets/site/notificationTypes.json'
import { XLg } from 'react-bootstrap-icons';
import { useGStatus } from '@/context/globalContext';
import { apiUrl } from '@/lib/utils/helperUtils';
import { fetchJwt } from '@/lib/utils/userUtils';
import { CurrentStatus } from '@/pages/profil';


const NotificationModal: React.FC<{
    activeNotificationIndex: number | null,
    setActiveNotificationIndex: React.Dispatch<React.SetStateAction<number | null>>,
    notification: UserNotification
}> = ({ activeNotificationIndex, setActiveNotificationIndex, notification }) => {
    // Use global context
    const { handleGStatus } = useGStatus();

    // On and off auth modal by value
    const closeModal = () => {
        setActiveNotificationIndex(null);
    };

    const updateStatus = (postId: number, value: CurrentStatus) => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;
        // Update
        fetch(`${apiUrl}/update-post-status/${postId}`, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + jwt
            },
            body: JSON.stringify({ newStatusId: value })
        })
            .then(res => {
                if (res.ok) {
                    // Close modal and congrats user
                    closeModal();
                    handleGStatus('informationModal', {
                        type: 'success',
                        text: 'Gönderiniz başarıyla güncellendi! Teşekkür ederiz.'
                    });
                }
                else Promise.reject(res);
            })
            .catch((err) => {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Gönderi güncellenemedi. Üzgünüz!'
                });
            });
    }

    const delayPostExpiration = (postId: number) => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;
        // Delay the expiration
        fetch(`${apiUrl}/delay-post-expiration/${postId}`, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + jwt
            }
        })
            .then(res => {
                if (res.ok) {
                    // Close modal and congrats user
                    closeModal();
                    handleGStatus('informationModal', {
                        type: 'success',
                        text: 'Bizi bilgilendirdiğiniz için teşekkür ederiz.'
                    });
                }
                else Promise.reject(res);
            })
            .catch((err) => {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Gönderi güncellenemedi. Üzgünüz!'
                });
            });
    }

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
                                <p>başlıklı gönderi tamamlandı mı, yoksa hâlâ cevap mı bekliyor? İşlem yapmadığınız takdirde bir hafta daha yayında kalıp sonrasında "Tamamlandı" olarak değiştirilecektir. Bu işlemi istediğiniz zaman profilinizden de yapabilirsiniz.</p>
                            </div>
                            <div className="post-expiration-actions">
                                <button type="button" className='negative' onClick={() => delayPostExpiration(notification.extra.postId!)}>Hâlâ bekliyor</button>
                                <button type="button" className='positive' onClick={() => updateStatus(notification.extra.postId!, 3)}>Tamamlandı</button>
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