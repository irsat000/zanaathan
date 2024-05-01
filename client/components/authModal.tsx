import { useUser } from '@/context/userContext';
import { apiUrl, formatDateString, toShortLocal } from '@/lib/utils/helperUtils';
import { decodedJwt, storeJwt } from '@/lib/utils/userUtils';
import Link from 'next/link';
import { useRef, useState } from 'react'
import { XLg } from 'react-bootstrap-icons';
import LoginWithGoogle from './loginWithGoogle';
import LoginWithFacebook from './loginWithFacebook';
import { AuthModalState, useGStatus } from '@/context/globalContext';


const AuthModal = () => {
    // Use global context
    const { gStatus, handleGStatus } = useGStatus();
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
    const [registerFormExtra, setRegisterFormExtra] = useState({
        passwordRepeat: '',
        acceptLegal: false
    })

    // On and off auth modal by value
    const handleAuthModal = (state: AuthModalState) => {
        setAuthModalWarning(null);
        setAuthModalSuccess(null);
        handleGStatus('authModalActive', state);
    }

    // Update forms
    const handleFormChange = (e: any, form: string) => {
        const { name, value } = e.target;
        const setForm = form === 'login'
            ? setLoginFormData
            : form === 'register'
                ? setRegisterFormData
                : setRegisterFormExtra
        setForm((prevData: any) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleLoginFormSubmit = (e: any) => {
        e.preventDefault();
        // Don't send request upon small accidents
        if (loginFormData.username === ''
            || loginFormData.password === '') {
            return
        }
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
                else if (res.status === 403) {
                    res.json().then((data: any) => {
                        handleGStatus('informationModal', {
                            type: 'error',
                            text: 'Bu kullanıcı yasaklıdır. Yasak kalkma tarihi: ' + formatDateString(data.banLiftDate)
                        })
                        setAuthModalWarning('Yasaklı')
                    })
                }
                else setAuthModalWarning('Bağlantıda hata');
            });
    }

    const handleRegisterFormSubmit = (e: any) => {
        e.preventDefault();
        if (registerFormData.username.trim().length < 3
            || registerFormData.username.trim().length > 20
            || registerFormData.password.length < 5
            || registerFormData.password.length > 30) {
            handleGStatus('informationModal', {
                type: 'error',
                text: `Form geçersiz. Kurallar;<br /><ul>
                <li ${registerFormData.username.trim().length < 3
                        || registerFormData.username.trim().length > 20 ? 'class="fail"' : ''}>Kullanıcı adı 3-20 karakter arasında olmalıdır</li>
                <li ${registerFormData.password.length < 5
                        || registerFormData.password.length > 30 ? 'class="fail"' : ''}>Şifre 5-30 karakter arası olmalıdır</li></ul>`
            })
            setAuthModalWarning('Form bilgileri yetersiz')
            return
        }
        if (registerFormExtra.passwordRepeat !== registerFormData.password) {
            setAuthModalWarning('Şifreler uyuşmuyor')
            return
        }
        if (!registerFormExtra.acceptLegal) {
            setAuthModalWarning('Kullanım koşullarını onaylamadan kayıt olamazsınız')
            return
        }

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
                if (res.status === 400) setAuthModalWarning('Form bilgileri yetersiz');
                else if (res.status === 409) setAuthModalWarning('Bu kullanıcı adı ya da eposta kullanılıyor');
                else if (res.status === 429) setAuthModalWarning('Çok fazla istek gönderilemez, kısa bir süre bekleyin');
                else setAuthModalWarning('Bağlantıda hata');
            });
    }

    return (
        <div className={`auth-modal-container modal-container ${gStatus.authModalActive !== 'none' ? 'active' : ''}`} onMouseDown={() => handleAuthModal('none')}>
            <div className='auth-modal' onMouseDown={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-modal-button' onClick={() => handleAuthModal('none')}><XLg /></button>
                <div className="auth-tab-buttons">
                    <span className={`login-tab-button ${gStatus.authModalActive === 'signin' ? 'active' : 'inactive'}`}
                        onClick={() => handleAuthModal('signin')}>Giriş Yap</span>
                    <span className={`register-tab-button ${gStatus.authModalActive === 'signup' ? 'active' : 'inactive'}`}
                        onClick={() => handleAuthModal('signup')}>Kayıt Ol</span>
                </div>
                <form className={`login-form ${gStatus.authModalActive === 'signin' && 'active'}`} onSubmit={handleLoginFormSubmit}>
                    <input type='text' placeholder='Kullanıcı Adı' className='form-input' name='username' value={loginFormData.username} onChange={(e) => handleFormChange(e, 'login')} />
                    <input type='password' placeholder='Şifre' className='form-input' name='password' value={loginFormData.password} onChange={(e) => handleFormChange(e, 'login')} />
                    <div className="login-button-container">
                        <button type='submit' className='submit-button'>Giriş</button>
                        <Link href={'/'}>Unuttum</Link>
                    </div>
                </form>
                <form className={`register-form ${gStatus.authModalActive === 'signup' && 'active'}`} onSubmit={handleRegisterFormSubmit}>
                    <input type='text' placeholder='E-Posta' className='form-input' name='email' value={registerFormData.email} onChange={(e) => handleFormChange(e, 'register')} />
                    <input type='text' placeholder='Kullanıcı Adı' className='form-input' name='username' value={registerFormData.username} onChange={(e) => handleFormChange(e, 'register')} />
                    <input type='password' placeholder='Şifre' className='form-input' name='password' value={registerFormData.password} onChange={(e) => handleFormChange(e, 'register')} />
                    <input type='password' placeholder='Şifre tekrar' className='form-input' name='passwordRepeat' value={registerFormExtra.passwordRepeat} onChange={(e) => handleFormChange(e, 'extra')} />
                    <input type='text' placeholder='İsim (isteğe bağlı)' className='form-input' name='fullName' value={registerFormData.fullName} onChange={(e) => handleFormChange(e, 'register')} />
                    <label className='accept-legal checkbox-1'>
                        <input
                            type='checkbox'
                            checked={registerFormExtra.acceptLegal}
                            onChange={() => setRegisterFormExtra(prev => ({ ...prev, acceptLegal: !prev.acceptLegal }))}
                        />
                        <span><Link href='/politika' rel='nofollow' target='_blank'>Kullanım koşullarını</Link> ve <Link href='/politika/gizlilik-politikasi' rel='nofollow' target='_blank'>Gizlilik Politikasını</Link><br />okudum ve onaylıyorum.</span>
                    </label>
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
                {/* maybe later
                <div className="facebook-login-wrapper">
                    <LoginWithFacebook setAuthModalWarning={setAuthModalWarning} setAuthModalSuccess={setAuthModalSuccess} handleAuthModal={handleAuthModal} />
                </div>*/}
                <p className='oauth-legal-note'>3. parti ile hesap oluşturursanız <Link href='/politika' rel='nofollow' target='_blank'>Kullanım koşullarını</Link> ve <br /><Link href='/politika/gizlilik-politikasi' target='_blank'>Gizlilik Politikasını</Link> onaylamış sayılırsınız.</p>
                {/*<span className='line-seperator'></span>
                <span className='signup-instead'>Hesabın yok mu? <Link href={'/kayit'}>Kayıt ol</Link></span>*/}
            </div>
        </div>
    );
}

export default AuthModal;