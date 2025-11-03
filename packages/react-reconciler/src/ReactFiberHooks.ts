import { FiberNode } from './ReactFiber';

export const renderWithHooks = (workInProgress: FiberNode) => {
  const Component = workInProgress.type;
  const props = workInProgress.pendingProps;
  const chilren = Component(props);

  return chilren;
};
