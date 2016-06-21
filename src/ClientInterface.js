'use strict';

const Common = require('socket.io-rmi');
const RemoteEventHandler = require('./RemoteEventHandler');

class EventHandler {

}

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
              } else if (arg instanceof EventHandler) {
                // Check if the argument is an event handler, in which case we need
                // to create remote listener to handle the remote events
                args[index] = new RemoteEventHandler(socket, namespace, arg);
              }
            }
          });

          // Get the name of the method with namespace
          socket.emit(Common.eventName(namespace, name), args, (res) => {
            if (res && typeof res === 'object') {
              if (res.type === Common.TYPE_REMOTE_INSTANCE) {
                resolve(new ClientInterface(socket, res.namespace, res.actions));
              } else if (res.type === Common.EVENT_ERROR) {
                reject(res.error);
              }
            } else {
              resolve(res);
            }
          });
        });
      };
    });
  }
}

/**
 * Create a event handler instance that could be passed on a RPC call
 * @return {EventHandler} An event handler instance on which event callbacks
 *                        should be defined.
 */
ClientInterface.createEventHandler = function () {
  return new EventHandler();
};

ClientInterface.connect = function (io, url) {
  const res = { };
  let socket = null;

  res.disconnect = function () {
    socket.close();
  };

  const connect = function () {
    socket = io(url, {
      jsonp: false,
    });

    // A custom event sent by the server
    socket.on(Common.EVENT_CONNECTED, instance => {
      const serverInstance = new ClientInterface(socket, instance.namespace, instance.actions);
      if (typeof res.onConnected === 'function') {
        res.onConnected(serverInstance);
      } else {
        console.error('The onConnected callback is not defined');
      }
    });

    socket.on('disconnect', () => {
      // Clear out the existing socket
      socket.close();

      if (typeof res.onDisconnected === 'function') {
        res.onDisconnected();
      } else {
        console.error('The onDisconnected callback is not defined.');
      }

      // Try to reconnect
      connect();
    });

    socket.on(Common.EVENT_ERROR, error => {
      // The error occured some other place during a method invokation,
      if (typeof res.onError === 'function') {
        res.onError(error);
      } else {
        console.error('An error occurred in socket.io-rmi-client', error);
        console.error('No error handler declared to handle the error.',
                      'Define a function named `onError` on the interface',
                      'provided after the remote connection to handle this error');
      }
    });

    socket.on('error', (error) => {
      if (typeof res.onError === 'function') {
        res.onError(error);
      } else {
        console.error('An error occurred in socket.io-rmi-client', error);
        console.error('No error handler declared to handle the error.',
                      'Define a function named `onError` on the interface',
                      'provided after the remote connection to handle this error');
      }
    });
  };

  connect();

  return res;
};

ClientInterface.EventHandler = EventHandler;

module.exports = ClientInterface;
