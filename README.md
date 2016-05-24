### socket.io-rmi-client
A RMI library using socket.io

### Usage
```javascript
import Client from 'socket.io-rmi-client';
import io from 'socket.io-client';


Client.connect(io, 'ws://server:port').then(instance => {
  instance.rpcMethod1().then(res => {

  });
});
```
