import { createContainer, updateContainer } from 'react-reconciler/src/ReactFiberReconciler';
import { Container } from 'HostConfig';
import { ReactElementType } from 'shared/ReactTypes';

export const createRoot = (container: Container) => {
  const root = createContainer(container);
  return {
    render(element: ReactElementType) {
      updateContainer(element, root);
    }
  };
};
