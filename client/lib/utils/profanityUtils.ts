const Filter = require('bad-words')
import profanityBlacklist from '@/assets/site/profanityBlacklist'


export const checkProfanity = (inputs: string[]): boolean => {
    try {
        // Get Turkish profanity black list
        const list = profanityBlacklist.split('\n');
        // Initialize filter and add the Turkish support
        const filter = new Filter({ list: list })
        // Check if any of the inputs contain profanity
        return inputs.some(input => filter.isProfane(input))
    } catch (error) {
        console.error(error)
        // Skip the profanity if error is thrown
        return false
    }
}