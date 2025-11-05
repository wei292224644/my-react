import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);
  return (
    <ul
      onClick={() => {
        setNum((num) => num + 1);
        setNum((num) => num + 2);
        setNum((num) => num + 3);
      }}
    >
      <li key="A">A</li>
      <li key="B">B</li>
      {num}
    </ul>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
