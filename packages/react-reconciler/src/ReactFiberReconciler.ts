import { Container } from 'HostConfig';
import { FiberNode, FiberRootNode } from './ReactFiber';
import { HostRoot } from './ReactFiberWorkTags';
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './Update';
import { ElementType, ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { requestUpdateLane } from './ReactFiberHooks';

export function createContainer(container: Container) {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);

  const root = new FiberRootNode(container, hostRootFiber);

  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
}

export function updateContainer(element: ReactElementType | null, root: FiberRootNode) {
  const hostRootFiber = root.current;
  const lane = requestUpdateLane(hostRootFiber);
  const update = createUpdate<ReactElementType | null>(element, lane);
  enqueueUpdate(hostRootFiber.updateQueue as UpdateQueue<ElementType | null>, update);
  scheduleUpdateOnFiber(hostRootFiber, lane);
  return element;
}
