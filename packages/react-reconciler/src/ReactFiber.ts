import { Key, Props, Ref } from 'shared/ReactTypes';
import { Fragment, FunctionComponent, HostComponent, WorkTag } from './ReactFiberWorkTags';
import { FiberFlags, NoFlags } from './ReactFiberFlags';
import { Container } from 'HostConfig';
import { UpdateQueue } from './Update';

export class FiberNode {
  /**
   *  与 elementType 类似，但对于 HostComponent，它就是 DOM 元素的标签名
   *  对于 FunctionComponent，则是函数本身
   */
  type: any;
  tag: WorkTag;
  key: Key;
  ref: Ref;

  /**
   * 指向具体的实例
   * 比如对于 HostComponent 类型的 fiberNode，它的 stateNode 就是 DOM 节点
   * 对于 FunctionComponent 类型的 fiberNode，它的 stateNode 就是函数组件的实例（如果有的话）
   */
  stateNode: any;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  pendingProps: Props;
  memoizedProps: Props | null;

  /**
   * 存储组件的状态信息
   * 比如函数组件的 useState/useReducer 的状态
   */
  memoizedState: any;

  /**
   * 指向当前fiber对应的另外一个树中的fiber节点 （current树或workInProgress树）
   */
  alternate: FiberNode | null;
  flags: FiberFlags;
  subtreeFlags: FiberFlags;

  /**
   * 更新队列
   */
  updateQueue: UpdateQueue<any> | null;
  /**
   * 要删除的子节点集合
   */
  deletions: FiberNode[] | null;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key || null;
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

    this.deletions = null;
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
    wip.deletions = null;
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

export const createFiberFromFragment = (elements: any[], key: Key): FiberNode => {
  const fiber = new FiberNode(Fragment, elements, key);
  return fiber;
};
