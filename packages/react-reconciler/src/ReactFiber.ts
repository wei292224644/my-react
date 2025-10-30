import { Key, Props, Ref } from 'shared/ReactTypes';
import { WorkTag } from './ReactFiberWorkTags';
import { FiberFlags, NoFlags } from './ReactFiberFlags';

export class FiberNode {
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
  // 指向当前fiber对应的另外一个树中的fiber节点 （current树或workInProgress树）
  alternate: FiberNode | null;
  flags: FiberFlags;

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

    this.alternate = null;
    //副作用
    this.flags = NoFlags;
  }
}
