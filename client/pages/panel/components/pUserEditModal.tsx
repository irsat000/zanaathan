
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fetchJwt } from '@/lib/utils/userUtils';
import { PUser } from '../kullanicilar';
import { apiUrl, avatarLink } from '@/lib/utils/helperUtils';

const PUserEditModal: React.FC<{
    userEditModalActive: boolean,
    setUserEditModalActive: React.Dispatch<React.SetStateAction<boolean>>,
    editedUser: PUser | null
}> = ({ userEditModalActive, setUserEditModalActive, editedUser }) => {

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
                alert('Kullanıcı yasaklandı.')
                setUserEditModalActive(false)
            })
            .catch(err => alert('Hata oluştu!'))
    }

    return (
        <div className={`p-user-edit-modal-container modal-container ${userEditModalActive ? 'active' : ''}`}
            onClick={() => setUserEditModalActive(false)}>
            <div className="p-user-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-avatar">
                    {editedUser?.Avatar
                        ? <Image
                            loader={() => avatarLink(editedUser.Avatar!)}
                            src={avatarLink(editedUser.Avatar)}
                            alt={'Profile fotoğrafı'}
                            priority={false}
                            width={0}
                            height={0} />
                        : <Image
                            src={require('@/assets/site/user.png')}
                            alt={'Profil fotoğrafı yok'}
                            width={0}
                            height={0} />}
                </div>
                <span className='name'>
                    {editedUser?.FullName
                        ? <><span>{editedUser.FullName}</span><span>({editedUser.Username})</span></>
                        : editedUser?.Username}
                </span>
                <span className='email'>{editedUser?.Email}</span>
                <div className="action-container">
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