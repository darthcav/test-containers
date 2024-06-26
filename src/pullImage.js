import Docker from "dockerode"
import Logger from "imergo-logger"

const __docker = new Docker({
    socketPath: "/var/run/docker.sock"
})
const __logger = Logger("test-containers")

/**
 * Pulls a Docker image using Dockerode.
 *
 * @async
 * @function pullImage
 * @param {Object} options - The parameters for pulling the image.
 * @param {Docker} [options.docker = new Docker({ socketPath: "/var/run/docker.sock" })] - The Dockerode instance.
 * @param {Logger} [options.logger = Logger("test-containers")] - The Logger instance.
 * @param {string} options.imageName - The name of the Docker image to pull.
 * @returns {Promise<void|Error>} A promise that resolves when the image is successfully pulled, or rejects with an error.
 *
 * @example
 * pullImage({
 *   docker: new Docker(),
 *   logger: Logger("my-logger"),
 *   imageName: "my-image",
 * }).then(() => {
 *   console.log("Image pulled successfully");
 * }).catch(error => {
 *   console.error("Error pulling image:", error);
 * });
 */
export default async function pullImage({ docker= __docker, logger= __logger, imageName })
{
    return new Promise((resolve, reject) => {
        docker.pull(imageName)
            .then(async stream => {
                docker.modem.followProgress(stream, onFinished, onProgress)

                function onFinished(error, output)
                {
                    if (error)
                    {
                        throw error
                    }
                    logger.info(`Success pulling ${imageName} image`)
                    logger.debug(`${JSON.stringify(output, null, 4)}`)
                    resolve()
                }

                function onProgress(event)
                {
                    logger.info(`Pulling ${imageName} image [Status: ${event.status}] ${event?.progress ? "[" + event.progress + "]" : ""}`)
                }
            })
            .catch(error => reject(error))
    })
}
