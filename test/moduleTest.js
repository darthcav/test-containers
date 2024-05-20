import { equal, ok } from "node:assert/strict"
import { createReadStream } from "node:fs"
import { rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { URL } from "node:url"
import { after, before, describe, test } from "node:test"
import Docker from "dockerode"
import { create } from "tar"
import Logger from "imergo-logger"
import { pullImage, startContainer, stopContainer, runApplication } from "../src/index.js"

// Function to create the tar archive
async function createTarArchive ({ baseDir, sourceDir, archiveName }){
    create({
        cwd: baseDir,
        file: archiveName,
        gzip: true,
        sync: true
    }, sourceDir)
}

describe("### Test suite for the test-containers module", async function () {
    const imageName = "alpine:latest"
    const logger = Logger("test-containers")
    const containerOptions = {
        name: "test-alpine",
        Cmd: [ "/bin/sh", "-c", "tail -f /dev/null" ],
    }
    const __dirname = dirname(new URL(import.meta.url).pathname)
    const archiveName = join(__dirname, "script1.tgz")
    const sourceDir = [ "script1" ]
    let docker

    before(async function () {
        await createTarArchive({ baseDir: __dirname, sourceDir, archiveName })
        docker = new Docker({
            socketPath: "/var/run/docker.sock"
        })
    })
    after(async function () {
        const image = docker.getImage(imageName)
        await image.remove()
        await rm(archiveName)
        logger.info(`Removed ${imageName} image and ${archiveName} archive`)
    })
    test("should pull an image successfully", async function () {
        const result = await pullImage({ docker, logger, imageName })
        ok(typeof result === "undefined")
    })
    test("should start a container successfully", async function () {
        const result = await startContainer({ docker, logger, containerOptions, imageName })
        ok(typeof result === "undefined")
    })
    test("should run a script within a container successfully", async function () {
        // const scriptPath = join(__dirname, "./scripts/echoHelloWorld.sh")
        const result = await runApplication({
            docker,
            logger,
            containerName: containerOptions.name,
            scriptReadStream: createReadStream(join(archiveName)),
            scriptRootDir: "/root",
            execOptions: {
                Cmd: [ "/bin/sh", "/root/script1/echoHelloWorld.sh" ]
            }
        })
        ok(typeof result === "string")
        equal(result.toString(),"\fHello World\n")
    })
    test("should stop a container successfully", async function () {
        const result = await stopContainer({
            docker,
            logger,
            removeContainer: true,
            containerName: containerOptions.name
        })
        ok(result instanceof Buffer)
    })
})
