import { createInstance } from 'ReactFiberConfig';
import { FiberNode } from './ReactFiber';
import { HostComponent, HostRoot, HostText } from './ReactFiberWorkTags';

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
      }

      return null;

    case HostText:
      return null;
    case HostRoot:
      return null;

    default:
      if (__DEV__) {
        console.warn('completeWork未实现的类型');
      }
      break;
  }
};



const appendAllChildren = (  )