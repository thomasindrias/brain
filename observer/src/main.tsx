import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Placeholder App component - will be implemented in later chunks
function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Brain OS Observer Dashboard</h1>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
