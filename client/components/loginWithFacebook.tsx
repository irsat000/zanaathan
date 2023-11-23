import { apiUrl } from '@/lib/utils/helperUtils';
import { FacebookProvider, LoginButton } from 'react-facebook';

export default function LoginWithFacebook() {

    function handleSuccess(response: any) {
        console.log(response);
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
                console.log(data.data);
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