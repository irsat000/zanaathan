

export const isNullOrEmpty = (value: any): boolean => {
    if (!value || !value.trim()) {
        return true;
    }
    return false;
}