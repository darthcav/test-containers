import { env, exit } from "node:process"
import { equal, ok } from "node:assert/strict"
import { after, before, describe, test } from "node:test"
import Docker from "dockerode"
import pullImage from "../src/pullImage.js"

describe("#Test suite for the test-containers module", function () {
    const imageName = "alpine:latest"
    let docker

    before(() => {
        docker = new Docker({
            socketPath: "/var/run/docker.sock"
        })
    })
    after(async () => {
        const image = docker.getImage(imageName)
        await image.remove()
        exit(0)
    })
    test("should pull an image successfully", async function () {
        const result = await pullImage({ docker, imageName })
        ok(typeof result === "undefined")
    })
})
