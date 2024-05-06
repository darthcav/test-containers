import Docker from "dockerode"
import Logger from "imergo-logger"
import pullImage from "./pullImage.js"

const __docker = new Docker({
    socketPath: "/var/run/docker.sock"
})
const __logger = Logger("test-containers")

/**
 * Starts a Docker container using Dockerode.
 *
 * @async
 * @function startContainer
 * @param {Object} params - The parameters for starting the container.
 * @default params = { docker: new Docker({ socketPath: "/var/run/docker.sock" }), logger: Logger("test-containers"), containerOptions: {} }
 * @param {Docker} params.docker - The Dockerode instance.
 * @param {Logger} params.logger - The Logger instance.
 * @param {string} params.imageName - The name of the Docker image to use.
 * @param {Object} params.containerOptions - The options for creating the container.
 * @returns {Promise<void>} A promise that resolves when container is successfully started, or rejects with an error.
 *
 * @example
 * startContainer({
 *   docker: new Docker(),
 *   logger: Logger("my-logger"),
 *   imageName: "my-image",
 *   containerOptions: {
 *     name: "my-container",
 *     ExposedPorts: {
 *       "8080/tcp": {}
 *     },
 *     HostConfig: {
 *       PortBindings: {
 *         "8080/tcp": [
 *           {
 *             HostPort: "8080"
 *           }
 *         ]
 *       }
 *     }
 *   }
 * }).then(container => {
 *   console.log("Container started:", container);
 * }).catch(error => {
 *   console.error("Error starting container:", error);
 * });
 */
export default async function startContainer({ docker= __docker, logger= __logger, imageName, containerOptions= {} })
{
    let container
    let images = await docker.listImages({
        filters: {
            reference: [ imageName ]
        }
    })
    if (!images?.length)
    {
        try
        {
            await pullImage({ docker, logger, imageName })
            images = await docker.listImages({
                filters: {
                    reference: [ imageName ]
                }
            })
        }
        catch (error)
        {
            logger.error(`Error pulling ${imageName} image: ${error}`)
            return error
        }
    }
    logger.info(`Starting ${containerOptions?.name} container ...`)
    const containers = await docker.listContainers({
        filters: {
            name: [ containerOptions?.name ],
            status: [ "exited", "paused", "running" ]
        }
    })
    if (!containers.length)
    {
        return docker.createContainer({
                Image: images[ 0 ]?.Id,
                ...containerOptions
            })
            .then(container => container.start())
            .then(() => logger.info(`Success starting ${containerOptions?.name} container`))
            .catch(error => error)
    }
    else if (containers[ 0 ]?.State !== "running")
    {
        container = docker.getContainer(containers[ 0 ].Id)
        return container.start()
            .then(() => logger.info(`Success starting ${containerOptions?.name} container`))
            .catch(error => error)
    }
    logger.info(`Success starting ${containerOptions?.name} container`)
}
