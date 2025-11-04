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

  const deleteRemainingChildren = (returnFiber: FiberNode, currentFirstChild: FiberNode | null) => {
    if (!shouldTrackEffects) {
      return;
    }

    let childToDelete = currentFirstChild;

    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  };

  /**
   * 对更新后的单一 React 元素进行协调
   * 分为4中情况
   * key 相同 type 相同  可以复用
   * key 相同 type 不同  删除旧的 创建新的
   * key 不同 type 相同  删除旧的 创建新的
   * key 不同 type 不同  删除旧的 创建新的
   *
   * 旧节点为空       创建新的
   */
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    element: ReactElementType
  ) => {
    const key = element.key;
    while (currentFirstChild !== null) {
      // update
      if (currentFirstChild.key === key) {
        // key 相同
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          // type 相同
          if (currentFirstChild.type === element.type) {
            //当前节点可以复用
            const existingFiber = useFiber(currentFirstChild, element.props);
            existingFiber.return = returnFiber;

            //删除其他节点
            deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
            return existingFiber;
          }
          // key 相同 type 不同, 删除所有不同的节点
          deleteRemainingChildren(returnFiber, currentFirstChild);
          break;
        } else {
          if (__DEV__) {
            console.warn('还未实现的更新类型', element);
            break;
          }
        }
      } else {
        // key 不同
        // 删除旧的
        deleteChild(returnFiber, currentFirstChild);
        // 继续看兄弟节点是否有可以复用的节点
        currentFirstChild = currentFirstChild.sibling;
      }
    }

    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  };

  /**
   * 对单一文本节点进行协调
   */
  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    textContent: string | number
  ) => {
    while (currentFirstChild !== null) {
      // update
      if (currentFirstChild.tag === HostText) {
        //可以复用
        const existingFiber = useFiber(currentFirstChild, { content: textContent });
        existingFiber.return = returnFiber;

        deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
        return existingFiber;
      } else {
        //删除旧的
        deleteChild(returnFiber, currentFirstChild);
        currentFirstChild = currentFirstChild.sibling;
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

  const updateFromMap = (
    existingChildren: Map<number | string, FiberNode>,
    returnFiber: FiberNode,
    index: number,
    element: ReactElementType
  ) => {
    const keyToUse = element.key !== null ? element.key : index;
    const before = existingChildren.get(keyToUse);

    if (typeof element === 'string' || typeof element === 'number') {
      // HostText
      if (before && before.tag === HostText) {
        existingChildren.delete(keyToUse);
        return useFiber(before, { content: element + '' });
      }
      return new FiberNode(HostText, { content: element + '' }, null);
    }

    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (before && before.type === element.type) {
            existingChildren.delete(keyToUse);
            return useFiber(before, element.props);
          }
          return createFiberFromElement(element);

        default:
          if (__DEV__) {
            console.warn('未实现的更新类型', element);
          }
          break;
      }

      // TODO: 未实现数组类型
      if (Array.isArray(element)) {
        if (__DEV__) {
          console.warn('未实现的数组类型的更新', element);
        }
      }
    }
    return null;
  };

  const reconcileChildrenArray = (
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChildren: ReactElementType[]
  ) => {
    // 将current 保存在map中
    const existingChildren = new Map<number | string, FiberNode>();
    let current = currentFirstChild;
    let lastPlacedIndex = 0; // 上一个可复用节点的索引
    let lastNewFiber: FiberNode | null = null; // 上一个新的节点
    let firstNewFiber: FiberNode | null = null; // 第一个新的节点

    while (current !== null) {
      const keyToUse = current.key !== null ? current.key : current.index;
      existingChildren.set(keyToUse, current);
      current = current.sibling;
    }

    for (let i = 0; i < newChildren.length; i++) {
      const child = newChildren[i];

      // 遍历新的子节点数组 去旧的map中查找可复用的节点
      const newFiber = updateFromMap(existingChildren, returnFiber, i, child);
      if (newFiber == null) {
        continue;
      }

      newFiber.index = i;
      newFiber.return = returnFiber;

      // 构建fiber链表
      if (lastNewFiber === null) {
        lastNewFiber = newFiber;
        firstNewFiber = newFiber;
      } else {
        lastNewFiber.sibling = newFiber;
        lastNewFiber = lastNewFiber.sibling;
      }

      if (!shouldTrackEffects) {
        continue;
      }
      //标记副作用，移动还是插入
      const current = newFiber.alternate;
      if (current !== null) {
        const oldIndex = current.index;
        if (oldIndex < lastPlacedIndex) {
          //需要移动
          newFiber.flags |= Placement;
          continue;
        } else {
          // 不移动
          lastPlacedIndex = oldIndex;
        }
      } else {
        // mount
        newFiber.flags |= Placement;
      }
    }
    // 删除没有复用的节点
    existingChildren.forEach((fiber) => {
      deleteChild(returnFiber, fiber);
    });

    return firstNewFiber;
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

        // default:
        //   if (__DEV__) {
        //     console.warn('未实现的reconcile类型');
        //   }
        //   break;
      }

      if (Array.isArray(newChild)) {
        if (__DEV__) {
          console.warn('开始执行多节点的协调');
        }
        return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
      }
    }

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
