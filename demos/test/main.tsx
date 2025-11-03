import { createRoot } from 'react-dom/client';

const App = () => {
  return (
    <div>
      <p>Hello, React!</p>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
