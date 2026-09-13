class EventMessage {
    constructor(from, type, value) {
        this.from = from;
        this.type = type;
        this.value = value;
    }
}

class CalendarClient {
    events = []
    handlers = []

    constructor() {
        let port = window.location.port;
        const protocol = window.location.protocol === "http:" ? "ws" : "wss";
        try {
            this.socket = new WebSocket(`${protocol}://${window.location.hostname}:${port}/ws`);
        } catch (e) {
            console.error("Error connecting to websocket:", e);
        }

        this.socket.onopen = (event) => {
            try {
                this.receiveEvent(new EventMessage("startup-calendar", "system", {msg: "Connected"}));
            } catch (e) {
                console.error("Error receiving event:", e);
            }
        }
        this.socket.onmessage = async (msg) => {
            try {
                const event = JSON.parse(await msg.data.text());
                this.receiveEvent(event);
            } catch (e) {
                console.error("Error receiving event:", e);
            }
        }
        this.socket.onclose = (event) => {
            console.warn("WebSocket closed", {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            });
            this.receiveEvent(new EventMessage("startup-calendar", "system", {msg: "Disconnected"}));
        }
        this.socket.onerror = (error) => {
            console.error("Websocket Error:", error);
        }
    }

    addHandler(handler) {
        this.handlers.push(handler);
    }

    removeHandler(handler) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    receiveEvent(event) {
        this.events.push(event);

        this.events.forEach(event => {
            this.handlers.forEach(async handler => await handler(event));
        })
    }

    broadcastEvent(from, type, msg) {
        const event = new EventMessage(from, type, msg);
        this.socket.send(JSON.stringify(event));
    }
}

const CalendarNotifier = new CalendarClient();
export {CalendarNotifier};