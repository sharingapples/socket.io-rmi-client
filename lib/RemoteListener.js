'use strict';

class RemoteListener {
  constructor(target) {
    this.target = target;

    // Get the list of events available on the target that can be called
    this.events = Object.keys(target).filter(name => (
      name.startsWith('on') && typeof target[name] === 'function'
    ));
  }

  activate(socket, namespace) {
    this.namespace = namespace;
    this.events.forEach(name => {
      const event = namespace + '/' + name;
      socket.on(event, (args) => {
        this.target[name].apply(this.target, args);
      });
    });
  }

  toJSON() {
    return {
      type: 'RemoteListener',
      events: this.events,
      namespace: this.namespace,
    };
  }
}

module.exports = RemoteListener;
