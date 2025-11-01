import { Key, Props, Ref } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './ReactFiberWorkTags';
import { FiberFlags, NoFlags } from './ReactFiberFlags';
import { Container } from 'HostConfig';

export class FiberNode {
  /**
   *  与 elementType 类似，但对于 HostComponent，它就是 DOM 元素的标签名
   */
  type: any;
  tag: WorkTag;
  key: Key;
  ref: Ref;
  stateNode: any;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  pendingProps: Props;
  memoizedProps: Props | null;
  memoizedState: any;
  // 指向当前fiber对应的另外一个树中的fiber节点 （current树或workInProgress树）
  alternate: FiberNode | null;
  flags: FiberFlags;
  subtreeFlags: FiberFlags;
  updateQueue: unknown;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key;
    this.stateNode = null;

    this.type = null;

    //树结构
    this.return = null;
    this.sibling = null;
    this.child = null;
    this.index = 0;

    this.ref = null;

    //工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.memoizedState = null;

    this.alternate = null;
    //副作用
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
    this.updateQueue = null;
  }
}

export class FiberRootNode {
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null;

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    this.finishedWork = null;

    hostRootFiber.stateNode = this;
  }
}

export const createWorkInProgress = (current: FiberNode, pendingProps: Props): FiberNode => {
  let wip = current.alternate;
  if (wip === null) {
    //mount时
    wip = new FiberNode(current.tag, pendingProps, current.key);
    wip.stateNode = current.stateNode;

    wip.alternate = current;
    current.alternate = wip;
  } else {
    //update时
    wip.pendingProps = pendingProps;

    //重置副作用
    wip.flags = NoFlags;
    wip.subtreeFlags = NoFlags;
  }
  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;

  return wip;
};

export const createFiberFromElement = (element: any): FiberNode => {
  const { type, key, props } = element;

  let fiberTag: WorkTag = FunctionComponent;

  if (typeof type === 'string') {
    fiberTag = HostComponent;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('未实现的type类型的fiber创建', element);
  }

  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;
  return fiber;
};
