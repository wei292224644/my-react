import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './ReactFiber';
import internals from 'shared/Internals';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
  Update,
  UpdateQueue
} from './Update';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { Lane, Lanes, NoLane, SyncLane } from './ReactFiberLane';
import { HasEffect, HookFlags, Passive } from './ReactFiberEffectTags';
import { PassiveMask } from './ReactFiberFlags';

const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hooks | null = null;
let currentHook: Hooks | null = null;
let renderLane: Lane = NoLane;

interface Hooks {
  memoizedState: any;
  updateQueue: unknown;
  next: Hooks | null;
}

export type Effect = {
  tag: HookFlags;
  create: () => void | (() => void);
  destroy: void | (() => void);
  deps: any[] | null;
  next: Effect | null;
};

export type FunctionComponentUpdateQueue = {
  lastEffect: Effect | null;
};

export const renderWithHooks = (workInProgress: FiberNode, lane: Lane) => {
  //赋值操作
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;
  renderLane = lane;

  const current = workInProgress.alternate;

  if (current !== null) {
    //update
    currentDispatcher.current = HookDispatcherOnUpdate;
  } else {
    //mount
    currentDispatcher.current = HookDispatcherOnMount;
  }

  const Component = workInProgress.type;
  const props = workInProgress.pendingProps;
  const chilren = Component(props);

  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  renderLane = NoLane;

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
  const lane = requestUpdateLane(fiber);
  const update = createUpdate<State>(action, lane);
  enqueueUpdate<State>(queue, update);
  scheduleUpdateOnFiber(fiber, lane);
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

const updateState: Dispatcher['useState'] = <State>(): [State, Dispatch<State>] => {
  const hook = updateWorkInProgressHook();

  //计算新的state
  const queue = hook.updateQueue as UpdateQueue<State>;
  const pending = queue.shared.pending;

  if (pending !== null) {
    const { memoizedState } = processUpdateQueue(hook.memoizedState, pending, renderLane);
    hook.memoizedState = memoizedState;
  }

  queue.shared.pending = null;

  return [hook.memoizedState, queue.dispatch as Dispatch<State>];
};

const updateWorkInProgressHook = (): Hooks => {
  // TODO: render阶段触发更新时的逻辑

  let nextCurrentHook: Hooks | null;

  if (currentHook === null) {
    // 这是 FC 第一个 hook
    const currentFiber = currentlyRenderingFiber?.alternate;

    if (currentFiber !== null) {
      nextCurrentHook = currentFiber?.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // 不是第一个 hook
    nextCurrentHook = currentHook.next;
  }

  if (nextCurrentHook === null) {
    // 比如说上次 FC 用了 2 个 hook，这次只用 1 个 hook，就会出现这种情况
    throw new Error('组件的hook比上一次多');
  }

  currentHook = nextCurrentHook;

  const newHook: Hooks = {
    memoizedState: currentHook!.memoizedState,
    updateQueue: currentHook!.updateQueue,
    next: null
  };

  if (workInProgressHook === null) {
    //这是第一个hook
    if (currentlyRenderingFiber === null) {
      throw new Error('请在函数组件内调用hook');
    } else {
      workInProgressHook = newHook;
      currentlyRenderingFiber.memoizedState = workInProgressHook;
    }
  } else {
    //不是第一个hook
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }
  return workInProgressHook;
};

const mountEffect: Dispatcher['useEffect'] = (create: () => void | (() => void), deps?: any[] | null) => {
  const hook = mountWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber!.flags |= PassiveMask;
  hook.memoizedState = pushEffect(Passive | HasEffect, create, undefined, nextDeps);
  console.log('mountEffect', currentlyRenderingFiber);
};

const updateEffect: Dispatcher['useEffect'] = (create: () => void | (() => void), deps?: any[] | null) => {
  const hook = updateWorkInProgressHook();

  console.log('updateEffect', hook);
};

const createFunctionComponentUpdateQueue = (): FunctionComponentUpdateQueue => {
  return {
    lastEffect: null
  };
};

const pushEffect = (
  hookFlags: HookFlags,
  create: () => void | (() => void),
  destroy: void | (() => void),
  deps: any[] | null
): Effect => {
  const effect: Effect = {
    tag: hookFlags,
    create,
    destroy,
    deps,
    next: null
  };

  const fiber = currentlyRenderingFiber!;
  let updateQueue = fiber.updateQueue as unknown as FunctionComponentUpdateQueue;

  if (updateQueue === null) {
    updateQueue = createFunctionComponentUpdateQueue();
    fiber.updateQueue = updateQueue as unknown as UpdateQueue<unknown>;

    effect.next = effect;
    updateQueue.lastEffect = effect;
  } else {
    const lastEffect = updateQueue.lastEffect;
    if (lastEffect === null) {
      effect.next = effect;
      updateQueue.lastEffect = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      updateQueue.lastEffect = effect;
    }
  }

  return effect;
};

const HookDispatcherOnMount: Dispatcher = {
  useState: mountState,
  useEffect: mountEffect
};

const HookDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
  useEffect: updateEffect
};

export const requestUpdateLane = (fiber: FiberNode) => {
  return SyncLane;
};
