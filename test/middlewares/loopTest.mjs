import tman from 'tman';
import assert from 'assert';
import sinon from 'sinon';
import rafRaf from '../helpers/rafRaf';

import { Loop_VirtualDom as Loop } from '../../middlewares';
import h from 'virtual-dom/h';

tman.mocha();

tman.suite('Loop', function () {
  let loop,
    state, view, viewSpy;

  tman.beforeEach(function () {
    state = {
      property: 'value'
    };
    view = function () {
      return h('div', { class: 'awesome' },
        h('span', null, [ this.property ])
      );
    };
    viewSpy = sinon.spy(view);

    loop = new Loop(viewSpy);
  });

  tman.afterEach(function () {
    sinon.restore();
  });

  tman.suite('constructor', function () {
    tman.test('should construct an instance of Loop', function () {
      assert.ok(loop instanceof Loop);
    });
  });

  tman.suite('.view', function () {
    tman.test('should return view', function () {
      assert.strictEqual(loop.view, viewSpy);
    });
  });

  tman.suite('.target', function () {
    tman.test('should be defined', function () {
      assert.notStrictEqual(loop.target, undefined);
    });
  });

  tman.suite('.redraw', function () {
    tman.test('should call .view function', function (done) {
      viewSpy.resetHistory();

      loop.redraw();

      rafRaf(() => {
        assert.ok(viewSpy.calledOnce);
        assert.ok(viewSpy.calledWithExactly());
        assert.ok(viewSpy.calledOn(undefined));  // try to check here if not rebound

        done();
      });
    });

    tman.test('should not re-render target until state has been changed', function (done) {
      loop.redraw();

      rafRaf(() => {
        assert.strictEqual(loop.target.childNodes[0].childNodes[0].data, 'value');

        done();
      });
    });

    tman.test('should re-render target since state has been changed', function (done) {
      state.property = 'new value';
      loop.redraw();

      rafRaf(() => {
        assert.strictEqual(loop.target.childNodes[0].childNodes[0].data, 'new value');

        done();
      });
    });
  });
});
