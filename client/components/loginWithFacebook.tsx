import { FacebookProvider, LoginButton } from 'react-facebook';

export default function LoginWithFacebook() {
    function handleSuccess(response: any) {
        console.log(response.status);
    }

    function handleError(error: any) {
        console.log(error);
    }

    return (
        <FacebookProvider appId="310085268503572">
            <LoginButton
                scope="email"
                onError={handleError}
                onSuccess={handleSuccess}
            >
                Facebook ile giriş
            </LoginButton>
        </FacebookProvider>
    );
}