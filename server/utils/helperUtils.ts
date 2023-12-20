import rateLimit from "express-rate-limit";


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

export const rateLimiter = (args?: { minute: number, max: number }) => rateLimit({
    windowMs: (args ? args.minute : 15) * 60 * 1000,
    max: args ? args.max : 100,
    standardHeaders: true,
    legacyHeaders: false,
})


export const titleToUrl = (title: string) => {
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
  
    return urlFriendlyTitle
  }