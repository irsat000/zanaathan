import { isNullOrEmpty } from "./helperUtils";

const jwt = require('jsonwebtoken');

export interface JWT {
    sub: number;
    username: string;
    fullName: string | null;
    email: string;
    avatar: string | null;
    roles?: string[]
}

export const createJwt = (Info: JWT): string => {
    // 7 days from now is the expiration date
    let expireDate = new Date();
    const data: any = {
        exp: expireDate.setDate(expireDate.getDate() + 7),
        sub: Info.sub,
        username: Info.username,
        fullName: Info.fullName,
        email: Info.email,
        avatar: Info.avatar
    };
    if (Info.roles) {
        data.roles = Info.roles;
    }
    return jwt.sign(data, process.env.JWT_SECRET ?? "tempJwtSecretKey");
}

export const verifyJwt = (token: string | null | undefined): number | null => {
    try {
        // Check string
        if (isNullOrEmpty(token) || token === "undefined") return null;
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "tempJwtSecretKey");
        // Token is valid, get the user id
        return decoded.sub ?? null;
    } catch (error: any) {
        return null;
    }
}