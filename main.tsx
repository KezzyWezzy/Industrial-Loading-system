import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import IndustrialLoadingSystem from './IndustrialLoadingSystem';
import TankGaugingStrappingSystem from './TankGaugingStrappingSystem';

const App = () => {
  const [activeSystem, setActiveSystem] = useState<'industrial' | 'strapping'>('industrial');

  return (
    <div>
      <nav className="bg-gray-100 border-b p-4 flex justify-center space-x-4">
        <button
          className={px-4 py-2 rounded }
          onClick={() => setActiveSystem('industrial')}
        >
          Industrial System
        </button>
        <button
          className={px-4 py-2 rounded }
          onClick={() => setActiveSystem('strapping')}
        >
          Strapping System
        </button>
      </nav>

      <main>
        {activeSystem === 'industrial' ? (
          <IndustrialLoadingSystem />
        ) : (
          <TankGaugingStrappingSystem />
        )}
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
