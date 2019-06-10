class VideoController {
    constructor(videoPath) {
        this.socket = io()
        this.videoPath = videoPath
        this.video = document.querySelector('video')

        this.ignored = {
            play: false,
            pause: false,
            seek: false
        }

        // socket events
        this.socket.on('viewers', msg => this.setViewers(msg))
        this.socket.on('pause', msg => this.pauseVideo())
        this.socket.on('play', msg => this.playVideo())
        this.socket.on('seek', msg => this.seekVideo(msg.timestamp))
        this.socket.on('connect', () => this.setSyncStatus('synced'))
        this.socket.on('disconnect', () => this.setSyncStatus('syncing...'))
        this.socket.on('send sync', () => this.sendSync())

        // video events
        this.video.addEventListener('pause', ev => this.videoPaused(ev))
        this.video.addEventListener('play',  ev => this.videoPlayed(ev))
        this.video.addEventListener('seeking',  ev => this.videoSeeked(ev))

        // other bullshite
        this.subscribeToCurrentVideo()
    }


    /* --- state mgmt --- */
    setSyncStatus(text) {
        document.querySelector('#connectionState').innerText = text
    }

    setViewers(viewers) {
        document.querySelector('#activeViewers').innerText = `${viewers} active viewers`
    }

    setVideoState(text) {
        document.querySelector('#videoState').innerText = text
    }

    subscribeToCurrentVideo() {
        this.socket.emit('watching', this.videoPath)
    }

    sendSync() {
        this.video.currentTime = this.video.currentTime
        if (!this.video.paused) {
            this.video.pause()
        }
    }

    /* --- commands --- */
    pauseVideo() {
        if (!this.video.paused) {
            console.log('pausing...')
            this.ignored.pause = true
            this.video.pause()
        }
    }

    playVideo() {
        if (this.video.paused) {
            console.log('playing...')
            this.ignored.play = true
            this.video.play()
        }
    }

    seekVideo(seektime) {
        this.ignored.seek = true
        this.video.currentTime = seektime
    }

    /* --- event handler --- */
    videoPaused(ev) {
        this.setVideoState('paused')
        if (this.ignored.pause) {
            console.log('initiated pause, ignoring...')
            this.ignored.pause = false;
            return
        }

        this.socket.emit('pause', this.videoPath)
    }

    videoPlayed(ev) {
        this.setVideoState('playing')
        if (this.ignored.play) {
            console.log('initiated play, ignoring...')
            this.ignored.play = false;
            return
        }

        this.socket.emit('play', this.videoPath)

    }

    videoSeeked(ev) {
        if (this.ignored.seek) {
            console.log('initiated seek, ignoring...')
            this.ignored.seek = false;
            return
        }

        this.socket.emit('seek', {
            timestamp: this.video.currentTime,
            video: this.videoPath
        })
    }

}
