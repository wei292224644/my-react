import currentDispatcher, { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import { jsx } from './src/jsx';

export const useState: Dispatcher['userState'] = (initialState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.userState(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher
};

export const version = '0.0.1';
export const createElement = jsx;
