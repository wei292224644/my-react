import { appendInitialChild, createInstance, createTextInstance } from 'ReactFiberConfig';
import { FiberNode } from './ReactFiber';
import { HostComponent, HostRoot, HostText } from './ReactFiberWorkTags';
import { NoFlags } from './ReactFiberFlags';

export const completeWork = (workInProgress: FiberNode): FiberNode | null => {
  const newProps = workInProgress.pendingProps;
  const current = workInProgress.alternate;

  switch (workInProgress.tag) {
    case HostComponent:
      if (current !== null && workInProgress.stateNode) {
        //update
      } else {
        //mount
        // 1. 构建DOM
        const instance = createInstance(workInProgress.type, newProps);
        // 2. 将DOM插入到正确的位置
        appendAllChildren(instance, workInProgress);

        workInProgress.stateNode = instance;
      }
      bubbleProperties(workInProgress);
      return null;
    case HostText:
      if (current !== null && workInProgress.stateNode) {
        //update
      } else {
        //mount
        // 1. 构建DOM
        const instance = createTextInstance(newProps.content);
        workInProgress.stateNode = instance;
      }
      bubbleProperties(workInProgress);
      return null;
    case HostRoot:
      bubbleProperties(workInProgress);
      return null;

    default:
      if (__DEV__) {
        console.warn('completeWork未实现的类型', workInProgress);
      }
      break;
  }
  return null;
};

const appendAllChildren = (parent: FiberNode, workInProgress: FiberNode) => {
  let node = workInProgress.child;

  while (node !== null) {
    if (node.tag == HostComponent || node.tag == HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 向下遍历 将子节点的 return（父节点）指向当前节点
      node.child.return = node;
      // 继续向下遍历
      node = node.child;
      continue;
    }

    if (node === workInProgress) {
      //DFS 遍历返回到起点，退出循环
      return;
    }

    // 向上遍历，直到找到兄弟节点
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    // 兄弟结点的 return 指向当前节点的父节点
    node.sibling.return = node.return;
    // 转向兄弟结点
    node = node.sibling;
  }
};

const bubbleProperties = (workInProgress: FiberNode) => {
  let subtreeFlags = NoFlags;
  let child = workInProgress.child;

  // 循环遍历子节点
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = workInProgress;
    child = child.sibling;
  }

  workInProgress.subtreeFlags |= subtreeFlags;
};
