
export const replaceTurkishCharacters = (text: string) => {
    const replacements: { [key: string]: string } = {
        'ü': 'u',
        'Ü': 'U',
        'ç': 'c',
        'Ç': 'C',
        'ı': 'i',
        'İ': 'i',
        'ş': 's',
        'Ş': 's',
        'ö': 'o',
        'Ö': 'o',
        'ğ': 'g',
        'Ğ': 'g'
    };

    // Use a regular expression to match and replace characters
    return text.replace(/[üÜçÇıİşŞöÖğĞ]/g, (match: string) => replacements[match]);
}