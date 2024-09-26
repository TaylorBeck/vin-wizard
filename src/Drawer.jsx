import React from 'react';

const Drawer = ({ isOpen, onClose, searchHistory, onSelectVehicle }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Recent Searches</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ul>
          {searchHistory.map((vehicle, index) => (
            <span key={index}>
              <li key={index} className="mb-2">
                <button
                  onClick={() => onSelectVehicle(vehicle)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded"
                >
                  {vehicle.make} {vehicle.model} (<small>{vehicle.vin}</small>)
                </button>
              </li>
              <hr />
            </span>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Drawer;