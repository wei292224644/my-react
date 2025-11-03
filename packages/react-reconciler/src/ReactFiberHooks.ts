import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './ReactFiber';
import internals from 'shared/Internals';
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './Update';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hooks | null = null;

interface Hooks {
  memoizedState: any;
  updateQueue: unknown;
  next: Hooks | null;
}

export const renderWithHooks = (workInProgress: FiberNode) => {
  //赋值操作
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;

  const current = workInProgress.alternate;

  if (current !== null) {
    //update
  } else {
    //mount
    currentDispatcher.current = HookDispatcherOnMount;
  }

  const Component = workInProgress.type;
  const props = workInProgress.pendingProps;
  const chilren = Component(props);

  currentlyRenderingFiber = null;

  return chilren;
};

const mountState: Dispatcher['useState'] = <State>(initialState: Action<State>): [State, Dispatch<State>] => {
  const hook = mountWorkInProgressHook();

  let memoizedState: State;
  if (typeof initialState === 'function') {
    memoizedState = (initialState as () => State)();
  } else {
    memoizedState = initialState;
  }

  const queue = createUpdateQueue<State>();
  hook.updateQueue = queue;
  hook.memoizedState = memoizedState;

  if (currentlyRenderingFiber === null) {
    throw new Error('请在函数组件内调用hook');
  }

  //@ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
  queue.dispatch = dispatch;

  return [memoizedState, dispatch];
};

const dispatchSetState = <State>(fiber: FiberNode, queue: UpdateQueue<State>, action: Action<State>) => {
  const update = createUpdate<State>(action);
  enqueueUpdate<State>(queue, update);
  scheduleUpdateOnFiber(fiber);
};

const mountWorkInProgressHook = (): Hooks => {
  const hook: Hooks = {
    memoizedState: null,
    updateQueue: null,
    next: null
  };

  if (workInProgressHook === null) {
    //这是第一个hook
    if (currentlyRenderingFiber === null) {
      throw new Error('请在函数组件内调用hook');
    } else {
      workInProgressHook = hook;
      currentlyRenderingFiber.memoizedState = workInProgressHook;
    }
  } else {
    //不是第一个hook
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }
  return workInProgressHook;
};

const HookDispatcherOnMount: Dispatcher = {
  useState: mountState
};
