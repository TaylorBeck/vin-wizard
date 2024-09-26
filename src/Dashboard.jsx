import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Drawer from './Drawer';
import carImage from './assets/WBS2U7C00M7J54649.webp';

const fetchVehicleData = async ({ queryKey }) => {
  const [_, vin] = queryKey;
  if (!vin) return null;
  const response = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
  return response.data;
};

const VehicleInfo = ({ label, value }) => (
  <div className="mb-4 bg-white rounded-lg shadow-md p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{label}</h3>
    <p className="text-xl text-gray-900">{value || 'N/A'}</p>
  </div>
);

const CatalyticConverterInfo = ({ vehicleData }) => {
  // This is a simplified estimation function. In a real application, you'd want a more comprehensive database.
  const estimateCatalyticConverterContents = (make, model, year, engineSize) => {
    // Very rough estimates based on vehicle age and engine size
    let baselineYear = 2000;
    let yearFactor = Math.max(0, (parseInt(year) - baselineYear) / 20); // Newer cars tend to have less precious metals
    let sizeFactor = parseFloat(engineSize) / 3.0; // Larger engines tend to have more precious metals

    console.log({ make, model, year, engineSize, baselineYear, yearFactor, sizeFactor });

    return {
      platinum: Math.round(3 * sizeFactor * (1 - yearFactor) * 10) / 10,
      palladium: Math.round(4 * sizeFactor * (1 - yearFactor) * 10) / 10,
      rhodium: Math.round(0.3 * sizeFactor * (1 - yearFactor) * 10) / 10
    };
  };

  const converterContents = estimateCatalyticConverterContents(
    vehicleData['Make'],
    vehicleData['Model'],
    vehicleData['Model Year'],
    vehicleData['Displacement (L)']
  );

  // Rough estimate of value based on current precious metal prices (as of 2023)
  const estimateValue = () => {
    const platinumPrice = 997.12; // USD per oz
    const palladiumPrice = 1048.63; // USD per oz
    const rhodiumPrice = 4750.00; // USD per oz
    const gramsPerOz = 28.34952;

    const totalValue = 
      (converterContents.platinum * platinumPrice / gramsPerOz) +
      (converterContents.palladium * palladiumPrice / gramsPerOz) +
      (converterContents.rhodium * rhodiumPrice / gramsPerOz);

    return Math.round(totalValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Estimated Catalytic Converter Information</h2>
      <p className="text-sm text-gray-500 mb-4">Note: These are rough estimates and may not reflect the exact contents of your vehicle's catalytic converter.</p>
      <div className="grid grid-cols-4 gap-4">
        <VehicleInfo className="col-span-1" label="Platinum Content" value={`${converterContents.platinum} grams`} />
        <VehicleInfo className="col-span-1" label="Palladium Content" value={`${converterContents.palladium} grams`} />
        <VehicleInfo className="col-span-1" label="Rhodium Content" value={`${converterContents.rhodium} grams`} />
        <div className="mb-4 bg-green-700 rounded-lg shadow-md p-4 col-span-1">
          <h3 className="text-lg font-semibold text-white mb-2">Estimated Value</h3>
          <p className="text-xl text-white">${`${estimateValue()}` || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [vin, setVin] = useState('');
  const [searchedVin, setSearchedVin] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['vehicleData', searchedVin],
    queryFn: fetchVehicleData,
    enabled: !!searchedVin,
  });

  useEffect(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    if (data && searchedVin) {
      const vehicleData = data.Results.reduce((acc, item) => {
        if (item.Value && item.Value !== 'Not Applicable') {
          acc[item.Variable] = item.Value;
        }
        return acc;
      }, {});

      const newSearch = {
        vin: searchedVin,
        make: vehicleData['Make'],
        model: vehicleData['Model'],
        year: vehicleData['Model Year'],
      };

      const updatedHistory = [newSearch, ...searchHistory.filter(v => v.vin !== searchedVin)].slice(0, 10);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
  }, [data, searchedVin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchedVin(vin);
  };

  const handleSelectVehicle = (vehicle) => {
    setVin(vehicle.vin);
    setSearchedVin(vehicle.vin);
    setIsDrawerOpen(false);
  };

  const vehicleData = data?.Results?.reduce((acc, item) => {
    if (item.Value && item.Value !== 'Not Applicable') {
      acc[item.Variable] = item.Value;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">VIN Wizard</h1>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-transparent hover:shadow-sm text-black font-bold py-2 px-4 rounded"
          >
            Recent Searches
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mb-8 flex justify-center">
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter VIN"
            className="border-2 border-gray-300 bg-white h-14 w-full max-w-xl px-5 pr-16 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg ml-2">
            Lookup
          </button>
        </form>

        {isLoading && <div className="text-center text-xl">Loading...</div>}
        {isError && <div className="text-center text-xl text-red-500">Error: {error.message}</div>}

        {vehicleData && (
          <>
            <div className="flex flex-col lg:flex-row gap-8 mb-8">
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
                  <img 
                    src={carImage}
                    alt={`${vehicleData['Make']} ${vehicleData['Model']}`}
                    className="w-full h-auto flex-shrink-0"
                  />
                  <div className="p-6 flex-grow flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {vehicleData['Make']} {vehicleData['Model']}
                    </h2>
                    <p className="text-xl text-gray-600">{vehicleData['Model Year']}</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-2/3">
                <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                  <div className="overflow-x-auto flex-grow">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        {[
                          { label: 'Body Class', key: 'Body Class' },
                          { label: 'Engine Model', key: 'Engine Model' },
                          { label: 'Fuel Type', key: 'Fuel Type - Primary' },
                          { label: 'VIN', key: 'VIN' },
                          { label: 'Engine Cylinders', key: 'Engine Number of Cylinders' },
                          { label: 'Displacement (L)', key: 'Displacement (L)' },
                          { label: 'Engine Configuration', key: 'Engine Configuration' }
                        ].map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.label}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.key === 'VIN' ? searchedVin : vehicleData[item.key] || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {(vehicleData['Model Year'] && vehicleData['Displacement (L)']) ? (
              <CatalyticConverterInfo vehicleData={vehicleData} />
            ) : (
              <div className="w-full text-center bg-gray-200 rounded-lg py-8">
                Catalytic Converter info estimate cannot be calculated as the Model Year and Engine Size data is not available.
              </div>
            )}
          </>
        )}
      </div>
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        searchHistory={searchHistory}
        onSelectVehicle={handleSelectVehicle}
      />
    </div>
  );
}