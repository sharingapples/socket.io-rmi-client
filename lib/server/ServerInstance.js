'use strict';
const io = require('socket.io');
const RemoteEventHandler = require('./RemoteEventHandler');

class ServerInstance {
  constructor(srcInstance, namespace, actionMap, socket) {
    this.namespace = namespace;
    this.actions = Object.keys(actionMap);
    this._srcInstance = srcInstance;

    Object.keys(actionMap).forEach(name => {
      const v = actionMap[name];
      const event = namespace + '/' + name;
      socket.on(event, (args, fn) => {
        // Check if there are any arguments that are a remote listener
        // These have to be dealt specially
        args.forEach((arg, index) => {
          if (typeof arg === 'object' && arg.type === 'RemoteListener') {
            const namespace = arg.namespace;
            const events = arg.events;
            args[index] = new RemoteEventHandler(socket, namespace, events);
          }
        });

        // invoke the method
        const res = srcInstance[name].apply(srcInstance, args);
        if (v != null) {
          if (typeof v === 'object') {
            //console.log('Res ', res);
            const instance = new ServerInstance(res, res.constructor.name, v, socket);
            fn(instance);
          } else {
            fn(res);
          }
        } else {
          fn(null);
        }
      });
    });
  }

  toJSON() {
    return {
      type: 'ServerInstance',
      namespace: this.namespace,
      actions: this.actions,
    };
  }
}

ServerInstance.start = function (app, root, actionMap) {
  io(app).on('connection', socket => {
    const instance = new ServerInstance(root, '', actionMap, socket);
    socket.emit('connected', instance);
  });
};

module.exports = ServerInstance;
