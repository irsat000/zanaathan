import { isNullOrEmpty } from "./helperUtils";

const jwt = require('jsonwebtoken');

interface JWT {
    sub: number;
    username: string;
    fullName: string | null;
    email: string;
    avatar: string | null;
}

export const createJwt = (Info: JWT): string => {
    // 7 days from now is the expiration date
    let expireDate = new Date();
    const data = {
        exp: expireDate.setDate(expireDate.getDate() + 7),
        sub: Info.sub,
        username: Info.username,
        fullName: Info.fullName,
        email: Info.email,
        avatar: Info.avatar
    };
    return jwt.sign(data, "tempJwtSecretKey");
}

export const verifyJwt = (token: string | null | undefined): number | null => {
    try {
        // Check string
        if (isNullOrEmpty(token)) return null;
        // Verify token
        const decoded = jwt.verify(token, "tempJwtSecretKey");
        // Token is valid, get the user id
        return decoded.sub ?? null;
    } catch (error: any) {
        return null;
    }
}