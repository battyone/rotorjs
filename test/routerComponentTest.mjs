import tman from 'tman';
import assert from 'assert';
import sinon from 'sinon';

import {
  Application,
  Component,
  RouterComponent
} from './helpers/rotorJsClasses';

import { PathNode } from 'tiny-path-matcher';
import h from 'virtual-dom/h';

tman.mocha();

let sandbox;

tman.suite('RouterComponent', function () {
  let application,
    rootPathNode, usersPathNode, usersUserPathNode, aboutPathNode,
    aboutUri, usersInactiveUri, usersUserUri, usersUserWrongUri,
    routerComponent,
    aboutComponent, aboutComponentRenderResult,
    aboutComponentInitializer, aboutComponentInitializerSpy,
    userComponent,
    userComponentInitializer, userComponentInitializerSpy;

  tman.beforeEach(function () {
    sandbox = sinon.sandbox.create();

    application = new Application();
    application.render = function () {  // avoid routerComponent.renderInvalidRoute at application start
      return h('span');
    };
    application.__renderBinded = application.render.bind(application);

    aboutComponentRenderResult = h('span', { id: 'about' }, [
      'About'
    ]);
    aboutComponentInitializer = function (matchedPathNode, matchedPathArguments, routerComponent) {  // eslint-disable-line no-unused-vars
      aboutComponent = new Component(application, routerComponent, 'aboutComponentName');
      sandbox.stub(aboutComponent, 'render');
      aboutComponent.render.returns(aboutComponentRenderResult);
      sandbox.spy(aboutComponent, 'deactivate');
      return aboutComponent;
    };
    aboutComponentInitializerSpy = sandbox.spy(aboutComponentInitializer);

    userComponentInitializer = function (matchedPathNode, matchedPathArguments, routerComponent) {  // eslint-disable-line no-unused-vars
      userComponent = new Component(application, routerComponent, 'userComponentName');
      sandbox.spy(userComponent, 'activate');
      return userComponent;
    };
    userComponentInitializerSpy = sandbox.spy(userComponentInitializer);

    rootPathNode = new PathNode();
    aboutPathNode = new PathNode('about', { initializer: aboutComponentInitializerSpy });
    usersPathNode = new PathNode('users');
    usersUserPathNode = new PathNode(/^(?<userId>\d+?)$/, { initializer: userComponentInitializerSpy });

    rootPathNode.push(usersPathNode);
    rootPathNode.push(aboutPathNode);
    usersPathNode.push(usersUserPathNode);

    aboutUri = 'about';
    usersInactiveUri = 'users';
    usersUserUri = 'users/12';
    usersUserWrongUri = 'users/NaN';

    routerComponent = new RouterComponent(application, null, 'routerComponentName', rootPathNode);

    application.start(routerComponent);
  });

  tman.afterEach(function () {
    application.stop();

    sandbox.restore();
  });

  tman.suite('constructor', function () {
    tman.test('should construct a RouterComponent instance', function () {
      assert.ok(routerComponent instanceof RouterComponent);
      assert.ok(routerComponent instanceof Component);
    });

    tman.test('should accept 4 arguments', function () {
      const anotherRouterComponent = new RouterComponent(application, null, 'routerComponentName', rootPathNode);

      assert.ok(anotherRouterComponent instanceof RouterComponent);
      assert.ok(anotherRouterComponent instanceof Component);
    });

    tman.test('should accept 3 arguments', function () {
      const anotherRouterComponent = new RouterComponent(application, null, 'routerComponentName');

      assert.ok(anotherRouterComponent instanceof RouterComponent);
      assert.ok(anotherRouterComponent instanceof Component);
    });
  });

  tman.suite('.currentComponentName', function () {
    tman.test('should be undefined after construction', function () {
      assert.strictEqual(routerComponent.currentComponentName, undefined);
    });
  });

  tman.suite('.currentComponent', function () {
    tman.test('should be undefined after construction', function () {
      assert.strictEqual(routerComponent.currentComponent, undefined);
    });
  });

  tman.suite('.renderInvalidRoute', function () {
    tman.test('isn\'t implemented', function () {
      assert.throws(function () {
        routerComponent.renderInvalidRoute();
      }, /Not implemented/);
    });
  });

  tman.suite('.render', function () {
    tman.test('should return result of .renderInvalidRoute', function () {
      const routerComponentRenderInvalidRouteResult = h('span');
      sandbox.stub(routerComponent, 'renderInvalidRoute').returns(routerComponentRenderInvalidRouteResult);

      const result = routerComponent.render();

      assert.ok(routerComponent.renderInvalidRoute.calledOnce);
      assert.ok(routerComponent.renderInvalidRoute.calledWithExactly());
      assert.ok(routerComponent.renderInvalidRoute.calledOn(routerComponent));
      assert.strictEqual(result, routerComponentRenderInvalidRouteResult);
    });
  });

  tman.suite('.route', function () {
    tman.suite('with correct path', function () {
      tman.test('should return true', function () {
        const result = routerComponent.route(aboutUri);

        assert.strictEqual(result, true);
      });

      tman.test('should call correct initializer', function () {
        userComponentInitializerSpy.reset();

        routerComponent.route(usersUserUri);

        assert.ok(userComponentInitializerSpy.calledOnce);
        assert.ok(userComponentInitializerSpy.calledOn(undefined));
        assert.strictEqual(userComponentInitializerSpy.firstCall.args[0], usersUserPathNode);
        assert.deepEqual(userComponentInitializerSpy.firstCall.args[1], { userId: '12' });
        assert.strictEqual(userComponentInitializerSpy.firstCall.args[2], routerComponent);
      });

      tman.test('should not call other initializers', function () {
        aboutComponentInitializerSpy.reset();

        routerComponent.route(usersUserUri);

        assert.ok(aboutComponentInitializerSpy.notCalled);
      });

      tman.test('should activate new component', function () {
        routerComponent.route(usersUserUri);

        assert.ok(userComponent.activate.calledOnce);
        assert.ok(userComponent.activate.calledWithExactly());
        assert.ok(userComponent.activate.calledOn(userComponent));
      });

      tman.test('should activate new component after adding it to the state', function () {
        userComponent.oldActivate = userComponent.activate;
        userComponent.activate = function (...args) {
          assert.strictEqual(routerComponent.currentComponentName, 'userComponentName');
          assert.strictEqual(routerComponent.currentComponent, userComponent);
          return this.oldActivate(...args);
        };

        routerComponent.route(usersUserUri);
      });
    });

    tman.suite('with incorrect path', function () {
      tman.test('should return false', function () {
        const result = routerComponent.route(usersUserWrongUri);

        assert.strictEqual(result, false);
      });

      tman.test('should not call initializers', function () {
        aboutComponentInitializerSpy.reset();
        userComponentInitializerSpy.reset();

        routerComponent.route(usersUserWrongUri);

        assert.ok(aboutComponentInitializerSpy.notCalled);
        assert.ok(userComponentInitializerSpy.notCalled);
      });
    });

    tman.suite('with inactive path', function () {
      tman.test('should return null', function () {
        const result = routerComponent.route(usersInactiveUri);

        assert.strictEqual(result, null);
      });

      tman.test('should not call initializers', function () {
        aboutComponentInitializerSpy.reset();
        userComponentInitializerSpy.reset();

        routerComponent.route(usersInactiveUri);

        assert.ok(aboutComponentInitializerSpy.notCalled);
        assert.ok(userComponentInitializerSpy.notCalled);
      });
    });
  });

  tman.suite('after .route with correct path', function () {
    tman.beforeEach(function () {
      routerComponent.route(aboutUri);
    });

    tman.suite('.currentComponentName', function () {
      tman.test('should be equal to respective component name', function () {
        assert.strictEqual(routerComponent.currentComponentName, 'aboutComponentName');
      });
    });

    tman.suite('.currentComponent', function () {
      tman.test('should refer to respective component', function () {
        assert.strictEqual(routerComponent.currentComponent, aboutComponent);
      });
    });

    tman.suite('.render', function () {
      tman.test('should return result of correct component\'s .render', function () {
        aboutComponent.render.reset();

        const result = routerComponent.render();

        assert.ok(aboutComponent.render.calledOnce);
        assert.ok(aboutComponent.render.calledWithExactly());
        assert.ok(aboutComponent.render.calledOn(aboutComponent));
        assert.strictEqual(result, aboutComponentRenderResult);
      });
    });


    tman.suite('.deactivate', function () {
      tman.test('should deactivate subcomponents', function () {
        aboutComponent.deactivate.reset();

        routerComponent.deactivate();

        assert.ok(aboutComponent.deactivate.calledOnce);
        assert.ok(aboutComponent.deactivate.calledWithExactly());
        assert.ok(aboutComponent.deactivate.calledOn(aboutComponent));
      });

      tman.test('should remove subcomponents', function () {
        routerComponent.deactivate();

        assert.deepEqual(routerComponent.subcomponentNames, []);
        assert.throws(function () {
          routerComponent.getSubcomponent('aboutComponentName');
        }, /Subcomponent 'aboutComponentName' doesn't exist/);
      });
    });

    tman.suite('.route', function () {
      tman.suite('with correct path', function () {
        tman.test('should return true', function () {
          const result = routerComponent.route(usersUserUri);

          assert.strictEqual(result, true);
        });

        tman.test('should deactivate old component', function () {
          routerComponent.route(usersUserUri);

          assert.ok(aboutComponent.deactivate.calledOnce);
          assert.ok(aboutComponent.deactivate.calledWithExactly());
          assert.ok(aboutComponent.deactivate.calledOn(aboutComponent));
        });

        tman.test('should activate new component', function () {
          routerComponent.route(usersUserUri);

          assert.ok(userComponent.activate.calledOnce);
          assert.ok(userComponent.activate.calledWithExactly());
          assert.ok(userComponent.activate.calledOn(userComponent));
        });

        tman.test('should activate new component after deactivating old component', function () {
          routerComponent.route(usersUserUri);

          assert.ok(userComponent.activate.calledAfter(aboutComponent.deactivate));
        });
      });

      tman.suite('with incorrect path', function () {
        tman.test('should return false', function () {
          const result = routerComponent.route(usersUserWrongUri);

          assert.strictEqual(result, false);

        });

        tman.test('should not call initializers', function () {
          aboutComponentInitializerSpy.reset();
          userComponentInitializerSpy.reset();

          routerComponent.route(usersUserWrongUri);

          assert.ok(aboutComponentInitializerSpy.notCalled);
          assert.ok(userComponentInitializerSpy.notCalled);
        });
      });
    });
  });

  tman.suite('after .route with incorrect path', function () {
    tman.beforeEach(function () {
      routerComponent.route(usersUserWrongUri);
    });

    tman.suite('.currentComponentName', function () {
      tman.test('should be null', function () {
        assert.strictEqual(routerComponent.currentComponentName, null);
      });
    });

    tman.suite('.currentComponent', function () {
      tman.test('should be null', function () {
        assert.strictEqual(routerComponent.currentComponent, null);
      });
    });

    tman.suite('.render', function () {
      tman.test('should return result of .renderInvalidRoute', function () {
        const routerComponentRenderInvalidRouteResult = h('span');
        sandbox.stub(routerComponent, 'renderInvalidRoute').returns(routerComponentRenderInvalidRouteResult);

        const result = routerComponent.render();

        assert.ok(routerComponent.renderInvalidRoute.calledOnce);
        assert.ok(routerComponent.renderInvalidRoute.calledWithExactly());
        assert.ok(routerComponent.renderInvalidRoute.calledOn(routerComponent));
        assert.strictEqual(result, routerComponentRenderInvalidRouteResult);
      });
    });

    tman.suite('.route', function () {
      tman.suite('with correct path', function () {
        tman.test('should return true', function () {
          const result = routerComponent.route(usersUserUri);

          assert.strictEqual(result, true);
        });

        tman.test('should activate new component', function () {
          routerComponent.route(usersUserUri);

          assert.ok(userComponent.activate.calledOnce);
          assert.ok(userComponent.activate.calledWithExactly());
          assert.ok(userComponent.activate.calledOn(userComponent));
        });
      });

      tman.suite('with incorrect path', function () {
        tman.test('should return false', function () {
          const result = routerComponent.route(usersUserWrongUri);

          assert.strictEqual(result, false);
        });

        tman.test('should not call initializers', function () {
          aboutComponentInitializerSpy.reset();
          userComponentInitializerSpy.reset();

          routerComponent.route(usersUserWrongUri);

          assert.ok(aboutComponentInitializerSpy.notCalled);
          assert.ok(userComponentInitializerSpy.notCalled);
        });
      });

      tman.suite('with inactive path', function () {
        tman.test('should return null', function () {
          const result = routerComponent.route(usersInactiveUri);

          assert.strictEqual(result, null);
        });

        tman.test('should not call initializers', function () {
          aboutComponentInitializerSpy.reset();
          userComponentInitializerSpy.reset();

          routerComponent.route(usersInactiveUri);

          assert.ok(aboutComponentInitializerSpy.notCalled);
          assert.ok(userComponentInitializerSpy.notCalled);
        });
      });
    });
  });
});