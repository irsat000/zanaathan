
import Cookies from 'js-cookie';
import { apiUrl } from './helperUtils';
import { UserContacts } from '@/components/chatbot';
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



export const fetchUserContacts = (setUserContacts: (v: UserContacts[]) => void) => {
    // Check jwt
    const jwt = fetchJwt();
    if (!jwt) return;

    fetch(`${apiUrl}/chat/get-contacts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${jwt}`
        }
    })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
            setUserContacts(data.threadList);
            // todo: cache in session
        })
        .catch((res) => {
            console.log('Sunucuyla bağlantıda hata');
        });
}