
import { useUser } from '@/context/userContext';
import { apiUrl, formatDateString, toShortLocal } from '@/lib/utils/helperUtils';
import { decodedJwt, storeJwt } from '@/lib/utils/userUtils';
import { GoogleLogin } from '@react-oauth/google';
import { AuthModalState } from './authModal';
import { useGStatus } from '@/context/globalContext';

const LoginWithGoogle: React.FC<{
    setAuthModalWarning: React.Dispatch<React.SetStateAction<string | null>>,
    setAuthModalSuccess: React.Dispatch<React.SetStateAction<string | null>>,
    handleAuthModal: (state: AuthModalState) => void
}> = ({ setAuthModalWarning, setAuthModalSuccess, handleAuthModal }) => {
    // Use global context
    const { handleGStatus } = useGStatus();
    // Get user context
    const { setUserData } = useUser();

    return <GoogleLogin
        onSuccess={credentialResponse => {
            fetch(`${apiUrl}/auth-google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ credentials: credentialResponse })
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
                    if (res.status === 403) {
                        res.json().then((data: any) => {
                            handleGStatus('informationModal', {
                                type: 'error',
                                text: 'Bu kullanıcı yasaklıdır. Yasak kalkma tarihi: ' + formatDateString(data.banLiftDate)
                            })
                            setAuthModalWarning('*Yasaklı*')
                        })
                    }
                    else setAuthModalWarning('*Bağlantıda hata*')
                });
        }}
        onError={() => {
            setAuthModalWarning('*Bağlantıda hata*');
        }}
    />;
};

export default LoginWithGoogle;