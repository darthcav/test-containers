import Docker from "dockerode"
import Logger from "imergo-logger"

const __docker = new Docker({
    socketPath: "/var/run/docker.sock"
})
const __logger = Logger("test-containers")

/**
 * Stops a Docker container using Dockerode.
 *
 * @async
 * @function stopContainer
 * @param {Object} options - The parameters for stopping the container. Default: {}.
 * @param {Docker} [options.docker = new Docker({ socketPath: "/var/run/docker.sock" })] - The Dockerode instance.
 * @param {Logger} [options.logger = Logger("test-containers")] - The Logger instance.
 * @param {boolean} [options.removeContainer = false] - A boolean indicating whether to remove the container after stopping it. Default: false.
 * @param {string} options.containerName - The name of the Docker container to stop. No default value.
 * @returns {Promise<void|Error>} A promise that resolves when the container is successfully stopped and removed, or rejects with an error if the container cannot be stopped or removed.
 *
 * @example
 * stopContainer({
 *   docker: new Docker(),
 *   logger: Logger("my-logger"),
 *   containerName: "my-container",
 * }).then(() => {
 *   console.log("Container stopped successfully")
 * }).catch(error => {
 *   console.error("Error stopping container:", error);
 * });
 */
export default async function stopContainer({ docker= __docker, logger= __logger, removeContainer= false, containerName })
{
    logger.info(`Stopping ${containerName} container`)
    const containers = await docker.listContainers({
        filters: {
            name: [ containerName ],
            status: [ "running" ]
        }
    })
    if (containers.length)
    {
        const container = docker.getContainer(containers[ 0 ].Id)
        return container.stop()
            .then(() => {
                logger.info(`${containerName} container stopped`)
                if (removeContainer)
                {
                    logger.info(`Removing container ${containerName} ...`)
                    return container.remove()
                }
            })
            .catch(error => error)
    }
}
