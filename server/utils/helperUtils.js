"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.titleToUrl = exports.rateLimiter = exports.removeExtension = exports.acceptedImgSet_1 = exports.dateToMysqlDate = exports.isPositiveNumeric = exports.sanatizeInputString = exports.isNullOrEmpty = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const isNullOrEmpty = (value) => {
    if (typeof value !== 'string' || !value || !value.trim()) {
        return true;
    }
    return false;
};
exports.isNullOrEmpty = isNullOrEmpty;
const sanatizeInputString = (value) => {
    return value.trim().replace(/ +/g, ' ');
};
exports.sanatizeInputString = sanatizeInputString;
const isPositiveNumeric = (value) => {
    // 0 not included
    return /^[1-9]\d*$/.test(value);
};
exports.isPositiveNumeric = isPositiveNumeric;
const dateToMysqlDate = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};
exports.dateToMysqlDate = dateToMysqlDate;
exports.acceptedImgSet_1 = ['image/webp', 'image/png', 'image/jpg', 'image/jpeg'];
const removeExtension = (fullPath) => {
    // Find the last dot in the full path
    const lastDotIndex = fullPath.lastIndexOf('.');
    // If a dot is found, remove the substring from the last dot onwards
    if (lastDotIndex !== -1) {
        return fullPath.slice(0, lastDotIndex);
    }
    // If no dot is found, return the original full path
    return fullPath;
};
exports.removeExtension = removeExtension;
const rateLimiter = (args) => (0, express_rate_limit_1.default)({
    windowMs: (args ? args.minute : 15) * 60 * 1000,
    max: args ? args.max : 100,
    standardHeaders: true,
    legacyHeaders: false,
});
exports.rateLimiter = rateLimiter;
const titleToUrl = (title) => {
    // Encode the title to handle Turkish characters and special characters
    const encodedTitle = encodeURIComponent(title.toLocaleLowerCase("tr-TR"));
    // Replace encoded spaces with hyphens and remove additional special characters
    let urlFriendlyTitle = encodedTitle
        .replace(/%20/g, '-') // Replace encoded spaces with hyphens
        .replace(/[^a-zA-Z0-9-]/g, ''); // Remove additional special characters
    // Cut if longer than 70 characters
    if (urlFriendlyTitle.length > 70) {
        urlFriendlyTitle = urlFriendlyTitle.substring(0, 70);
        const lastUnderscoreIndex = urlFriendlyTitle.lastIndexOf('-');
        urlFriendlyTitle = urlFriendlyTitle.substring(0, lastUnderscoreIndex);
    }
    return urlFriendlyTitle;
};
exports.titleToUrl = titleToUrl;
