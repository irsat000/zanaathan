

export const isNullOrEmpty = (value: any): boolean => {
    if (typeof value !== 'string' || !value || !value.trim()) {
        return true;
    }
    return false;
}

export const sanatizeInputString = (value: string): string => {
    return value.trim().replace(/ +/g, ' ');
}

export const isPositiveNumeric = (value: any): boolean => {
    return /^[1-9]\d*$/.test(value);
}

export const dateToMysqlDate = (date: Date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ')
}

export const acceptedImgSet_1 = ['image/webp', 'image/png', 'image/jpg', 'image/jpeg'];


export const removeExtension = (fullPath: string) => {
    // Find the last dot in the full path
    const lastDotIndex = fullPath.lastIndexOf('.');

    // If a dot is found, remove the substring from the last dot onwards
    if (lastDotIndex !== -1) {
        return fullPath.slice(0, lastDotIndex);
    }

    // If no dot is found, return the original full path
    return fullPath;
}
