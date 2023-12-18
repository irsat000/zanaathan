
import Cookies from 'js-cookie';
import { apiUrl } from './helperUtils';
import { UserContact } from '@/context/contactsContext';
import { UserDataType } from '@/context/userContext';
const jwt = require('jsonwebtoken');

export const decodedJwt = (token: string) => {
    const info = jwt.decode(token);
    return info ?? undefined;
}

export const storeJwt = (token: string) => {
    const date = new Date();
    /* - Note from docs
    Be careful when setting this to true, as compliant clients
    will not send the cookie back to the server in the future
    if the browser does not have an HTTPS connection. */
    Cookies.set('jwtToken', token, { secure: false, sameSite: 'strict', expires: date.getDate() + 7, path: '/' });
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
                return decoded as UserDataType;
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



export const fetchUserContacts = async () => {
    // Check jwt
    const jwt = fetchJwt();
    if (!jwt) return null;

    return await fetch(`${apiUrl}/chat/get-contacts`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${jwt}`
        }
    })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
            return data.contactList as UserContact[];
        })
        .catch((res) => {
            return null;
        });
}