const {WebSocketServer} = require('ws');

function peerProxy(httpServer) {
    const socketServer = new WebSocketServer({server: httpServer});

    socketServer.on('connection', (socket) => {
        console.log('Websocket Connection');
        socket.isAlive = true;

        socket.on('message', function message(data) {
            socketServer.clients.forEach((client) => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        });

        socket.on('pong', () => {
            socket.isAlive = true;
        });

        socket.on('close', (code, reason) => {
            console.log(`Socket Closed: ${code} ${reason}`);
        })

        socket.on('error', (error) => {
            console.log('Websocket Client Error:', error);
        })
    });

    socketServer.on('error', (error) => {
        console.log('Websocket Server Error:', error);
    });

    socketServer.on('close', () => {
        console.log('Websocket Server Closed');
    })

    setInterval(() => {
        socketServer.clients.forEach(function each(client) {
            if (client.isAlive === false) {
                console.log('Websocket Client Terminated');
                return client.close(1000, 'No Response');
            }
            client.isAlive = false;
            client.ping();
        });
    }, 10000);
}

module.exports = { peerProxy };