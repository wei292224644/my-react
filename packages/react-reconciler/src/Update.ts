import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane } from './ReactFiberLane';

export interface Update<State> {
  action: Action<State>;
  lane: Lane;
  next: Update<State> | null;
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
  dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(action: Action<State>, lane: Lane) => {
  return {
    action,
    lane,
    next: null
  };
};

export const createUpdateQueue = <State>() => {
  return {
    shared: {
      pending: null
    },
    dispatch: null
  } as UpdateQueue<State>;
};

export const enqueueUpdate = <State>(updateQueue: UpdateQueue<State>, update: Update<State>) => {
  const pending = updateQueue.shared.pending;

  if (pending === null) {
    // a -> a
    update.next = update;
  } else {
    // update = b
    // pending = a
    // b->a->b
    update.next = pending.next;
    pending.next = update;

    //update = c
    //pending = b
    //c->a->b->c

    //update = d
    //pending = c
    // d->a->b->c->d
  }
  updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null,
  lane: Lane
): {
  memoizedState: State;
} => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState
  };

  let resultState = baseState;

  if (pendingUpdate !== null) {
    //第一个update
    const first: Update<State> | null = pendingUpdate.next;
    let pending = first;

    do {
      const updateLane = pending!.lane;
      if (updateLane === lane) {
        //与本次更新的优先级相同 可以执行

        const action = pending!.action;

        console.log('执行更新', action, resultState);

        if (action instanceof Function) {
          resultState = action(resultState);
        } else {
          resultState = action;
        }
      } else {
        //与本次更新的优先级不同 不执行
        if (__DEV__) {
          console.warn('跳过了不同优先级的更新');
        }
      }
      pending = pending!.next;
    } while (pending !== first && pending !== null);
  }
  result.memoizedState = resultState;
  return result;
};
