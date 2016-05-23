'use strict';

class RemoteEventHandler {
  constructor(socket, namespace, events) {
    events.forEach(name => {
      this[name] = function () {
        const args = Array.from(arguments);
        socket.emit(namespace + '/' + name, args);
      };
    });
  }
}

module.exports = RemoteEventHandler;
