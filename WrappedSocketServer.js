const WebSocket = require('ws');

const wrapSocket = (socket) => {
	socket._handlers = {};
	socket.on('message', msg => {
		const { type, payload } = JSON.parse(msg);
		if (!socket._handlers[type]) console.warn('Received unhandled type:', type);
		else socket._handlers[type](payload)
	});

	socket.wrapper = {
		on: (type, handler) => socket._handlers[type] = handler,
		off: (type) => delete socket._handlers[type],
		send: (type, payload) => socket.send(JSON.stringify({type, payload}))
	};
	
	return socket;
}

class WrappedSocketServer extends WebSocket.Server{
    constructor(options){
        super(options);
    }

    broadcast(type, payload, filterFn = null) {
        this.clients.forEach(client => {
            if(client.readyState !== WebSocket.OPEN || (filterFn != null && !filterFn(client))) return;
            client.wrapper.send(type, payload);
        })
    }
    findPeer(peerName) {
        for (const client of this.clients)
            if (client.peerName === peerName && client.readyState === WebSocket.OPEN) return client;
        
        return null;
    }
}

module.exports = { WrappedSocketServer, wrapSocket };