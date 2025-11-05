import { scheduleMicrotask } from 'HostConfig';
import { createWorkInProgress, FiberNode, FiberRootNode } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { commitMutationEffects } from './ReactFiberCommitWork';
import { completeWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags } from './ReactFiberFlags';
import {
  getHighestPriorityLane,
  Lane,
  markRootFinished,
  mergeLanes,
  NoLane,
  SyncLane
} from './ReactFiberLane';
import { HostRoot } from './ReactFiberWorkTags';
import { flushSyncCallbacks, scheduleSyncCallback } from './ReactFiberSyncTaskQueue';

let workInProgress: FiberNode | null = null;
let workInProgressRenderLane: Lane = NoLane;

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
  workInProgress = createWorkInProgress(root.current, {});
  workInProgressRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  const root = markUpdateFromFiberToRoot(fiber);
  if (root === null) {
    return;
  }
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

/** 确保root已经被调度
 * @param root FiberRootNode
 */
const ensureRootIsScheduled = (root: FiberRootNode) => {
  const updateLane = getHighestPriorityLane(root.pendingLanes);
  if (updateLane === NoLane) {
    return;
  }

  if (updateLane === SyncLane) {
    //同步优先级 用微任务调度
    if (__DEV__) {
      console.warn('在微任务中调度同步更新');
    }
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
    scheduleMicrotask(flushSyncCallbacks);
  } else {
    //其他优先级 用宏任务调度
  }
};

/**
 * 将lane标记到root上
 * @param root FiberRootNode
 * @param lane Lane
 */
const markRootUpdated = (root: FiberRootNode, lane: Lane) => {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
};

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

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
  const nextLane = getHighestPriorityLane(root.pendingLanes);

  if (nextLane !== SyncLane) {
    ensureRootIsScheduled(root);
    return null;
  }

  console.warn('render阶段开始');
  prepareFreshStack(root, lane);

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
  root.finishedLane = lane;
  workInProgressRenderLane = NoLane;

  commitRoot(root);

  return null;
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn('commit阶段开始', finishedWork);
  }

  const lane = root.finishedLane;

  if (__DEV__ && lane == NoLane) {
    console.warn('commit阶段 finishedLane 不应为 NoLane');
  }

  root.finishedWork = null;
  root.finishedLane = NoLane;

  markRootFinished(root, lane);

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
  const next = beginWork(fiber, workInProgressRenderLane);

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
