import { Action } from 'shared/ReactTypes';

export type Dispatch<T> = (action: Action<T>) => void;

export interface Dispatcher {
  useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
  useEffect: (create: () => void | (() => void), deps?: any[] | null) => void;
}

const currentDispatcher: {
  current: Dispatcher | null;
} = {
  current: null
};

export const resolveDispatcher = (): Dispatcher => {
  const dispatcher = currentDispatcher.current;
  if (dispatcher === null) {
    throw new Error(
      'Invalid hook call. Hooks can only be called inside of the body of a function component.'
    );
  }
  return dispatcher;
};

export default currentDispatcher;
