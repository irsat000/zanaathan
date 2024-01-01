import * as nsfwjs from 'nsfwjs'
import { imageDataFromFile } from './helperUtils'


// Check if the images contain inappropriate content
// - If anything fails, return false, admin will moderate it
export const checkUnallowed = async (images: File[]): Promise<boolean> => {
    // Create an array of promises for image processing
    const imagePromises = images.map(async (pic) => {
        const imageData = await imageDataFromFile(pic);
        if (!imageData) {
            return false;
        }

        return nsfwjs.load()
            .then((model) => model.classify(imageData))
            .then((predictions) => {
                const problematic = predictions.some(prediction =>
                    ((prediction.className === 'Porn'
                        || prediction.className === 'Hentai')
                        && prediction.probability > 0.8) || (prediction.className === 'Sexy' && prediction.probability > 0.8)
                );

                return problematic;
            })
            .catch((err) => {
                console.log("--", err);
                return false;
            });
    });

    // Use Promise.all to execute all promises concurrently
    const results = await Promise.all(imagePromises);

    // Check if any result is true (i.e., unallowed content)
    return results.some(result => result);
}