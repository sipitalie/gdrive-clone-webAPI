import { describe, test, expect, jest } from '@jest/globals'
import fs from 'fs';
import FileHelper from '../../src/fileHelper.js';
import Routes from '../../src/routes.js'

describe('#FileHelper.', () => {
    describe('#getfilestatus', () => {
        test('# it should return files status in correct format', async () => {
            const statMock = {
                dev: 2050,
                mode: 33204,
                nlink: 1,
                uid: 1000,
                gid: 1000,
                rdev: 0,
                blksize: 4096,
                ino: 5033519,
                size: 171762,
                blocks: 336,
                atimeMs: 1630956768496.625,
                mtimeMs: 1630956768128.6304,
                ctimeMs: 1630956768132.6301,
                birthtimeMs: 1630956768120.6304,
                atime: '2021-09-06T19:32:48.497Z',
                mtime: '2021-09-06T19:32:48.129Z',
                ctime: '2021-09-06T19:32:48.133Z',
                birthtime: '2021-09-06T19:32:48.121Z'


            }
            const mockUser = 'yourshadow'
            process.env.USER = mockUser
            const filename = 'file.png'

            jest.spyOn(fs.promises, fs.promises.readdir.name)
                .mockResolvedValue([filename])

            jest.spyOn(fs.promises, fs.promises.stat.name)
                .mockResolvedValue(statMock)



            const result = await FileHelper.getFileStatus("/tmp")
            const expectResult = [{
                size: '172 kB',
                lastModified: statMock.birthtime,
                owner: mockUser,
                file: 'file.png'
            }]

            expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
            expect(result).toMatchObject(expectResult)
        })
    })
})