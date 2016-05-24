'use strict';
const Common = require('socket.io-rpc-common');

class RemoteEventHandler {
  constructor(socket, namespace, target) {
    // Get the list of events available on the target that can be called
    const events = Object.keys(target).filter(name => (
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
