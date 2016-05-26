### socket.io-rmi-client
A RMI library using socket.io

### Installation
#### Using as a common js module
```bash
$ npm install --save socket.io-rmi-client
$ npm install --save socket.io-client
```

#### Directly using within the browser with script tag
Download the javascript files `socket.io-rmi-client.js` or its minified version `socket.io-rmi-client.min.js` available within the `umd` folder
in the download .tar.gz file.

You will also need to download `socket.io-client` files separately

```html
<script src='/path/to/socket.io-client.js'></script>
<script src='/path/to/socket.io-rmi-client.js'></script>
```

### Usage
```javascript
import Client from 'socket.io-rmi-client';
import io from 'socket.io-client';

Client.connect(io, 'ws://server:port').then(instance => {

  // Simple RMI calls, return's their result through Promise
  instance.rmiMethod1().then(res => {

  });

  // The RMI calls can also include callbacks that are invoked by the
  // server side code
  instance.rmiMethod2('param1', function () => {
    // this callback is invoked through the server
  });

  class EventHandler {
    constructor() {
      // IMPORTANT this property need to be set to true
      this.isEventHandler: true;
    }

    // The event callback must be prefixed with 'on'. This method will be
    // invoked from the server
    onServerRaised(p1, p2) {

    }
  }

  // The RMI calls can also pass over event handlers that can consist of a
  // number of event callbacks that are invoked by the server
  instance.rmiMethod3('someparam', new EventHandler());
});


```
