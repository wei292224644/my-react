import { appendChildToContainer, Container } from 'HostConfig';
import { MutationMask, NoFlags, Placement } from './ReactFiberFlags';
import { HostComponent, HostRoot, HostText } from './ReactFiberWorkTags';
import { FiberNode } from './ReactFiber';

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
    // 删除Placement标记
    fiber.flags &= ~Placement;
  }
};

const commitPlacement = (fiber: FiberNode) => {
  if (__DEV__) {
    console.warn('执行Placement操作', fiber);
  }
  const hostParent = getHostParentFiber(fiber);
  if (hostParent === null) {
    if (__DEV__) {
      console.warn('未找到host parent，无法执行Placement操作');
    }
    return;
  }
  appendPlacementNodeIntoContainer(fiber, hostParent);
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

const appendPlacementNodeIntoContainer = (finishedWork: FiberNode, hostParent: Container) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return;
  }

  const child = finishedWork.child;

  if (child !== null) {
    appendPlacementNodeIntoContainer(child, hostParent);

    let sibling = child.sibling;

    while (sibling !== null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
};
