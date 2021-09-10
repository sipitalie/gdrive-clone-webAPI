import fs from 'fs';
import FormData from 'form-data'
import {
    describe,
    test,
    expect,
    jest,
    beforeEach,
    beforeAll,
    afterAll
} from '@jest/globals'

import FileHelper from '../../src/fileHelper.js';
import Routes from '../../src/routes.js'
import TestUtil from '../_util/testUtil.js';
import { logger } from '../../src/logger.js';
import { join } from 'path';
import { tmpdir } from 'os'

describe('#Routes Integration Test', () => {
    let defaultDownloadsFolder = ''
    beforeAll(async () => {
        defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'download-'))
    })

    afterAll(async () => {
        //console.log(defaultDownloadsFolder)
        await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
    })

    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    describe('#getfilestatus', () => {

        test('# it should return files status in correct format', async () => {
            const filename = 'Homem_Aranha.jpeg'
            const fileStream = fs.createReadStream(`./tests/integration/mocks/${filename}`)
            const response = TestUtil.generateWritableStream(() => { })
            const form = new FormData()

            const ioObj = {
                to: (id) => ioObj,
                emit: (event, message) => { }
            }

            form.append('photo', fileStream)

            const defaulParams = {
                request: Object.assign(form, {
                    headers: form.getHeaders(),
                    method: 'POST',
                    url: '?socketId=10'
                }),
                response: Object.assign(response, {
                    setHeader: jest.fn(),
                    writeHead: jest.fn(),
                    end: jest.fn()
                }),
                values: () => Object.values(defaulParams)
            }
            const routes = new Routes(defaultDownloadsFolder)
            routes.setSocketInstance(ioObj)

            const dir = await fs.promises.readdir(defaultDownloadsFolder)
            expect(dir).toEqual([])
            await routes.handler(...defaulParams.values())

            const dirafter = await fs.promises.readdir(defaultDownloadsFolder)
            expect(dirafter).toEqual([filename])

            expect(defaulParams.response.writeHead).toHaveBeenCalledWith(200)

            const expectDataResult = JSON.stringify({ result: 'File upload with success!' })
            expect(defaulParams.response.end).toHaveBeenCalledWith(expectDataResult)


        })
    })

})