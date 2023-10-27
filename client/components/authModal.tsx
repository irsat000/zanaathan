import { useUser } from '@/context/userContext';
import { decodedJwt, storeJwt } from '@/utils/userUtils';
import Link from 'next/link';
import { useContext, useState } from 'react'
import { XLg } from 'react-bootstrap-icons';

const AuthModal: React.FC<{
    authModalActive: string,
    setAuthModalActive: (v: string) => void
}> = ({ authModalActive, setAuthModalActive }) => {
    const { setUserData } = useUser();

    const [authModalWarning, setAuthModalWarning] = useState<string | null>(null);
    const [authModalSuccess, setAuthModalSuccess] = useState<string | null>(null);

    const [loginFormData, setLoginFormData] = useState({
        username: '',
        password: ''
    });

    const [registerFormData, setRegisterFormData] = useState({
        email: '',
        username: '',
        password: '',
        fullName: ''
    });

    const handleAuthModal = (state: string) => {
        setAuthModalWarning(null);
        setAuthModalSuccess(null);
        setAuthModalActive(state);
    }

    const handleLoginFormChange = (e: any) => {
        const { name, value } = e.target;
        setLoginFormData((prevData: any) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleRegisterFormChange = (e: any) => {
        const { name, value } = e.target;
        setRegisterFormData((prevData: any) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleLoginFormSubmit = async (e: any) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/sign-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(loginFormData)
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                storeJwt(data.JWT);
                setUserData(decodedJwt(data.JWT));
                setAuthModalWarning(null);
                setAuthModalSuccess('Giriş başarılı!');
                setTimeout(() => {
                    handleAuthModal('none');
                }, 1000);
            })
            .catch((res) => {
                if ([400, 401, 404].includes(res.status)) setAuthModalWarning('*Kullanıcı adı veya şifre hatalı*');
                else console.log('Sunucuyla bağlantıda hata')
            });
    }

    const handleRegisterFormSubmit = async (e: any) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/sign-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(registerFormData)
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                storeJwt(data.JWT);
                setUserData(decodedJwt(data.JWT));
                setAuthModalWarning(null);
                setAuthModalSuccess('Kayıt başarılı!');
                setTimeout(() => {
                    handleAuthModal('none');
                }, 1000);
            })
            .catch((res) => {
                if (res.status === 400) setAuthModalWarning('*Form bilgileri yetersiz*');
                else if (res.status === 409) setAuthModalWarning('Bu kullanıcı adı ya da eposta kullanılıyor');
                else console.log('Sunucuyla bağlantıda hata')
            });
    }

    return (
        <div className={`auth-modal-container ${authModalActive !== 'none' && 'active'}`} onMouseDown={() => handleAuthModal('none')}>
            <div className='auth-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-auth-modal-button' onClick={() => handleAuthModal('none')}><XLg /></button>
                <div className="auth-tab-buttons">
                    <span className={`login-tab-button ${authModalActive === 'signin' ? 'active' : 'inactive'}`}
                        onClick={() => handleAuthModal('signin')}>Giriş Yap</span>
                    <span className={`register-tab-button ${authModalActive === 'signup' ? 'active' : 'inactive'}`}
                        onClick={() => handleAuthModal('signup')}>Kayıt Ol</span>
                </div>
                <form className={`login-form ${authModalActive === 'signin' && 'active'}`} onSubmit={handleLoginFormSubmit}>
                    <input type='text' placeholder='Kullanıcı Adı' className='form-input' name='username' onChange={handleLoginFormChange} />
                    <input type='password' placeholder='Şifre' className='form-input' name='password' onChange={handleLoginFormChange} />
                    <div className="login-button-container">
                        <button type='submit' className='submit-button'>Giriş</button>
                        <Link href={'/'}>Unuttum</Link>
                    </div>
                </form>
                <form className={`register-form ${authModalActive === 'signup' && 'active'}`} onSubmit={handleRegisterFormSubmit}>
                    <input type='text' placeholder='E-Posta' className='form-input' name='email' onChange={handleRegisterFormChange} />
                    <input type='text' placeholder='Kullanıcı Adı' className='form-input' name='username' onChange={handleRegisterFormChange} />
                    <input type='password' placeholder='Şifre' className='form-input' name='password' onChange={handleRegisterFormChange} />
                    <input type='text' placeholder='İsim (isteğe bağlı)' className='form-input' name='fullName' onChange={handleRegisterFormChange} />
                    <div className="register-button-container">
                        <button type='submit' className='submit-button'>Kayıt ol</button>
                    </div>
                </form>
                {authModalSuccess ?
                    <span className='success-text'>{authModalSuccess}</span>
                    : authModalWarning &&
                    <span className='warning-text'>{authModalWarning}</span>
                }
                <span className='or-seperator'>Ya da</span>
                <button type='button' className='google-button-temp'>Google ile</button>
                <span className='line-seperator'></span>
                <span className='signup-instead'>Hesabın yok mu? <Link href={'/kayit'}>Kayıt ol</Link></span>
            </div>
        </div>
    );
}

export default AuthModal;