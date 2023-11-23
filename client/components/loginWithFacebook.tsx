import { useUser } from '@/context/userContext';
import { apiUrl } from '@/lib/utils/helperUtils';
import { decodedJwt, storeJwt } from '@/lib/utils/userUtils';
import { FacebookProvider, LoginButton } from 'react-facebook';
import { AuthModalState } from './authModal';

const LoginWithFacebook: React.FC<{
    setAuthModalWarning: React.Dispatch<React.SetStateAction<string | null>>,
    setAuthModalSuccess: React.Dispatch<React.SetStateAction<string | null>>,
    handleAuthModal: (state: AuthModalState) => void
}> = ({ setAuthModalWarning, setAuthModalSuccess, handleAuthModal }) => {
    // Get user context
    const { setUserData } = useUser();

    function handleSuccess(response: any) {
        // Not necessary
        if (!response.authResponse || !response.authResponse.accessToken || !response.authResponse.userID) {
            return;
        }

        // Send the access token and user id to the api
        const payload = {
            accessToken: response.authResponse.accessToken,
            userID: response.authResponse.userID
        }
        fetch(`${apiUrl}/auth-facebook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
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
            .catch((res) => console.log('Sunucuyla bağlantıda hata'));
    }

    function handleError(error: any) {
        console.log("Facebook'a bağlanırken hata", error);
    }

    return (
        <FacebookProvider appId="310085268503572">
            <LoginButton
                onError={handleError}
                onSuccess={handleSuccess}
            >
                Facebook ile giriş
            </LoginButton>
        </FacebookProvider>
    );
}

export default LoginWithFacebook;