import { exit } from "node:process"
import { ok } from "node:assert/strict"
import { after, before, describe, test } from "node:test"
import Docker from "dockerode"
import Logger from "imergo-logger"
import { pullImage } from "../src/index.js"

describe("### Test suite for the test-containers module", function () {
    const imageName = "alpine:latest"
    const logger = Logger("test-containers")
    let docker

    before(() => {
        docker = new Docker({
            socketPath: "/var/run/docker.sock"
        })
    })
    after(async () => {
        const image = docker.getImage(imageName)
        await image.remove()
        logger.info(`Removed ${imageName} image`)
        exit(0)
    })
    test("should pull an image successfully", async function () {
        const result = await pullImage({ docker, logger, imageName })
        ok(typeof result === "undefined")
    })
})
