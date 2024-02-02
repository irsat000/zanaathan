"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = exports.createJwt = void 0;
const helperUtils_1 = require("./helperUtils");
const jwt = require('jsonwebtoken');
const createJwt = (Info) => {
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
    if (Info.roles) {
        data.roles = Info.roles;
    }
    return jwt.sign(data, "tempJwtSecretKey");
};
exports.createJwt = createJwt;
const verifyJwt = (token) => {
    var _a;
    try {
        // Check string
        if ((0, helperUtils_1.isNullOrEmpty)(token) || token === "undefined")
            return null;
        // Verify token
        const decoded = jwt.verify(token, "tempJwtSecretKey");
        // Token is valid, get the user id
        return (_a = decoded.sub) !== null && _a !== void 0 ? _a : null;
    }
    catch (error) {
        return null;
    }
};
exports.verifyJwt = verifyJwt;
