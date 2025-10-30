import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './ReactFiber';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactFiberWorkTags';
import { processUpdateQueue, UpdateQueue } from './Update';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Placement } from './ReactFiberFlags';

const createChildReconciler = (shouldTrackEffects: boolean) => {
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    element: ReactElementType
  ) => {
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  };

  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    textContent: string | number
  ) => {
    const fiber = new FiberNode(HostText, { content: textContent }, null);
    fiber.return = returnFiber;
    return fiber;
  };

  const placeSingleChild = (fiber: FiberNode) => {
    if (shouldTrackEffects && fiber.alternate === null) {
      //mount
      fiber.flags |= Placement;
    }

    return fiber;
  };

  const reconcileChildFibers = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChild?: ReactElementType
  ) => {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));

        default:
          if (__DEV__) {
            console.warn('未实现的reconcile类型');
          }
          break;
      }
    }

    //TODO: 多节点情况

    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, newChild));
    }

    if (__DEV__) {
      console.warn('未实现的reconcile类型');
    }

    return null;
  };

  return reconcileChildFibers;
};

const reconcileChildFibers = createChildReconciler(true);
const mountChildFibers = createChildReconciler(false);

export const beginWork = (workInProgress: FiberNode): FiberNode | null => {
  switch (workInProgress.tag) {
    case HostComponent:
      return updateHostComponent(workInProgress);

    case HostRoot:
      return updateHostRoot(workInProgress);

    case FunctionComponent:
      return null;

    case HostText:
      return null;

    default:
      if (__DEV__) {
        console.warn('beginWork未实现的类型');
      }
      break;
  }
  return null;
};

const updateHostRoot = (workInProgress: FiberNode) => {
  const baseState = workInProgress.memoizedState;
  //                                                            Element?
  const updateQueue = workInProgress.updateQueue as UpdateQueue<ReactElementType>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;

  const { memoizedState } = processUpdateQueue(baseState, pending);

  workInProgress.memoizedState = memoizedState;
  const nextChildren = workInProgress.memoizedState;
  reconcileChildren(workInProgress, nextChildren);

  return workInProgress.child;
};

const updateHostComponent = (workInProgress: FiberNode) => {
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(workInProgress, nextChildren);

  return workInProgress.child;
};

const reconcileChildren = (workInProgress: FiberNode, nextChildren?: ReactElementType) => {
  const current = workInProgress.alternate;

  if (current !== null) {
    // update
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  } else {
    // mount
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  }
};
