'use strict';

const io = require('socket.io-client');
const RemoteListener = require('./RemoteListener');

class ClientInterface {
  constructor(socket, namespace, actions) {
    actions.forEach(name => {
      this[name] = function () {
        return new Promise((resolve, reject) => {
          const args = Array.from(arguments);
          // See if there are any parameters in the list that are RemoteListener
          // those need to be activated with the socket here
          args.forEach(arg => {
            if (arg instanceof RemoteListener) {
              arg.activate(socket, namespace);
            }
          });

          // Get the name of the method with namespace
          const event = namespace + '/' + name;
          socket.emit(event, args, (res) => {
            if (res && typeof res === 'object' && res.type === 'ServerInstance') {
              resolve(new ClientInterface(socket, res.namespace, res.actions));
            } else {
              resolve(res);
            }
          });
        });
      };
    });
  }
}

ClientInterface.connect = function (url, port) {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      jsonp: false,
    });

    // A custom event sent by the server
    socket.on('connected', instance => {
      resolve(new ClientInterface(socket, instance.namespace, instance.actions));
    });
  });
};

module.exports = ClientInterface;
