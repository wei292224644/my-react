import {
  appendChildToContainer,
  commitTextUpdate,
  Container,
  insertChildToContainer,
  removeChild
} from 'HostConfig';
import { ChildDeletion, MutationMask, NoFlags, Placement, Update } from './ReactFiberFlags';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactFiberWorkTags';
import { FiberNode } from './ReactFiber';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork;

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child;

    if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
      nextEffect = child;
    } else {
      up: while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
        const sibling: FiberNode | null = nextEffect.sibling;

        if (sibling !== null) {
          nextEffect = sibling;
          break up;
        } else {
          nextEffect = nextEffect.return;
        }
      }
    }
  }
};

const commitMutationEffectsOnFiber = (fiber: FiberNode) => {
  const flags = fiber.flags;

  if ((flags & Placement) !== NoFlags) {
    commitPlacement(fiber);
  }

  if ((flags & Update) !== NoFlags) {
    commitUpdate(fiber);
  }

  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = fiber.deletions;

    if (deletions !== null) {
      deletions.forEach((childToDelete) => {
        commitDeletion(childToDelete);
      });
    }
  }
};

const commitPlacement = (fiber: FiberNode) => {
  if (__DEV__) {
    console.warn('执行Placement操作', fiber);
  }
  const hostParent = getHostParentFiber(fiber);

  const hostSibling = getHostSibling(fiber);

  if (hostParent !== null) {
    insertOrAppendPlacementNodeIntoContainer(fiber, hostParent, hostSibling);
    // if (__DEV__) {
    //   console.warn('未找到host parent，无法执行Placement操作');
    // }
    // return;
  }
};

const commitUpdate = (fiber: FiberNode) => {
  switch (fiber.tag) {
    case HostText: {
      const text = fiber.memoizedProps.content;
      const instance = fiber.stateNode;
      commitTextUpdate(instance, text);
      break;
    }

    case HostComponent: {
      updateFiberProps(fiber.stateNode, fiber.memoizedProps);
      console.log('执行HostComponent的update操作', fiber);
      break;
    }

    default:
      if (__DEV__) {
        console.warn('未实现的commitUpdate类型', fiber);
      }
      break;
  }
};

function recordHostChildrenToDelete(hostChildrenToDelete: FiberNode[], unmountFiber: FiberNode) {
  const lastOne = hostChildrenToDelete[hostChildrenToDelete.length - 1];
  if (!lastOne) {
    hostChildrenToDelete.push(unmountFiber);
  } else {
    let node = lastOne.sibling;
    while (node !== null) {
      if (unmountFiber === node) {
        hostChildrenToDelete.push(unmountFiber);
      }
      node = node.sibling;
    }
  }
}

const commitDeletion = (childToDelete: FiberNode) => {
  if (__DEV__) {
    console.warn('执行Deletion操作', childToDelete);
  }
  const rootChildrenToDelete: FiberNode[] = [];

  commitNestedComponent(childToDelete, (unmountFiber) => {
    switch (unmountFiber.tag) {
      case HostComponent: {
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
        // TODO: 解绑ref
        return;
      }
      case HostText: {
        recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
        // TODO: 解绑ref
        return;
      }

      case FunctionComponent:
        // TODO: 执行useEffect的destroy函数
        // TODO: 解绑ref
        return;

      default:
        if (__DEV__) {
          console.warn('未实现的unmount类型', unmountFiber);
        }
        break;
    }
  });

  if (rootChildrenToDelete.length > 0) {
    //如果找到了HostComponent或HostText节点，说明有对应的DOM需要删除
    //找到最近的 parent html 节点
    const hostParent = getHostParentFiber(childToDelete);
    if (hostParent !== null) {
      //从DOM中删除对应的节点
      if (__DEV__) {
        console.warn('从DOM中删除节点', rootChildrenToDelete, 'from', hostParent);
      }
      rootChildrenToDelete.forEach((child) => {
        removeChild(child.stateNode, hostParent);
      });
    }
  }

  childToDelete.return = null;
  childToDelete.child = null;
};

const commitNestedComponent = (fiber: FiberNode, onCommitUnmount: (fiber: FiberNode) => void) => {
  let node = fiber;

  while (true) {
    onCommitUnmount(node);

    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === fiber) {
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === fiber) {
        return;
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
};

const getHostSibling = (fiber: FiberNode) => {
  let node = fiber;
  findSibling: while (true) {
    while (node.sibling === null) {
      const parent = node.return;

      if (parent === null || parent.tag === HostComponent || parent.tag === HostRoot) {
        return null;
      }

      node = parent;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (node.tag !== HostText && node.tag !== HostComponent) {
      //向下遍历
      if ((node.flags & Placement) !== NoFlags) {
        //如果有Placement标记，说明还未插入到DOM中，跳过
        continue findSibling;
      }

      if (node.child === null) {
        continue findSibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    if ((node.flags & Placement) === NoFlags) {
      return node.stateNode;
    }
  }
};

const getHostParentFiber = (fiber: FiberNode): Container | null => {
  let parent = fiber.return;

  while (parent) {
    const parentTag = parent.tag;

    if (parentTag === HostComponent) {
      return parent.stateNode as Container;
    }

    if (parentTag === HostRoot) {
      return parent.stateNode.container as Container;
    }

    parent = parent.return;
  }

  if (__DEV__) {
    console.warn('未找到host parent');
  }

  return null;
};

const insertOrAppendPlacementNodeIntoContainer = (
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Container
) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    } else {
      appendChildToContainer(hostParent, finishedWork.stateNode);
    }
    return;
  }

  const child = finishedWork.child;

  if (child !== null) {
    insertOrAppendPlacementNodeIntoContainer(child, hostParent);

    let sibling = child.sibling;

    while (sibling !== null) {
      insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
};

export const flushPassiveEffects = () => {
  if (__DEV__) {
    console.warn('flushPassiveEffects 尚未实现');
  }
};
