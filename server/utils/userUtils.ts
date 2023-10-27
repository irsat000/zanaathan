
const jwt = require('jsonwebtoken');

interface JWT {
    id: number;
    username: string;
    fullName: string | null;
    email: string;
}

export const createJwt = (Info: JWT): string => {
    // 7 days from now is the expiration date
    let expireDate = new Date();
    const data = {
        exp: expireDate.setDate(expireDate.getDate() + 7),
        sub: Info.id,
        username: Info.username,
        fullName: Info.fullName,
        email: Info.email,
    };
    return jwt.sign(data, "tempJwtSecretKey");
}