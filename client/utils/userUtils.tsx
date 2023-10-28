
import Cookies from 'js-cookie';
const jwt = require('jsonwebtoken');

export const decodedJwt = (token: string) => {
    const info = jwt.decode(token);
    return info ?? undefined;
}

export const storeJwt = (token: string) => {
    const date = new Date();
    Cookies.set('jwtToken', token, { secure: true, sameSite: 'strict', expires: date.getDate() + 7 });
}

export const fetchJwt = () => {
    return Cookies.get('jwtToken');
}

export const readJwtCookie = () => {
    const jwt = Cookies.get('jwtToken');
    if (jwt) {
        try {
            const decoded = decodedJwt(jwt);
            if (Date.now() <= decoded?.exp) {
                return decoded;
            }
        } catch (error) {
            console.error('Error while reading credentials');
        }
    }

    Cookies.remove('jwtToken');
    return undefined;
}

export const removeJwtCookie = () => {
    Cookies.remove('jwtToken');
}