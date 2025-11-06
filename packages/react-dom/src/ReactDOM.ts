import { createContainer, updateContainer } from 'react-reconciler/src/ReactFiberReconciler';
import { Container } from 'HostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { initEvent } from './SyntheticEvent';

export const createRoot = (container: Container) => {
  const root = createContainer(container);
  window.rootContainer = root;
  return {
    render(element: ReactElementType) {
      initEvent(container, 'click');
      updateContainer(element, root);
    }
  };
};
