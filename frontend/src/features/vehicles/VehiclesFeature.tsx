import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { getVehicles, type Vehicle } from '../../api/vehicle.api';

export default function VehiclesFeature() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [vehicleNoQuery, setVehicleNoQuery] = useState<string>('');
  const [brandQuery, setBrandQuery] = useState<string>('');

  async function refresh() {
    setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const vq = vehicleNoQuery.trim().toLowerCase();
    const bq = brandQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      const noOk = !vq || v.number.toLowerCase().includes(vq);
      const brandOk = !bq || v.brand.toLowerCase().includes(bq);
      return noOk && brandOk;
    });
  }, [vehicles, vehicleNoQuery, brandQuery]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-2">
        <Input
          id="vehicle_search_number"
          label="Search by vehicle no"
          value={vehicleNoQuery}
          onChange={(e) => setVehicleNoQuery(e.target.value)}
          placeholder="e.g. MH12AB1234"
        />
        <Input
          id="vehicle_search_brand"
          label="Search by brand"
          value={brandQuery}
          onChange={(e) => setBrandQuery(e.target.value)}
          placeholder="e.g. Maruti"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Sr. No</th>
                <th className="px-4 py-3">Vehicle No</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Body Type</th>
                <th className="px-4 py-3">Fuel Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={8}>
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                filtered.map((v, idx) => (
                  <tr key={v.id} className="text-sm text-gray-800">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{v.number}</td>
                    <td className="px-4 py-3">{v.brand}</td>
                    <td className="px-4 py-3">{v.model}</td>
                    <td className="px-4 py-3">{v.bodyType}</td>
                    <td className="px-4 py-3">{v.fuelType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          v.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        className="bg-white px-3 py-1.5 text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50"
                        onClick={() => toast('Edit coming soon')}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
