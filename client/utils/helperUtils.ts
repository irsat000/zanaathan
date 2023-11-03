
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export const isNullOrEmpty = (value: any): boolean => {
  if (!value || !value.trim()) {
      return true;
  }
  return false;
}

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

export const formatSecondsAgo = (secondsDifference: number) => {
  if (secondsDifference < 60) {
    return secondsDifference + " saniye önce";
  }

  const minutesDifference = Math.floor(secondsDifference / 60);

  if (minutesDifference < 60) {
    return minutesDifference + " dakika önce";
  }

  const hoursDifference = Math.floor(minutesDifference / 60);

  if (hoursDifference < 24) {
    return hoursDifference + " saat önce";
  }

  const daysDifference = Math.floor(hoursDifference / 24);

  if (daysDifference < 7) {
    return daysDifference + " gün önce";
  }

  const weeksDifference = Math.floor(daysDifference / 7);
  return weeksDifference + " hafta önce";
}


export const imageLink = (name: string) => {
  return `${apiUrl}/images/${name}`;
}