import {
  Cursor_FreezerJs as Cursor,
  Loop_VirtualDom as Loop,
  PathNode_TinyPathMatcher as PathNode
} from '../../middlewares';
import { getRotorJsClasses } from '../../index';

const middleware = {
  Cursor,
  Loop,
  PathNode
};

const {
  Application,
  Component,
  RouterComponent
} = getRotorJsClasses(middleware);

export {
  Application,
  Component,
  RouterComponent
};