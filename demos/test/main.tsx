import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);

  return (
    <div
      key="list"
      className="abc"
      onClick={() => {
        setNum((num) => num + 1);
      }}
    >
      {num}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
