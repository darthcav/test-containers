import Docker from "dockerode"
import Logger from "imergo-logger"

const __docker = new Docker({
    socketPath: "/var/run/docker.sock"
})
const __logger = Logger("test-containers")

/**
 * Runs an application in a Docker container.
 *
 * @async
 * @function runApplication
 * @param {Object} options - The options for running the application.
 * @param {Docker} [options.docker = new Docker({ socketPath: "/var/run/docker.sock" })] - The Docker instance to use.
 * @param {Logger} [options.logger = Logger("test-containers")] - The logger to use.
 * @param {string} options.containerName - The name of the container to run the application in.
 * @param {ReadableStream} options.scriptReadStream - The readable stream of the compressed file containing the application to run.
 * @param {string} [options.scriptRootDir = "/root"] - The root directory in the container to place and expand the archive.
 * @param {Object} options.execOptions - The options for executing the application in the container.
 * @returns {Promise<string|Error>} A promise that resolves with the output of the script, or rejects with an error.
 *
 * @example
 * const scriptReadStream = fs.createReadStream("/path/to/your/script.tar.gz");
 * const execOptions = {
 *   Cmd: ["node", "yourScript.js"],
 *   AttachStdout: true,
 *   AttachStderr: true
 * };
 * runApplication({
 *   docker,
 *   containerName: "myContainer",
 *   scriptReadStream,
 *   execOptions
 * }).then(console.log).catch(console.error);
 */
export default async function runApplication({
        docker= __docker,
        logger= __logger,
        containerName,
        scriptReadStream,
        scriptRootDir= "/root",
        execOptions
    }) {
    logger.info(`Running script in ${containerName} container`)
    const containers = await docker.listContainers({
        filters: {
            name: [ containerName ],
            status: [ "running" ]
        }
    })
    if (containers.length)
    {
        const container = docker.getContainer(containers[ 0 ].Id)
        logger.info(`Using existing container: ${container.id}`)
        logger.info(`Uploading file to container`)
        await container.putArchive(scriptReadStream, { path: scriptRootDir })
        return executeInContainer(container, execOptions)
    }
}

async function executeInContainer(container, execOptions) {
    const __execOptions = {
        AttachStderr: true,
        AttachStdout: true,
        ...execOptions
    }

    const exec = await container.exec(__execOptions)
    return new Promise(async (resolve, reject) => {
        return exec.start({}, (error, stream) => {
                if(error)
                {
                    return reject(error)
                }
                let output = ""
                stream.on("data", chunk => output += chunk.toString().replace(/[^\w\s]/gi, ""))
                stream.on("end", async () => {
                    return resolve(output)
                })
                // stream.on("finish", () => stream.socket.exit())
                stream.on("error", error => reject(error))
            })
    })
}
