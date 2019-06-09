const express = require('express')
const fs      = require('fs')
const config  = require('config')
const session = require('express-session')
const app     = express()
const http    = require('http').createServer(app)
const crypto  = require('crypto')
const folder  = require('./folder')
const io      = require('socket.io')(http)
const vstore  = require('./vstore.js')

// preferable use nginx/similar in production
app.use('/static/videos', express.static(config.videos_folder))
app.use('/static', express.static('static'))


// set up sessions
app.use(session({
    secret: crypto.randomBytes(64).toString(),
    cookie: { expires: 12 * 60 * 60 * 1000 } // 12 hours
}))
let ensureAuth = (req, res, next) => {
    if (false && !req.session.authenticated) {
        res.redirect('/')
        return
    }
    next()
}


// set up rendering
app.set('views', './views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('pages/index')
})

app.get('/videos/', ensureAuth, (req, res) => {
    folder.listAllVideos().then(videos => {
        res.render('pages/videos', { videos })
    })
})

app.get('/watch/*', ensureAuth, (req, res) => {
    const videoPath = decodeURI(req.path.substr('/watch/'.length))

    res.render('pages/viewer', { videoPath })
})

// this is temporary, but *fuck it*
const videoStore = new vstore.VideoStore()
io.on('connection', socket => {
    console.log('socket connected')
    socket.on('watching', msg => {
        socket.join(msg)
        videoStore.addViewer(msg, socket)
        console.log(`viewers now for ${msg}: ${videoStore.getViewerCount(msg)}`)
        socket.broadcast.to(msg).emit('viewers', videoStore.getViewerCount(msg))
        socket.emit('viewers', videoStore.getViewerCount(msg))
        videoStore.initiateSync(msg, socket)
    })

    socket.on('pause', msg => {
        console.log('broadcasting pause')
        socket.broadcast.to(msg).emit('pause')
    })

    socket.on('play', msg => {
        console.log('broadcasting play')
        socket.broadcast.to(msg).emit('play')
    })

    socket.on('seek', msg => {
        socket.broadcast.to(msg.video).emit('seek', {timestamp: msg.timestamp})
    })

    socket.on('disconnect', () => {
        console.log('socket disconnected')
        videoStore.removeViewer(socket)
        for (let room in socket.rooms) {
            console.log('removing from: room')
            socket.broadcast.to(room).emit('viewers', videoStore.getViewerCount(room))
        }
    })
})

app.get('/api/login', (req, res) => {
    // this is not super safe
    if (req.query.pw === config.password) {
        req.session.authenticated = true
        res.json({
            success: true
        })
        return
    }
    res.json({
        success: false
    })
})

http.listen(config.port, () => console.log(`listening on *:${config.port}`))
