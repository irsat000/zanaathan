import { useUser } from '@/context/userContext';
import { useGStatus } from '@/context/globalContext';
import { XLg } from 'react-bootstrap-icons';
import React, { useState } from 'react';


const AdminModal: React.FC<{
    adminModalActive: string,
    setAdminModalActive: React.Dispatch<React.SetStateAction<string>>,
    args: any
}> = ({ adminModalActive, setAdminModalActive, args }) => {
    // User context
    const { userData } = useUser();

    // Arguments for post details panel
    const [postDetailsArgs, setPostDetailsArgs] = useState({
        action: '0'
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
        if (postDetailsArgs.action === '0') return
        alert(args.postId + ' - ' + postDetailsArgs.action)
    }

    return (
        <div className={`admin-modal-container modal-container ${adminModalActive !== 'none' ? 'active' : ''}`} onMouseDown={() => setAdminModalActive('none')}>
            <div className='admin-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-modal-button' onClick={() => setAdminModalActive('none')}><XLg /></button>
                {adminModalActive === 'post-details' ? <>
                    <div className="post-action">
                        <select name='action' value={postDetailsArgs.action} onChange={handlePostDetailsArgsChange}>
                            <option value="0">İşlem</option>
                            <option value="1">Sil</option>
                            <option value="2">Tamamlandı</option>
                        </select>
                        <button type="button" onClick={handleSetPostStatus}>Kaydet</button>
                    </div>
                </> : <></>}
            </div>
        </div>
    );
}

export default AdminModal;