const { WrappedSocketServer, wrapSocket } = require('./WrappedSocketServer');

class SimpleMeshSignal {
    constructor({pingInterval = 10000, ...wsOptions}){
        const wss = new WrappedSocketServer(wsOptions);
        
        wss.on('connection', socket => {
            socket = wrapSocket(socket);
            socket.alive = true;
        
            // WebRTC
            socket.wrapper.on('discover', ({ peerName }) => {
                socket.peerName = peerName;
                wss.broadcast('discovered', { peerName }, x=>x.peerName !== peerName);
            });
        
            socket.wrapper.on('signal', ({ peerName, signal }) => {
                const peerSocket = wss.findPeer(peerName);
                if(!peerSocket || !socket.peerName) return;
        
                peerSocket.wrapper.send('signal', { peerName: socket.peerName, signal });
            });

            // WSS Proxy
            socket.wrapper.on('data', ({ peerName, id, type, payload }) => {
                const peerSocket = wss.findPeer(peerName);
                if(!peerSocket || !socket.peerName) return;

                peerSocket.wrapper.send('data', { peerName: socket.peerName, id, type, payload });
            });

            // Connection tracking
            socket.wrapper.on('ping', () => {
                socket.alive = true;
            })
        });

        setInterval(() => {
            wss.clients.forEach(socket => {
                if(!socket.alive){
                    socket.terminate();
                    if(socket.peerName) wss.broadcast('disconnected', {peerName: socket.peerName});
                }

                socket.alive = false;
            });
        }, pingInterval)
    }
}

module.exports = SimpleMeshSignal;