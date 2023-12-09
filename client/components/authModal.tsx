import { useUser } from '@/context/userContext';
import { apiUrl } from '@/lib/utils/helperUtils';
import { decodedJwt, storeJwt } from '@/lib/utils/userUtils';
import Link from 'next/link';
import { useRef, useState } from 'react'
import { XLg } from 'react-bootstrap-icons';
import LoginWithGoogle from './loginWithGoogle';
import LoginWithFacebook from './loginWithFacebook';

export type AuthModalState = 'signin' | 'signup' | 'none';

const AuthModal: React.FC<{
    authModalActive: AuthModalState,
    setAuthModalActive: React.Dispatch<React.SetStateAction<AuthModalState>>
}> = ({ authModalActive, setAuthModalActive }) => {
    // Get user context
    const { setUserData } = useUser();
    // Auth modal - informing the user
    const [authModalWarning, setAuthModalWarning] = useState<string | null>(null);
    const [authModalSuccess, setAuthModalSuccess] = useState<string | null>(null);
    // Form data states
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

    // On and off auth modal by value
    const handleAuthModal = (state: AuthModalState) => {
        setAuthModalWarning(null);
        setAuthModalSuccess(null);
        setAuthModalActive(state);
    }

    // Update login form values
    const handleLoginFormChange = (e: any) => {
        const { name, value } = e.target;
        setLoginFormData((prevData: any) => ({
            ...prevData,
            [name]: value
        }));
    };

    // Update register form values
    const handleRegisterFormChange = (e: any) => {
        const { name, value } = e.target;
        setRegisterFormData((prevData: any) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleLoginFormSubmit = (e: any) => {
        e.preventDefault();
        fetch(`${apiUrl}/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(loginFormData)
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                // store jwt in cookies
                storeJwt(data.JWT);
                // set user data in user context
                setUserData(decodedJwt(data.JWT));
                // remove warning on modal if there is any
                setAuthModalWarning(null);
                // inform the user about successful login
                setAuthModalSuccess('Giriş başarılı!');
                // close modal after a second
                setTimeout(() => handleAuthModal('none'), 1000);
            })
            .catch((res) => {
                if ([400, 401, 404].includes(res.status)) setAuthModalWarning('*Kullanıcı adı veya şifre hatalı*');
                else setAuthModalWarning('*Bağlantıda hata*');
            });
    }

    const handleRegisterFormSubmit = (e: any) => {
        e.preventDefault();
        fetch(`${apiUrl}/sign-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(registerFormData)
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                // store jwt in cookies
                storeJwt(data.JWT);
                // set user data in user context
                setUserData(decodedJwt(data.JWT));
                // remove warning on modal if there is any
                setAuthModalWarning(null);
                // inform the user about successful register
                setAuthModalSuccess('Kayıt başarılı!');
                // close modal after a second
                setTimeout(() => handleAuthModal('none'), 1000);
            })
            .catch((res) => {
                if (res.status === 400) setAuthModalWarning('*Form bilgileri yetersiz*');
                else if (res.status === 409) setAuthModalWarning('Bu kullanıcı adı ya da eposta kullanılıyor');
                else setAuthModalWarning('*Bağlantıda hata*');
            });
    }

    return (
        <div className={`auth-modal-container modal-container ${authModalActive !== 'none' ? 'active' : ''}`} onMouseDown={() => handleAuthModal('none')}>
            <div className='auth-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-modal-button' onClick={() => handleAuthModal('none')}><XLg /></button>
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
                <div className="google-login-wrapper">
                    <LoginWithGoogle setAuthModalWarning={setAuthModalWarning} setAuthModalSuccess={setAuthModalSuccess} handleAuthModal={handleAuthModal} />
                </div>
                <div className="facebook-login-wrapper">
                    <LoginWithFacebook setAuthModalWarning={setAuthModalWarning} setAuthModalSuccess={setAuthModalSuccess} handleAuthModal={handleAuthModal} />
                </div>
                <span className='line-seperator'></span>
                <span className='signup-instead'>Hesabın yok mu? <Link href={'/kayit'}>Kayıt ol</Link></span>
            </div>
        </div>
    );
}

export default AuthModal;