import { uuidv4 } from './utils.js';

export class EventManager {
    constructor() {
        let topics = {}
        this.emit = (topic, ...args) => {
            if (!topics[topic]) {
                return;
            }

            topics[topic].forEach(handler => {
                handler.fct(...args);
            });
        }
    
        this.subscribe = (topic, fct) => {
            if (!topics[topic]) {
                topics[topic] = [];
            }

            const handler = new Handler(fct);
            
            topics[topic].push(handler);
            return handler.id;
        }
    
        this.unsubscribe = (topic, idHandler) => {
            topics[topic] = topics[topic].filter(handler => handler.id !== idHandler);
        }
    }
}

class Handler {
    constructor(fct) {
        this.fct = fct;
        this.id = uuidv4();
    }
}