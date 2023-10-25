
const jwt = require('jsonwebtoken');

export const createJwt = (AccountId: number): string => {
    // 7 days from now is the expiration date
    let expireDate = new Date();
    const data = {
        expireDate: expireDate.setDate(expireDate.getDate() + 7),
        accountId: AccountId
    };
    return jwt.sign(data, "tempJwtSecretKey");
}