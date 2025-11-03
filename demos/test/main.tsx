import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);
  window.setNum = setNum;
  return <div>{num === 3 ? <Child /> : <p>{num}</p>}</div>;
};

const Child = () => {
  return <div>child component</div>;
};
createRoot(document.getElementById('root')!).render(<App />);
