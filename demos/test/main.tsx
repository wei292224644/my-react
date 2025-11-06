import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [num, setNum] = useState(100);

  const arr =
    num % 2 === 0
      ? [<li key="A">A</li>, <li key="B">B</li>, <li key="C">C</li>]
      : [<li key="C">C</li>, <li key="A">A</li>, <li key="B">B</li>];

  useEffect(() => {
    console.log('render');
  }, []);

  useEffect(() => {
    console.log('num change:', num);
    return () => {
      console.log('num change cleanup:', num);
    };
  }, [num]);

  return (
    <ul
      key="list"
      className="abc"
      onClick={() => {
        setNum((num) => num + 1);
      }}
    >
      {arr}
    </ul>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
