import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../_util/testUtil.js'
import fs from 'fs'
import { resolve } from 'path'
import { pipeline } from 'stream/promises'
import { logger } from '../../src/logger.js'



describe('#UploadHandler test swite.', () => {

    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })
    //
    const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => { }
    }

    describe('#registerEvent', () => {

        test('should call onFile and omFinish functions on Busboy instance', async () => {
            const uploadHandler = new UploadHandler({ io: ioObj, socketId: 'id1' })
            jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue()
            const headers = {
                'content-type': 'multipart/form-data; boundary='
            }
            const onFinish = jest.fn()
            const busBoynstace = uploadHandler.registerEvent(headers, onFinish)

            const fileStream = TestUtil.generateReadbleStream(['chunk', 'of', 'data'])
            busBoynstace.emit('file', 'fieldname', fileStream, 'filename.txt')

            busBoynstace.listeners('finish')[0].call()

            expect(uploadHandler.onFile).toHaveBeenCalled()
            expect(onFinish).toHaveBeenCalled()
        })


    })

    describe('#onFinish', () => {
        test('given stream file it should save on disk ', async () => {
            const chunks = ['key', 'top']
            const downloadsFolder = '/tmp'
            const handler = new UploadHandler({
                io: ioObj,
                socketId: 'id1',
                downloadsFolder
            })
            const onData = jest.fn()
            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateWritableStream(onData))

            const onTransform = jest.fn()
            jest.spyOn(handler, handler.handleFileBytes.name)
                .mockImplementation(() => TestUtil.generateTransfomStream(onTransform))

            const params = {
                fieldname: 'estevao',
                file: TestUtil.generateReadbleStream(chunks),
                filename: 'mockfile.mov'
            }

            await handler.onFile(...Object.values(params))

            expect(onData.mock.calls.join()).toEqual(chunks.join())

            expect(onTransform.mock.calls.join()).toEqual(chunks.join())

            const expectedPathData = resolve(handler.downloadsFolder, params.filename)

            expect(fs.createWriteStream).toBeCalledWith(expectedPathData)





        })
    })
    describe('#handlerFileBytes', () => {
        test('should call emmit function and it is a transform stream', async () => {
            jest.spyOn(ioObj, ioObj.to.name)
            jest.spyOn(ioObj, ioObj.emit.name)

            const handler = new UploadHandler({
                io: ioObj,
                socketId: '01'
            })

            jest.spyOn(handler, handler.canExecute.name).mockReturnValueOnce(true)

            const messages = ['hello']
            const source = TestUtil.generateReadbleStream(messages)
            const onWrite = jest.fn()
            const target = TestUtil.generateWritableStream(onWrite)

            await pipeline(
                source,
                handler.handleFileBytes('filename.txt'),
                target
            )
            expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
            expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)
            expect(onWrite).toBeCalledTimes(messages.length)

            expect(onWrite.mock.calls.join()).toEqual(messages.join())
        })

        test(`given message timerDelay as 2 seconds is should emit only 
        two message during 2 seconds period`, async () => {
            jest.spyOn(ioObj, ioObj.emit.name)

            const messageTimeDelay = 2000
            const day = '2021-07-01 00:00'

            //-> Date.now() do this.lasMessagesent do handleBytes.
            const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)

            //-> primeiro hello
            const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
            const onSecondUpdateLastMessageSent = onFirstCanExecute

            //-> segundo hello fora do intervalo de tempo
            const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)

            //-> world 
            const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)


            TestUtil.mockDateNow([
                onFirstLastMessageSent,
                onFirstCanExecute,
                onSecondUpdateLastMessageSent,
                onSecondCanExecute,
                onThirdCanExecute,

            ])



            const messages = ['hello', 'hello', 'world']
            const filename = 'filename.avi'
            const espectedMessageSend = 2

            const source = TestUtil.generateReadbleStream(messages)

            const handler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                messageTimeDelay
            })

            await pipeline(
                source,
                handler.handleFileBytes(filename)
            )

            expect(ioObj.emit).toHaveBeenCalledTimes(espectedMessageSend)

            const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls

            expect(firstCallResult)
                .toEqual([handler.ON_OPLOAD_EVENT, { processedAllready: 'hello'.length, filename }])

            //const messageLenth=messages.reduce((accum, curr) => accum + curr).length

            expect(secondCallResult)
                .toEqual([handler.ON_OPLOAD_EVENT, { processedAllready: messages.join("").length, filename }])

        })

    })
    describe('#canExecute', () => {

        test('should return true when time is later than specified delay', async () => {
            const timeDelay = 1000
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                messageTimeDelay: timeDelay,
            })


            const tickNow = TestUtil.getTimeFromDate('2021-09-08 00:00:03')

            TestUtil.mockDateNow([tickNow])
            const lastExecution = TestUtil.getTimeFromDate('2021-09-08 00:00')

            const result = uploadHandler.canExecute(lastExecution)

            expect(result).toBeTruthy()

        })

        test('should return true when time isnt later than specified delay', () => {
            const timeDelay = 3000
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                messageTimeDelay: timeDelay,
            })


            const now = TestUtil.getTimeFromDate('2021-09-08 00:00:02')

            TestUtil.mockDateNow([now])
            const lastExecution = TestUtil.getTimeFromDate('2021-09-08 00:00:01')

            const result = uploadHandler.canExecute(lastExecution)

            expect(result).toBeFalsy()

        })
    })

})