
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { Post } from './[category]';
import { fetchJwt } from '@/lib/utils/userUtils';
import { apiUrl, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils';
import { ChevronDown } from 'react-bootstrap-icons';


export default function Home() {
    // Get user context
    const { userData } = useUser();

    const [pwChangeActive, setPwChangeActive] = useState(false);

    return (
        <Template>
            {userData ?
                <div className='settings-page'>
                    <div className='settings-body'>
                        <h2>Profil ayarları</h2>
                        <form className='profile-form'>
                            <div className="set-avatar">
                                <div className="avatar-wrapper">
                                    <Image src={require('@/assets/site/user.png')} alt={'Profil fotoğrafı'} />
                                </div>
                                <div className="change-avatar-buttons">
                                    <button type="button" className="change">Değiştir</button>
                                    <button type="button" className="delete">Sil</button>
                                </div>
                            </div>
                            <div className="set-name-container">
                                <div className="input-wrapper">
                                    <span>Adınız</span>
                                    <input type="text" name="fullName" placeholder='...' />
                                </div>
                                <div className="input-wrapper">
                                    <span>Kullanıcı Adı</span>
                                    <input type="text" name="username" placeholder='...' disabled={true} />
                                </div>
                            </div>
                            <div className="input-wrapper">
                                <span>E-Posta</span>
                                <input type="text" name="email" placeholder='...' />
                            </div>
                            <div className="set-new-password-container">
                                <button type="button" onClick={() => setPwChangeActive(!pwChangeActive)}>Şifre değiştir</button>
                                <div className={`new-password-wrapper ${pwChangeActive ? 'active' : ''}`}>
                                    <div className="input-wrapper">
                                        <span>Eski Şifre</span>
                                        <input type="password" name="passwordOld" />
                                    </div>
                                    <div className="input-wrapper">
                                        <span>Şifre</span>
                                        <input type="password" name="passwordNew" />
                                    </div>
                                    <div className="input-wrapper">
                                        <span>Şifre Tekrar</span>
                                        <input type="password" name="passwordNewRepeat" />
                                    </div>
                                </div>
                            </div>
                            <div className="submit-container">
                                <button type="submit">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
                : <></>}
        </Template>
    )
}
