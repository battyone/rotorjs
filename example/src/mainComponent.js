import { Component } from 'rotorjs';

import h from 'virtual-dom/h';

export default class MainComponent extends Component {

  constructor(application, parent = null, name = 'main') {
    let initialState = {};
    super(application, parent, name, initialState);
  }

  render() {
    return <div>
      Hello! <a href="#greeter/FirstName/LastName">Click here</a>!
      <br />
      Or try to visit an invalid <a href="#invalid">link</a>.
    </div>;
  }

}