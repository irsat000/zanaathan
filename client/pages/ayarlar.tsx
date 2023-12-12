
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { Post } from './[category]';
import { decodedJwt, fetchJwt, storeJwt } from '@/lib/utils/userUtils';
import { acceptedImgSet_1, apiUrl, avatarLink, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils';
import { ChevronDown, XLg } from 'react-bootstrap-icons';
import { useGStatus } from '@/context/globalContext';


export default function Home() {
    // Get global context
    const { handleGStatus } = useGStatus();
    // Get user context
    const { userData, setUserData } = useUser();
    // User form
    const [userForm, setUserForm] = useState<{
        email: string;
        fullName: string | null;
        passwordOld: string;
        passwordNew: string;
        passwordNewRepeat: string;
    }>({
        email: '',
        fullName: '',
        passwordOld: '',
        passwordNew: '',
        passwordNewRepeat: ''
    });
    // Initialize form with userContext
    useEffect(() => {
        if (!userData) return;
        setUserForm({
            email: userData.email,
            fullName: userData.fullName,
            passwordOld: '',
            passwordNew: '',
            passwordNewRepeat: ''
        })
    }, [userData])
    // Handle changes of the inputs
    const handleFormChange = (e: any) => {
        setUserForm({
            ...userForm,
            [e.target.name]: e.target.value
        });
    }
    // Hide or show new password section
    const [pwChangeActive, setPwChangeActive] = useState(false);

    // Save the new user information
    const handleSubmit = () => {
        // Todo: validation

        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;

        fetch(`${apiUrl}/edit-profile`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify(userForm)
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                // store jwt in cookies
                storeJwt(data.JWT);
                // set user data in user context
                setUserData(decodedJwt(data.JWT));
                // Inform
                handleGStatus('informationModal', {
                    type: 'success',
                    text: 'Kayıt başarılı!'
                })
            })
            .catch((res) => {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Kayıt başarısız!'
                })
            });
    }

    // Function for submitting avatar
    const handleAvatarSubmit = (file: File | null) => {
        if (!file || !acceptedImgSet_1.includes(file.type)) {
            handleGStatus('informationModal', {
                type: 'error',
                text: 'Desteklenmeyen dosya biçimi!'
            })
            return;
        } else if (file.size > 1024 * 1024 * 10) {
            handleGStatus('informationModal', {
                type: 'error',
                text: '10 MB altı fotoğraf yüklenebilir.'
            })
            return;
        }
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;
        // Get image
        const avatarForm = new FormData();
        avatarForm.append('image', file);

        fetch(`${apiUrl}/set-new-avatar`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${jwt}`
            },
            body: avatarForm
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                // store jwt in cookies
                storeJwt(data.JWT);
                // set user data in user context
                setUserData(decodedJwt(data.JWT));
            })
            .catch((res) => {
                let errorMessage = 'Profil fotoğrafı değiştirilemedi, bağlantıda hata olabilir.'
                if (res.status === 413) {
                    errorMessage = `Fotoğraf çok büyük. İşlenmiş fotoğraf boyutu en fazla 3 MB olabilir.`
                } else if (res.status === 401) {
                    // For expired jwt
                    errorMessage = `Giriş yapmanız gerekmektedir.`
                }
                handleGStatus('informationModal', {
                    type: 'error',
                    text: errorMessage
                })
            });
    }

    // Delete avatar from validation modal
    const handleDeleteAvatar = () => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;

        fetch(`${apiUrl}/delete-avatar`, {
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${jwt}`
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                // store jwt in cookies
                storeJwt(data.JWT);
                // set user data in user context
                setUserData(decodedJwt(data.JWT));
                // close validation modal
                setValidateAvatarDeleteModalActive(false);
            })
            .catch((res) => {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Profile fotoğrafı silinemedi!'
                })
            });
    }

    // Avatar deletion validation modal state
    const [validateAvatarDeleteModalActive, setValidateAvatarDeleteModalActive] = useState(false);

    return (
        <Template>
            {userData ?
                <div className='settings-page'>
                    <div className={`validate-modal-container modal-container ${validateAvatarDeleteModalActive ? 'active' : ''}`}
                        onClick={() => setValidateAvatarDeleteModalActive(false)}
                    >
                        <div className={`validate-modal`} onClick={(e) => e.stopPropagation()}>
                            <button
                                type='button'
                                className='close-modal-button'
                                onClick={() => setValidateAvatarDeleteModalActive(false)}><XLg /></button>
                            <span>Profil fotoğrafınızı silmek istediğinizden emin misiniz?</span>
                            <div className="validate-button-container">
                                <button
                                    className='cancel'
                                    onClick={() => { setValidateAvatarDeleteModalActive(false) }}>İptal</button>
                                <button className='validate' onClick={handleDeleteAvatar}>Sil</button>
                            </div>
                        </div>
                    </div>
                    <div className='settings-body'>
                        <h2>Profil ayarları</h2>
                        <div className='profile-form' onSubmit={handleSubmit}>
                            <div className="set-avatar">
                                <div className="avatar-wrapper">
                                    {userData.avatar ?
                                        <Image
                                            loader={() => avatarLink(userData.avatar!)}
                                            src={avatarLink(userData.avatar)}
                                            alt={'Profil fotoğrafı'}
                                            width={0}
                                            height={0}
                                        /> :
                                        <Image
                                            src={require('@/assets/site/image-not-found.webp')}
                                            alt={'Profil fotoğrafı yok'}
                                            width={0}
                                            height={0}
                                            className='no-image'
                                        />
                                    }
                                </div>
                                <div className="change-avatar-buttons">
                                    <label>
                                        <input
                                            type='file'
                                            className='new-avatar-input'
                                            accept="image/*"
                                            onClick={(e) => {
                                                // Reset to trigger onChange properly
                                                const targetInput = e.target as HTMLInputElement
                                                targetInput.value = ''
                                            }}
                                            onChange={(e) => {
                                                // Get file and submit or give error if it's not image
                                                const file = e.target.files ? e.target.files[0] : null
                                                handleAvatarSubmit(file)
                                            }}
                                        />
                                        <span className="change">Değiştir</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="delete"
                                        onClick={() => {
                                            if (userData.avatar) {
                                                setValidateAvatarDeleteModalActive(true)
                                            }
                                        }}>Sil</button>
                                </div>
                            </div>
                            <div className="set-name-container">
                                <div className="input-wrapper">
                                    <span>Adınız</span>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={userForm.fullName ?? ''}
                                        onChange={handleFormChange}
                                        placeholder='Görünecek ad'
                                    />
                                </div>
                                <div className="input-wrapper">
                                    <span>Kullanıcı Adı</span>
                                    <input type="text" name="username" disabled={true} value={userData.username} />
                                </div>
                            </div>
                            <div className="input-wrapper">
                                <span>E-Posta</span>
                                <input
                                    type="text"
                                    name="email"
                                    placeholder='...'
                                    value={userForm.email}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="set-new-password-container">
                                <button type="button" onClick={() => setPwChangeActive(!pwChangeActive)}>Şifre değiştir</button>
                                <div className={`new-password-wrapper ${pwChangeActive ? 'active' : ''}`}>
                                    <div className="input-wrapper">
                                        <span>Eski Şifre</span>
                                        <input
                                            type="password"
                                            name="passwordOld"
                                            value={userForm.passwordOld}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <span>Şifre</span>
                                        <input
                                            type="password"
                                            name="passwordNew"
                                            value={userForm.passwordNew}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <span>Şifre Tekrar</span>
                                        <input
                                            type="password"
                                            name="passwordNewRepeat"
                                            value={userForm.passwordNewRepeat}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="submit-container">
                                <button type="button" onClick={handleSubmit}>Kaydet</button>
                            </div>
                        </div>
                    </div>
                </div>
                : <></>}
        </Template>
    )
}
