class VideoStore {
    constructor() {
        this.conns = {}
    }

    /**
     * Add a subscriber to a specific video
     * @param string video video file path
     * @param socket socket client socket
     */
    addViewer(video, socket) {
        if (!(video in this.conns)) {
            this.conns[video] = [socket]
        } else {
            this.conns[video].push(socket)
        }
    }

    /**
     * Remove a viewer
     * @param socket socket client to disconnect
     */
    removeViewer(socket) {
        for (let video in this.conns) {
            this.conns[video] = this.conns[video].filter(sock => !sock.disconnected)
        }
    }

    /**
     * Get viewer counts
     * @param string video video file path
     * @return int number of viewers
     */
    getViewerCount(video) {
        if (video in this.conns) {
            return this.conns[video].length;
        } else {
            return 0
        }
    }

    /**
     * Ask the first client to send the video state
     * @param string video video file path
     */
    initiateSync(video) {
        if (this.getViewerCount(video) > 0) {
            this.conns[video][0].emit('send sync')
        }
    }
}

module.exports = {
    VideoStore
}
