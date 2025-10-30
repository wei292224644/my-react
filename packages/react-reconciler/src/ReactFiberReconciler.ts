import { Container } from 'ReactFiberConfig';
import { FiberNode, FiberRootNode } from './ReactFiber';
import { HostRoot } from './ReactFiberWorkTags';
import { createUpdate, createUpdateQueue, enqueueUpdate, UpdateQueue } from './Update';
import { ElementType, ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

export function createContainer(container: Container) {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);

  const root = new FiberRootNode(container, hostRootFiber);

  hostRootFiber.updateQueue = createUpdateQueue();

  return root;
}

export function updateContainer(element: ReactElementType | null, root: FiberRootNode) {
  const hostRootFiber = root.current;
  const update = createUpdate<ReactElementType | null>(element);
  enqueueUpdate(hostRootFiber.updateQueue as UpdateQueue<ElementType | null>, update);
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
}
