'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const io = require('socket.io');
const ServerInstance = require('../lib/server/ServerInstance');
const ClientInterface = require('../lib/client/ClientInterface');
const RemoteListener = require('../lib/client/RemoteListener');

const testApp = require('http').createServer((req, res) => {
  res.writeHead(200);
  res.end('socket.io-rpc test http server');
});

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
}

const actionMap = {
  rpcMethod1: 'number',
  rpcMethod2: 'number',
  addHook: 'mixed',
  callHook: null,
};
actionMap.getAnotherInstance = actionMap;

// Start the server application
ServerInstance.start(testApp, new TestClass(), actionMap);
testApp.listen(0, () => {
  const port = testApp.address().port;
  console.log('Listening at port ', port);

  describe('Simple RPC calls', function () {
    it('checks server side call', function () {
      return ClientInterface.connect('ws://localhost:' + port).then(instance => (
        Promise.all([
          instance.rpcMethod1(),
          instance.rpcMethod2(1, 5),
          instance.rpcMethod1(),
          instance.rpcMethod2(6, 9),
        ]).then(res => {
          expect(res[0]).to.equal(1);
          expect(res[1]).to.equal(6);
          expect(res[2]).to.equal(1);
          expect(res[3]).to.equal(15);
        })
      ));
    });

    const listener = {
      onTestEvent: function (p1, p2, p3) {
        console.log('onTestEvent invoked');
      },

      onTestEvent2: function (p1) {
        console.log('onTestEvent2 invoked');
      },

      onAbsurd: false,

      absurdFunc: function () {

      },
    };

    it('checks if RemoteListener is created correctly or not', function () {
      const r = new RemoteListener(listener);
      expect(r.events.length).to.equal(2);
      expect(r.events[0]).to.equal('onTestEvent');
      expect(r.events[1]).to.equal('onTestEvent2');
    });

    it('checks call with hook parameters', function () {
      const url = 'ws://localhost:' + port;
      return ClientInterface.connect(url).then(instance => (
        instance.addHook('test', new RemoteListener(listener)).then(res => {
          const mockListener = sinon.mock(listener);
          mockListener.expects('onTestEvent').once().withArgs(1, 2, 3);
          expect(res).to.equal('test');
          return instance.callHook('onTestEvent', 1, 2, 3).then(res => {
            mockListener.verify();
          });
        })
      ));
    });

    it('checks for server instance return type', function () {
      const url = 'ws://localhost:' + port;
      return ClientInterface.connect(url).then(instance => (
        instance.getAnotherInstance().then(anotherInstance => (
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
        ))
      ));
    });
  });

  // This test is run with --delay flag, so the following run() method needs
  // to be invoked at the end to run all the tests
  run();
});
