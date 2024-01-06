
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fetchJwt } from '@/lib/utils/userUtils';
import { PUser } from '../kullanicilar';
import { apiUrl, avatarLink, formatDateString } from '@/lib/utils/helperUtils';

const PUserEditModal: React.FC<{
    editedUser: PUser | undefined,
    setEditedUserId: React.Dispatch<React.SetStateAction<number | null>>,
    setUsers: React.Dispatch<React.SetStateAction<PUser[]>>
}> = ({ editedUser, setEditedUserId, setUsers }) => {

    const [selectedBanDuration, setSelectedBanDuration] = useState('');
    // Reset ban duration when a different user is selected
    useEffect(() => {
        setSelectedBanDuration('')
    }, [editedUser])

    // To ban user
    const handleBanUser = () => {
        // Check jwt
        const jwt = fetchJwt()
        if (!jwt || !editedUser) return

        fetch(`${apiUrl}/panel/ban-user/${editedUser.Id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            },
            body: JSON.stringify({
                banDuration: selectedBanDuration
            })
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setUsers(prev => {
                    return prev.map(user => {
                        if (user.Id === editedUser.Id) {
                            return { ...user, BanLiftDate: data.banLiftDate };
                        }
                        return user;
                    });
                })
            })
            .catch(err => alert('Hata oluştu!'))
    }

    // To lift user ban
    const handleBanLift = () => {
        // Check jwt
        const jwt = fetchJwt()
        if (!jwt || !editedUser) return

        fetch(`${apiUrl}/panel/lift-ban/${editedUser.Id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setUsers(prev => {
                    return prev.map(user => {
                        if (user.Id === editedUser.Id) {
                            return { ...user, BanLiftDate: null };
                        }
                        return user;
                    });
                })
            })
            .catch(err => alert('Hata oluştu!'))
    }

    return (
        <div className={`p-user-edit-modal-container modal-container ${editedUser ? 'active' : ''}`}
            onClick={() => setEditedUserId(null)}>
            <div className="p-user-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-avatar">
                    {editedUser?.Avatar
                        ? <Image
                            loader={() => avatarLink(editedUser.Avatar!)}
                            src={avatarLink(editedUser.Avatar)}
                            alt={'Profile fotoğrafı'}
                            priority={false}
                            unoptimized={true}
                            width={0}
                            height={0} />
                        : <img
                            src="/user.webp"
                            alt={'Profil fotoğrafı yok'} />}
                </div>
                <span className='name'>
                    {editedUser?.FullName
                        ? <><span>{editedUser.FullName}</span><span>({editedUser.Username})</span></>
                        : editedUser?.Username}
                </span>
                <span className='email'>{editedUser?.Email}</span>
                <div className="action-container">
                    {editedUser?.BanLiftDate ?
                        <div className="lift-ban-container">
                            <span>Bu kullanıcı yasaklı. ({formatDateString(editedUser.BanLiftDate)})</span>
                            <button type="button" onClick={handleBanLift}>Yasak kaldır</button>
                        </div>
                        : <></>}
                    <h5>Kullanıcıyı yasakla;</h5>
                    <div className="ban-container">
                        <input
                            name="banDuration"
                            placeholder='Kaç gün?'
                            value={selectedBanDuration}
                            onChange={(e) => {
                                // Allow only numbers
                                if (e.target.value.length === 0 || /^\d+$/.test(e.target.value)) {
                                    setSelectedBanDuration(e.target.value)
                                }
                            }}
                        />
                        <button type="button" onClick={handleBanUser}>Yasakla</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PUserEditModal;