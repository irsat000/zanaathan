
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { Post } from './[category]';
import { decodedJwt, fetchJwt, storeJwt } from '@/lib/utils/userUtils';
import { acceptedImgSet_1, apiUrl, avatarLink, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils';
import { ChevronDown } from 'react-bootstrap-icons';


export default function Home() {
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
        if (!jwt) return null;

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
                alert('Kayıt başarılı!')
            })
            .catch((res) => {
                alert('Başarısız!')
            });
    }

    const handleAvatarSubmit = (file: File) => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return null;
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
                alert('Başarısız!')
            });
    }

    const handleDeleteAvatar = () => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return null;

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
            })
            .catch((res) => {
                alert('Başarısız!')
            });
    }

    return (
        <Template>
            {userData ?
                <div className='settings-page'>
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
                                            onChange={(e) => {
                                                const file = e.target.files ? e.target.files[0] : null
                                                if (file && acceptedImgSet_1.includes(file.type)) {
                                                    handleAvatarSubmit(file)
                                                } else {
                                                    alert('Desteklenmeyen dosya biçimi')
                                                }
                                            }}
                                        />
                                        <span className="change">Değiştir</span>
                                    </label>
                                    <button type="button" className="delete" onClick={handleDeleteAvatar}>Sil</button>
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
