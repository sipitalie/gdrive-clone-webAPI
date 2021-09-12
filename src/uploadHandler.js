import Busboy from 'busboy';
import { pipeline } from 'stream/promises'
import fs from 'fs'
import { logger } from './logger.js'

export default class UploadHandler {
    constructor({ io, socketId, downloadsFolder, messageTimeDelay = 200 }) {
        this.io = io
        this.socketId = socketId
        this.downloadsFolder = downloadsFolder
        this.ON_OPLOAD_EVENT = 'file-upload'
        this.messageTimeDelay = messageTimeDelay
    }
    canExecute(lastExecution) {
        return (Date.now() - lastExecution) >= this.messageTimeDelay

    }

    handleFileBytes(filename) {
        this.lastMessageSent = Date.now()
        async function* handleData(source) {
            let processedAllready = 0
            for await (const chunk of source) {
                yield chunk
                processedAllready += chunk.length
                if (!this.canExecute(this.lastMessageSent)) {
                    continue;
                }
                this.lastMessageSent = Date.now()
                this.io.to(this.socketId).emit(this.ON_OPLOAD_EVENT, { processedAllready, filename })
                logger.info(`file [${filename}] got ${processedAllready} bytes to ${this.socketId}`)
            }
        }
        return handleData.bind(this)

    }
    async onFile(fieldname, file, filename) {
        const saveTo = `${this.downloadsFolder}/${filename}`
        await pipeline(
            file,
            this.handleFileBytes.apply(this, [filename]),
            fs.createWriteStream(saveTo)
        )
        logger.info(`file [${filename}] fineshed`)

    }
    registerEvent(headers, onFinish) {
        const busboy = new Busboy({ headers })
        busboy.on('file', this.onFile.bind(this))
        busboy.on("finish", onFinish)
        return busboy

    }
}