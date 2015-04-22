import App from '../lib/app';
import Router from '../lib/router';
import MainComponent from './mainComponent'
import GreeterComponent from './greeterComponent'

export default class GreeterApp extends App {

  constructor(rootElement, firstName, lastName) {
    super(rootElement);

    var routerState = new Router(this, {

      '/': (match, routerComponentPath) => {
        return new MainComponent(this, routerComponentPath.concat('greeterComponent'));
      },

      '/greeter/:firstName/:lastName': (match, routerComponentPath) => {
        return new GreeterComponent(this, routerComponentPath.concat('greeterComponent'), {
          firstName: match.params.firstName,
          lastName: match.params.lastName
        });
      }

    });
    this.start(routerState);
    this.state.component.onPopStateHandler(); // FIXME: we "initialize" router here. we can't do it before `super` call
  }

};