const fs     = require('fs').promises
const config = require('config')
const path   = require('path')

const listAllVideos = async (folder = undefined) => {
    if (folder === undefined) {
        folder = config.videos_folder
    }
    console.log(folder)

    const contents = await fs.readdir(folder, { withFileTypes: true })

    let out = []
    for (let file of contents) {
        if (file.isDirectory()) {
            out = out.concat(
                await listAllVideos(
                    path.join(folder, file.name)
                )
            )
        } else if (file.isFile() && file.name.endsWith('.mp4')) {
            out.push(path.join(folder, file.name))
        }
    }

    return out
}

module.exports = {
    listAllVideos
}
