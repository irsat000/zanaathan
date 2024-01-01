import * as tf from '@tensorflow/tfjs'
import * as nsfwjs from 'nsfwjs'
import { imageDataFromFile } from './helperUtils'


// Check if the images contain inappropriate content
// - If anything fails, return false, admin will moderate it
export const checkUnallowed = async (images: File[]): Promise<boolean> => {
    // Iterate over images, first unallowed(true) will break the loop and warn the user
    for (let i = 0; i < images.length; i++) {
        const pic = images[i]
        // Convert File into an ImageData
        // - Necessary for nsfwjs operation
        const imageData = await imageDataFromFile(pic)
        if (!imageData) {
            return false
        }
        const unallowed = await nsfwjs.load()
            .then((model) => model.classify(imageData))
            .then((predictions) => {
                // If any of the selected class names have high probability, return true, which means it's unallowed
                const problematic = predictions.some(prediction =>
                    ((prediction.className === 'Porn'
                        || prediction.className === 'Hentai')
                        && prediction.probability > 0.8) || (prediction.className === 'Sexy' && prediction.probability > 0.8)
                )

                return problematic
            })
            .catch((err) => {
                console.log("--", err)
                return false
            })
        // Break the loop by returning if we hit an unallowed
        if (unallowed) return unallowed
    }
    // If no unallowed found, return false
    return false
}