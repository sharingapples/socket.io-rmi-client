'use strict';
const Common = require('socket.io-rmi');

class RemoteEventHandler {
  constructor(socket, namespace, target) {
    // bugfix. Object.keys was being used previously, but that was not able to
    // get the method names declared in the class
    const props = Object.getOwnPropertyNames(Object.getPrototypeOf(target));

    // Get the list of events available on the target that can be called
    const events = props.filter(name => (
      name.startsWith('on') && typeof target[name] === 'function'
    ));

    Object.defineProperty(this, 'namespace', { value: namespace });
    Object.defineProperty(this, 'events', { value: events });

    events.forEach(name => {
      socket.on(Common.eventName(namespace, name), (args) => {
        target[name].apply(target, args);
      });
    });
  }

  toJSON() {
    return {
      type: Common.TYPE_REMOTE_HANDLER,
      events: this.events,
      namespace: this.namespace,
    };
  }
}

module.exports = RemoteEventHandler;
