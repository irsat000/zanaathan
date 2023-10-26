import Link from 'next/link';
import { useState } from 'react'
import { XLg } from 'react-bootstrap-icons';

const AuthModal: React.FC<{
    authModalActive: string,
    setAuthModalActive: (v: string) => void
}> = ({ authModalActive, setAuthModalActive }) => {

    const [loginFormData, setLoginFormData] = useState({
        username: '',
        password: ''
    });

    const [registerFormData, setRegisterFormData] = useState({
        email: '',
        username: '',
        password: '',
        fullname: ''
    });


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
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(loginFormData)
        }).then(res => {
            switch (res.status) {
                case 404:
                    return Promise.reject(`Kullanıcı bulunamadı`);
                case 400:
                case 401:
                    return Promise.reject(`Kullanıcı adı veya şifre hatalı`);
                case 200:
                    return res.json();
                default:
                    return Promise.reject(`HTTP error! status: ${res.status}`);
            }
        }).then(data => {
            console.log(data.JWT);
        }).catch(err => console.error(`Sunucuyla bağlantıda hata.`))
    }

    const handleRegisterFormSubmit = async (e: any) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/sign-up', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(registerFormData)
        }).then(res => {
            switch (res.status) {
                case 400:
                    return Promise.reject(`Form bilgileri yetersiz`);
                case 409:
                    return Promise.reject(`Bu kullanıcı adı ya da eposta ile zaten kullanıcı var`);
                case 200:
                    return res.json();
                default:
                    return Promise.reject(`HTTP error! status: ${res.status}`);
            }
        }).then(data => {
            console.log(data.JWT);
        }).catch(err => console.error(`Sunucuyla bağlantıda hata.`))
    }
    return (
        <div className={`auth-modal-container ${authModalActive !== 'none' && 'active'}`} onClick={() => setAuthModalActive('none')}>
            <div className='auth-modal' onClick={(e) => { e.stopPropagation() }}>
                <button type='button' className='close-auth-modal-button' onClick={() => setAuthModalActive('none')}><XLg /></button>
                <div className="auth-tab-buttons">
                    <span className={`login-tab-button ${authModalActive === 'signin' ? 'active' : 'inactive'}`}
                        onClick={() => setAuthModalActive('signin')}>Giriş Yap</span>
                    <span className={`register-tab-button ${authModalActive === 'signup' ? 'active' : 'inactive'}`}
                        onClick={() => setAuthModalActive('signup')}>Kayıt Ol</span>
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
                    <input type='text' placeholder='İsim (isteğe bağlı)' className='form-input' name='fullname' onChange={handleRegisterFormChange} />
                    <div className="register-button-container">
                        <button type='submit' className='submit-button'>Kayıt ol</button>
                    </div>
                </form>
                <span className='or-seperator'>Ya da</span>
                <button type='button' className='google-button-temp'>Google ile</button>
                <span className='line-seperator'></span>
                <span className='signup-instead'>Hesabın yok mu? <Link href={'/kayit'}>Kayıt ol</Link></span>
            </div>
        </div>
    );
}

export default AuthModal;