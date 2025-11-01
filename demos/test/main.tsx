import { createRoot } from 'react-dom/client';

const jsx = (
  <div>
    <p>Hello, React!</p>
  </div>
);

createRoot(document.getElementById('root')!).render(jsx);
