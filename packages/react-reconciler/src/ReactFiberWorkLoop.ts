import { createWorkInProgress, FiberNode, FiberRootNode } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { HostRoot } from './ReactFiberWorkTags';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node: FiberNode | null = fiber;
  let parent: FiberNode | null = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  if (node.tag !== HostRoot) {
    return node.stateNode as FiberRootNode;
  }

  return null;
}

function renderRoot(root: FiberRootNode) {
  prepareFreshStack(root);

  do {
    try {
      workLoop();
      break;
    } catch (e) {
      console.error(e);
      workInProgress = null;
    }
  } while (true);
}

function workLoop() {
  if (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);

  fiber.memoizedProps = fiber.pendingProps;

  if (next == null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;

  do {
    const next = completeWork(node);

    if (next !== null) {
      workInProgress = next;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
