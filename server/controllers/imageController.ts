
import { Request, Response } from 'express';
const { dirname } = require('path');
const appDir = dirname(require.main?.filename);

// To serve images
exports.serveImage = (req: Request, res: Response) => {
    const imageName = req.params.imageName;
    return res.sendFile(appDir + `/assets/images/${imageName}`);
};
