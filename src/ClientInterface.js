'use strict';

const Common = require('socket.io-rmi');
const RemoteEventHandler = require('./RemoteEventHandler');

class ClientInterface {
  constructor(socket, namespace, actions) {
    actions.forEach(name => {
      this[name] = function () {
        return new Promise((resolve, reject) => {
          const args = Array.from(arguments);

          // See if there are any parameters in the list that are RemoteEventHandler
          // those need to be activated with the socket here
          args.forEach((arg, index) => {
            if (arg) {
              // make sure arg is not null or undefined
              if (typeof arg === 'function') {
                // the function arguments are called back, make sure the server
                // also uses the same argument signature
                args[index] = new RemoteCallback(socket, namespace);
              } else if (typeof arg === 'object' && arg.isEventHandler) {
                // Check if the argument is an event handler, in which case we need
                // to create remote listener to handle the remote events
                args[index] = new RemoteEventHandler(socket, namespace, arg);
              }
            }
          });

          // Get the name of the method with namespace
          socket.emit(Common.eventName(namespace, name), args, (res) => {
            if (res && typeof res === 'object' && res.type === Common.TYPE_REMOTE_INSTANCE) {
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

ClientInterface.connect = function (io, url) {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      jsonp: false,
    });

    let serverInstance = null;
    // A custom event sent by the server
    socket.on(Common.EVENT_CONNECTED, instance => {
      serverInstance = new ClientInterface(socket, instance.namespace, instance.actions);
      resolve(serverInstance);
    });

    socket.on(Common.EVENT_ERROR, error => {
      if (serverInstance === null) {
        // The error occured while tyring to connect to the server, so just
        // reject this promise
        reject(error);
      } else {
        // The error occured some other place during a method invokation,
        if (typeof serverInstance.onError === 'function') {
          serverInstance.onError(error);
        } else {
          console.error('An error occurred in socket.io-rmi-client', error);
          console.error('No error handler declared to handle the error.',
                        'Define a function named `onError` on the interface',
                        'provided after the remote connection to handle this error');
        }
      }
    });

    socket.on('error', (error) => {
      if (serverInstance === null) {
        reject(error);
      } else {
        if (typeof serverInstance.onError === 'function') {
          serverInstance.onError(error);
        } else {
          console.error('An error occurred in socket.io-rmi-client', error);
          console.error('No error handler declared to handle the error.',
                        'Define a function named `onError` on the interface',
                        'provided after the remote connection to handle this error');
        }
      }
    });
  });
};

module.exports = ClientInterface;
