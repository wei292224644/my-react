import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num] = useState(100);
  return (
    <div>
      <p>{num}</p>
    </div>
  );
};
createRoot(document.getElementById('root')!).render(<App />);
