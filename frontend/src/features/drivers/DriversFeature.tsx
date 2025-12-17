import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { createDriver, getDrivers, type Driver } from '../../api/driver.api';

function normalizePhone(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  return trimmed.replace(/\D/g, '');
}

export default function DriversFeature() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [nameQuery, setNameQuery] = useState<string>('');
  const [phoneQuery, setPhoneQuery] = useState<string>('');

  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const nq = nameQuery.trim().toLowerCase();
    const pq = normalizePhone(phoneQuery);
    return drivers.filter((d) => {
      const nameOk = !nq || d.name.toLowerCase().includes(nq);
      const phoneOk = !pq || normalizePhone(d.phone).includes(pq);
      return nameOk && phoneOk;
    });
  }, [drivers, nameQuery, phoneQuery]);

  async function handleCreateDriver() {
    const name = newName.trim();
    const phone = normalizePhone(newPhone);

    if (!name) return toast.error('Name is required');
    if (!phone) return toast.error('Phone number is required');

    setCreating(true);
    try {
      const res = await createDriver({ name, phone });
      toast.success(res?.message || 'Driver created successfully');
      setAddOpen(false);
      setNewName('');
      setNewPhone('');
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create driver');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-2">
          <Input
            id="driver_search_name"
            label="Search by name"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="e.g. Rahul"
          />
          <Input
            id="driver_search_phone"
            label="Search by phone"
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            placeholder="e.g. 9876543210"
            inputMode="tel"
          />
        </div>

        <div className="flex items-center justify-end">
          <Button onClick={() => setAddOpen(true)} className="bg-gray-900">
            Add Drivers
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Sr. No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={5}>
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filtered.map((d, idx) => (
                  <tr key={d.id} className="text-sm text-gray-800">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3">{d.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          d.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {d.isActive ? 'Active' : 'Inactive'}
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

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Driver</h2>
              <button
                className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                onClick={() => setAddOpen(false)}
                disabled={creating}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Input
                id="new_driver_name"
                label="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Driver name"
                disabled={creating}
              />
              <Input
                id="new_driver_phone"
                label="Phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone number"
                inputMode="tel"
                disabled={creating}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  className="bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50"
                  onClick={() => setAddOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handleCreateDriver()} loading={creating}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
