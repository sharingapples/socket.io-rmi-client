# RMI Client (RPC Client)
[![npm version](https://badge.fury.io/js/socket.io-rmi-client.svg)](https://badge.fury.io/js/socket.io-rmi-client)

The client side library for the [RMI Server](https://github.com/sharingapples/socket.io-rmi-server)
for making Remote Procedure Calls.

The RPC Client uses [socket.io](https://github.com/socketio/socket.io) for
communication over network.

### Installation
#### As a common js module
The library could be used as a common js module as a node client or in a
browser application through bundlers like [webpack](https://webpack.github.io)
or [browserify](http://browserify.org/). The socket.io-client library is not
bundled together so you will have to install the socket.io-client library
as well.

    $ npm install --save socket.io-client
    $ npm install --save socket.io-rmi-client

#### UMD build through npmcdn
The UMD build of the library is available at
[npmcdn](https://npmcdn.com/socket.io-rmi-client@1.0/umd/socket.io-rmi-client.min.js):

```html
<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script src="https://npmcdn.com/socket.io-rmi-client@1.0/umd/socket.io-rmi-client.min.js"></script>
```

### Usage
#### CommonJS module
The RMI Client could be used as a CommonJS modules when used in a node as a
client or in browsers through webpack/browserify or in a ReactNative project.
```javascript
'use strict';
import RMIClient from 'socket.io-rmi-client';
import io from 'socket.io-client';

// Connect to the RPC Server at the given address and port
// In case of browsers, the second argument could be empty
const client = RMIClient.connect(io, 'ws://server:port');
client.onConnected = function (remoteInstance) {
  // This callback is invoked as soon as a remote connection is established.
  // The RPC calls could now be carried on the remoteInstance
  remoteInstance.invoke().then((res) => {
    // The res is available after the remote invocation is completed.
  });

  // make rpc call with callbacks
  remoteInstance.invokeWithCallback(function() {
    // this callback will be called from the server later.
  });

  // get instances than can further make RPC calls
  remoteInstance.getAnotherInstance().then((anotherInstance) => {
    // anotherInstance can now be used to make RPC calls (if the method
    // actually returned a callable instance on the server)
    anotherInstance.invoke().then((res) => {

    });
  });
});

client.onDisconnected = function () {
  // If the client gets disconnected from the server, this method is invoked,
  // this could be taken as an opportunity to update the UI with the
  // disconnected state.
}
```

### Using EventHandler
The RPC calls can also be used to pass EventHandler instances to the server.
The server could raise events on this server as and when needed.

```javascript
// Using Class for creating event handlers
'use strict';
const  RMIClient = require('socket.io-rmi-client');
const io = require('socket.io-client');

// The EventHandler class must be extended from RMIClient.EventHandler
class EventHandler extends RMIClient.EventHandler {
  // The event methods should be prefixed with 'on'
  onEvent() {

  }
}

RMIClient.connect(io, 'ws://localhost').onConnected = function (instance) {
  instance.setEventHandler(new EventHandler());
}
```

```javascript
// Using without declaring classes, most likely using UMD modules
RMIClient.connect(io, 'ws://localhost').onConnected = function (instance) {
  const eventHandler = RMIClient.createEventHandler();
  eventHandler.onEvent = function () {
    // This event will be raised from the server
  }

  instance.setEventHandler(eventHandler);
}
```

### More Documentation
For further more documentation and use cases, check out the
[RMI Server](https://github.com/sharingpples/socket.io-rmi-server).
