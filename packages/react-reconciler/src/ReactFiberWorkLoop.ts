import { createWorkInProgress, FiberNode, FiberRootNode } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { commitMutationEffects } from './ReactFiberCommitWork';
import { completeWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags } from './ReactFiberFlags';
import { HostRoot } from './ReactFiberWorkTags';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber);
  if (root === null) {
    return;
  }
  renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node: FiberNode | null = fiber;
  let parent: FiberNode | null = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  if (node.tag == HostRoot) {
    return node.stateNode as FiberRootNode;
  }

  return null;
}

function renderRoot(root: FiberRootNode) {
  console.warn('render阶段开始');
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

  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;

  commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn('commit阶段开始', finishedWork);
  }

  root.finishedWork = null;

  const subtreeHasEffect = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;

  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffect || rootHasEffect) {
    console.warn('beforeMutation阶段开始', finishedWork);
    commitMutationEffects(finishedWork);
    //TODO : mutation
    console.warn('mutation阶段开始', finishedWork);
    root.current = finishedWork;

    //TODO : layout
    console.warn('layout阶段开始', finishedWork);
  } else {
    root.current = finishedWork;
  }
}

function workLoop() {
  while (workInProgress !== null) {
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
    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
