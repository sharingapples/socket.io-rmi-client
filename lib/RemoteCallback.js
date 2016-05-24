'use strict';

const Common = require('socket.io-rpc-common');

// Generate a unique id for each RemoteCallback instance created
let uniqueId = 0;

class RemoteCallback {
  constructor(socket, namespace, fn) {
    this.id = ++uniqueId;
    this.namespace = namespace;
    socket.on(Common.callbackEventName(namespace, id), (args) => {
      fn.apply(null, args);
    });
  }

  toJSON() {
    return {
      type: Common.TYPE_CALLBACK,
      namespace: this.namespace,
      id: this.id,
    };
  }
}

module.exports = RemoteCallback;
