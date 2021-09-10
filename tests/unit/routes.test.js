import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { logger } from '../../src/logger.js'
import Routes from '../../src/routes.js'
import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../_util/testUtil.js'

describe('#Route test swite.', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    const request = TestUtil.generateReadbleStream(['some file bytes'])
    const response = TestUtil.generateWritableStream(() => { })

    const defaulParams = {
        request: Object.assign(request, {
            headers: { 'Content-Type': 'multpart/form-data' },
            method: '',
            body: {}
        }),
        response: Object.assign(response, {
            setHeader: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn()
        }),
        values: () => Object.values(defaulParams)
    }
    describe('#setSocketInstance', () => {
        //test: socket deve armazenar instância io 
        test('#socket should store instance io', () => {
            const routes = new Routes()
            const ioObj = {
                to: (id) => ioObj,
                emit: (event, message) => { }
            }
            routes.setSocketInstance(ioObj)
            expect(routes.io).toStrictEqual(ioObj)
        })

    })
    describe('#handler', () => {
        //dada uma rota inexistente, ele deve escolher a rota padrão 
        test('given an inexistent route it should choose default route', async () => {
            const routes = new Routes()
            const params = { ...defaulParams }
            params.request.method = 'inexistent'
            await routes.handler(...params.values())
            expect(params.response.end).toHaveBeenCalledWith('hello word')
        })
        //Isso deve definir qualquer solicitação com CORS habilitado
        test('is should set any request with CORS enabled', async () => {
            const routes = new Routes()
            const params = { ...defaulParams }
            params.request.method = 'inexistent'
            await routes.handler(...params.values())
            expect(params.response.setHeader).toHaveBeenCalledWith('Access-Controll-Allow-Origin', '*')
        })

        //dado método OPTIONS deve escolher opções de rota
        test('given method OPTIONS it  should choose options route', async () => {
            const routes = new Routes()
            const params = { ...defaulParams }
            params.request.method = 'OPTIONS'
            await routes.handler(...params.values())
            expect(params.response.writeHead).toHaveBeenCalledWith(204)
            expect(params.response.end).toHaveBeenCalled()
        })

        //dado método get deve escolher get rota
        test('given method get it  should choose get route', async () => {
            const routes = new Routes()
            const params = { ...defaulParams }
            params.request.method = 'get'
            jest.spyOn(routes, routes.get.name).mockResolvedValue()
            await routes.handler(...params.values())
            expect(routes.get).toHaveBeenCalled()
        })

        //dado método post ele deve escolher a rota post
        test('given method post it  should choose post route', async () => {
            const routes = new Routes()
            const params = { ...defaulParams }
            params.request.method = 'post'
            jest.spyOn(routes, routes.post.name).mockResolvedValue()
            await routes.handler(...params.values())
            expect(routes.post).toHaveBeenCalled()
        })

    })
    //dado método GET deve listar todos os arquivos baixados
    describe('#GET', () => {
        test('#given method GET it should list all files downloaded', async () => {
            const routes = new Routes()
            const params = { ...defaulParams }

            const fileStatusesMock = [{
                size: '172 kB',
                lastModified: '2021-09-06T19:32:48.121Z',
                owner: 'yourshadow',
                file: 'file.png'
            }]

            jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
                .mockResolvedValue(fileStatusesMock)

            params.request.method = 'get'
            await routes.handler(...params.values())

            expect(params.response.writeHead).toHaveBeenCalledWith(200)
            expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock))

        })
    })
    describe('#POST', () => {

        test('it should validate post route workflow', async () => {
            const routes = new Routes('tmp')
            const options = { ...defaulParams }
            options.request.method = 'POST'
            options.request.url = '?socketId=10'

            jest.spyOn(
                UploadHandler.prototype,
                UploadHandler.prototype.registerEvent.name
            ).mockImplementation((headers, onFinish) => {
                const writable = TestUtil.generateWritableStream(() => { })
                writable.on('finish', onFinish)
                return writable
            })

            await routes.handler(...options.values())
            expect(UploadHandler.prototype.registerEvent).toHaveBeenCalled()
            expect(options.response.writeHead).toHaveBeenCalledWith(200)

            const expectDataResult = JSON.stringify({ result: 'File upload with success!' })
            expect(defaulParams.response.end).toHaveBeenCalledWith(expectDataResult)

        })

    })

})