import { ReactElementType } from 'shared/ReactTypes';
import { createRoot } from 'react-dom';

export const renderIntoElement = (element: ReactElementType) => {
  const div = document.createElement('div');
  createRoot(div).render(element);
};
