const { WrappedSocketServer, wrapSocket } = require('./WrappedSocketServer');

class SimpleMeshSignal {
    constructor(options){
        const wss = new WrappedSocketServer(options);
        
        wss.on('connection', socket => {
            socket = wrapSocket(socket);
        
            socket.wrapper.on('discover', ({ peerName }) => {
                socket.peerName = peerName;
                wss.broadcast('discovered', { peerName }, x=>x.peerName !== peerName);
            });
        
            socket.wrapper.on('signal', ({ peerName, signal }) => {
                const peerSocket = wss.findPeer(peerName);
                if(!peerSocket || !socket.peerName) return;
        
                peerSocket.wrapper.send('signal', { peerName: socket.peerName, signal });
            });
        });
    }
}

module.exports = SimpleMeshSignal;