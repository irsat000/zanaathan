import { useUser } from '@/context/userContext';
import { useGStatus } from '@/context/globalContext';
import { XLg } from 'react-bootstrap-icons';
import React, { useState } from 'react';
import { fetchJwt } from '@/lib/utils/userUtils';
import { apiUrl } from '@/lib/utils/helperUtils';


const AdminModal: React.FC<{
    adminModalActive: string,
    setAdminModalActive: React.Dispatch<React.SetStateAction<string>>,
    args: any
}> = ({ adminModalActive, setAdminModalActive, args }) => {
    // User context
    const { userData } = useUser();

    // Arguments for post details panel
    const [postDetailsArgs, setPostDetailsArgs] = useState({
        action: '0',
        optionalBan: '0'
    })
    // Update
    const handlePostDetailsArgsChange = (e: any) => {
        const { name, value } = e.target
        setPostDetailsArgs((prevData: any) => ({
            ...prevData,
            [name]: value
        }))
    }

    const handleSetPostStatus = () => {
        // 0 return - 1 delete - 2 complete
        if (!['1', '2'].includes(postDetailsArgs.action)) return
        // Check jwt
        const jwt = fetchJwt()
        if (!jwt) return

        // Update post from one flexible end point
        const action = postDetailsArgs.action === '1' ? 'delete' : 'complete'
        fetch(`${apiUrl}/panel/update-post/${action}/${args.postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            },
            body: postDetailsArgs.optionalBan !== '0' ? JSON.stringify({
                banDuration: postDetailsArgs.optionalBan
            }) : undefined
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                if (postDetailsArgs.action === '1') {
                    if (postDetailsArgs.optionalBan !== '0') {
                        alert('Bu gönderi ve uzantıları silindi. Kullanıcı yasaklandı ve varsa onay bekleyen gönderileri reddedildi.')
                    } else {
                        alert('Bu gönderi ve uzantıları silindi.')
                    }
                } else if (postDetailsArgs.action === '2') {
                    alert('Bu gönderi tamamlandı olarak ayarlandı.')
                }
            })
            .catch(err => alert('Hata oluştu!'))
    }

    return (
        <div className={`admin-modal-container modal-container ${adminModalActive !== 'none' ? 'active' : ''}`} onMouseDown={() => setAdminModalActive('none')}>
            <div className='admin-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-modal-button' onClick={() => setAdminModalActive('none')}><XLg /></button>
                {adminModalActive === 'post-details' ? <>
                    <div className="post-action">
                        <div className="post-action-options">
                            <select name='action' value={postDetailsArgs.action} onChange={handlePostDetailsArgsChange}>
                                <option value="0">İşlem</option>
                                <option value="1">Sil</option>
                                <option value="2">Tamamlandı</option>
                            </select>
                            <select
                                name="optionalBan"
                                value={postDetailsArgs.optionalBan}
                                onChange={(e) => {
                                    handlePostDetailsArgsChange(e.target.value)
                                }}
                            >
                                <option value="0">Kullanıcıyı Yasakla?</option>
                                <option value="1">1 gün</option>
                                <option value="7">7 gün</option>
                                <option value="30">1 ay</option>
                                <option value="90">3 ay</option>
                                <option value="9999">Süresiz</option>
                            </select>
                        </div>
                        <button type="button" onClick={handleSetPostStatus}>Kaydet</button>
                    </div>
                </> : <></>}
            </div>
        </div>
    );
}

export default AdminModal;