import fs from 'fs';
import prettyBytes from 'pretty-bytes';

export default class FileHelper {
    static async getFileStatus(downloadsFolder) {
        const currentfiles = await fs.promises.readdir(downloadsFolder)

        const statuses = await Promise
            .all(currentfiles.map(file => fs.promises.
                stat(`${downloadsFolder}/${file}`)))

        const filestatuses = []

        for (const fileIndex in currentfiles) {
            const { birthtime, size } = statuses[fileIndex]
            filestatuses.push({
                size: prettyBytes(size),
                file: currentfiles[fileIndex],
                lastModified: birthtime,
                owner: process.env.USER,
            })
        }

        return filestatuses

    }

}