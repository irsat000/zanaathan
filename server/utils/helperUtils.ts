

export const isNullOrEmpty = (value: any): boolean => {
    if (!value || !value.trim()) {
        return true;
    }
    return false;
}

export const sanatizeInputString = (value: string): string => {
    return value.trim().replace(/ +/g, ' ');
}

export const isPositiveNumeric = (value: string): boolean => {
    // Including 0
    return /^\d+$/.test(value);
}

export const dateToMysqlDate = (date: Date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ')
}