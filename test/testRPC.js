'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Common = require('socket.io-rmi');
const Server = require('socket.io-rmi-server');
const Client = require('../src/index');

const testApp = require('http').createServer((req, res) => {
  res.writeHead(200);
  res.end('socket.io-rmi test http server');
});
const io = require('socket.io')(testApp);
const clientIO = require('socket.io-client');

class TestClass {
  rpcMethod1() {
    return 1;
  }

  rpcMethod2(a, b) {
    return a + b;
  }

  addHook(a, handler) {
    this.handler = handler;
    return a;
  }

  callHook(hook, p1, p2, p3) {
    this.handler[hook](p1, p2, p3);
  }

  getAnotherInstance() {
    return new TestClass();
  }

  callForSimpleError(a, b) {
    throw new Error('Simple Error');
  }

  callForUncatchableError(a, b) {
    throw new Common.UncatchableError('Error', 'An uncatchable Error');
  }
}

class EventHandler extends Client.EventHandler {
  constructor() {
    super();

    // Test property that shouldn't be send over
    this.onAbsurd = false;
  }

  onTestEvent (p1, p2, p3) {
    console.log('onTestEvent invoked');
  }

  onTestEvent2 (p1) {
    console.log('onTestEvent2 invoked');
  }

  absurdFunc () {

  }
}
const actionMap = {
  rpcMethod1: 'number',
  rpcMethod2: 'number',
  addHook: 'mixed',
  callHook: null,
  callForSimpleError: null,
  callForUncatchableError: null,
};
actionMap.getAnotherInstance = actionMap;

// Start the server application
Server.start(io, TestClass, actionMap);

testApp.listen(0, () => {
  const port = testApp.address().port;
  console.log('Listening at port ', port);

  describe('Simple RPC calls', function () {
    it('checks server side call', function () {
      return new Promise((resolve, reject) => {
        const client = Client.create(clientIO, 'ws://localhost:' + port);
        client.onConnected = (instance) => {
          resolve(Promise.all([
            instance.rpcMethod1(),
            instance.rpcMethod2(1, 5),
            instance.rpcMethod1(),
            instance.rpcMethod2(6, 9),
          ]).then(res => {
            expect(res[0]).to.equal(1);
            expect(res[1]).to.equal(6);
            expect(res[2]).to.equal(1);
            expect(res[3]).to.equal(15);
          }));
        };

        client.connect();
      });
    });

    // it('checks if RemoteEventHandler is created correctly or not', function () {
    //   const r = new RemoteEventHandler(listener);
    //   expect(r.events.length).to.equal(2);
    //   expect(r.events[0]).to.equal('onTestEvent');
    //   expect(r.events[1]).to.equal('onTestEvent2');
    // });

    it('checks call with hook parameters', function () {
      const listener = new EventHandler();
      const url = 'ws://localhost:' + port;
      return new Promise((resolve, reject) => {
        const conn = Client.create(clientIO, url);
        conn.onConnected = (instance) => {
          resolve(instance.addHook('test', listener).then(res => {
            const mockListener = sinon.mock(listener);
            mockListener.expects('onTestEvent').once().withArgs(1, 2, 3);
            expect(res).to.equal('test');
            return instance.callHook('onTestEvent', 1, 2, 3).then(res => {
              mockListener.verify();
            });
          }));
        };

        conn.connect();
      });
    });

    // it('checks if RemoteEventHandler is created correctly or not', function () {
    //   const r = new RemoteEventHandler(listener);
    //   expect(r.events.length).to.equal(2);
    //   expect(r.events[0]).to.equal('onTestEvent');
    //   expect(r.events[1]).to.equal('onTestEvent2');
    // });

    it('checks call with EventHandler parameter', function () {
      const listener = Client.createEventHandler();
      listener.onTestEvent = function (p1, p2, p3) {
        // Dummy event callback
      };

      const url = 'ws://localhost:' + port;
      return new Promise((resolve, reject) => {
        const conn = Client.create(clientIO, url);
        conn.onConnected = (instance) => {
          resolve(instance.addHook('test', listener).then(res => {
            const mockListener = sinon.mock(listener);
            mockListener.expects('onTestEvent').once().withArgs(1, 2, 3);
            expect(res).to.equal('test');
            return instance.callHook('onTestEvent', 1, 2, 3).then(res => {
              mockListener.verify();
            });
          }));
        };

        conn.connect();
      });
    });

    it('checks for disconnect event', function () {
      const url = 'ws://localhost:' + port;
      return new Promise((resolve, reject) => {
        const res = Client.create(clientIO, url);
        res.onConnected = function (instance) {
          expect(instance).to.not.equal(null);
          res.disconnect();
        };

        res.onDisconnected = function () {
          resolve(true);
        };

        res.connect();
      });
    });

    it('checks for server instance return type', function () {
      const url = 'ws://localhost:' + port;
      return new Promise((resolve, reject) => {
        const conn = Client.create(clientIO, url);
        conn.onConnected = (instance) => {
          resolve(instance.getAnotherInstance().then(anotherInstance => (
            Promise.all([
              anotherInstance.rpcMethod1(),
              anotherInstance.rpcMethod2(6, 8),
              instance.rpcMethod1(),
              instance.rpcMethod2(3, -8),
            ]).then(res => {
              expect(res[0]).to.equals(1);
              expect(res[1]).to.equals(14);
              expect(res[2]).to.equals(1);
              expect(res[3]).to.equals(-5);
            })
          )));
        };

        conn.connect();
      });
    });

    it('checks for error handling', function () {
      const url = 'ws://localhost:' + port;
      return new Promise((resolve, reject) => {
        const conn = Client.create(clientIO, url);
        conn.onConnected = (instance) => {
          resolve(instance.callForSimpleError(1, 2).catch(err => {
            expect(err.message).to.equal('Simple Error');
          }));
        };

        conn.connect();
      });
    });

    it('checks for uncatchable error', function (done) {
      const url = 'ws://localhost:' + port;
      const client = Client.create(clientIO, url);
      client.onConnected = (instance) => {
        instance.callForUncatchableError(1, 2);
      };

      client.onError = (err) => {
        //console.log(err);
        expect(err.message).to.equal('An uncatchable Error');
        done();
      };

      client.connect();
    });
  });

  // This test is run with --delay flag, so the following run() method needs
  // to be invoked at the end to run all the tests
  run();
});
