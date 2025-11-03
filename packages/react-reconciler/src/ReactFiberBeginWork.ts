import { Props, ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, createWorkInProgress, FiberNode } from './ReactFiber';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactFiberWorkTags';
import { processUpdateQueue, UpdateQueue } from './Update';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ChildDeletion, Placement } from './ReactFiberFlags';
import { renderWithHooks } from './ReactFiberHooks';

const createChildReconciler = (shouldTrackEffects: boolean) => {
  const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
    if (!shouldTrackEffects) {
      return;
    }

    const deletions = returnFiber.deletions;

    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  };

  /**
   * 对单一 React 元素进行协调
   */
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    element: ReactElementType
  ) => {
    const key = element.key;
    if (currentFirstChild !== null) {
      // update
      if (currentFirstChild.key === key) {
        // key 相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          // type 相同
          if (currentFirstChild.type === element.type) {
            //可以复用
            const existingFiber = useFiber(currentFirstChild, element.props);
            existingFiber.return = returnFiber;
            return existingFiber;
          }
          deleteChild(returnFiber, currentFirstChild);
        } else {
          if (__DEV__) {
            console.warn('还未实现的更新类型', element);
          }
          deleteChild(returnFiber, currentFirstChild);
        }
      } else {
        // key 不同
        // 删除旧的
        deleteChild(returnFiber, currentFirstChild);
      }
    }

    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  };

  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    textContent: string | number
  ) => {
    if (currentFirstChild !== null) {
      // update
      if (currentFirstChild.tag === HostText) {
        //可以复用
        const existingFiber = useFiber(currentFirstChild, { content: textContent });
        existingFiber.return = returnFiber;
        return existingFiber;
      } else {
        //删除旧的
        deleteChild(returnFiber, currentFirstChild);
      }
    }

    const fiber = new FiberNode(HostText, { content: textContent }, null);
    fiber.return = returnFiber;
    return fiber;
  };

  /**
   * 当 shouldTrackEffects 为 true 时，表示需要追踪副作用
   * 当传入的 fiber 没有 alternate 时，说明是初次挂载，需要添加 Placement 标记
   */
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

    if (currentFirstChild !== null) {
      // 兜底
      deleteChild(returnFiber, currentFirstChild);
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
      return updateFunctionComponent(workInProgress);

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

const updateFunctionComponent = (workInProgress: FiberNode) => {
  const nextChildren = renderWithHooks(workInProgress);
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

const useFiber = (fiber: FiberNode, pendingProps: Props): FiberNode => {
  const clone = createWorkInProgress(fiber, pendingProps);
  // Reset the index and sibling pointers
  clone.index = 0;
  clone.sibling = null;
  return clone;
};
