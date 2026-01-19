import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { CLIENT_STORAGE_KEY, type ClientRecord, getClientInitials } from '../models/client/client';

type DetailItemProps = {
  label: string;
  value?: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-black/50">{label}</div>
      <div className="text-sm text-black">{value || '-'}</div>
    </div>
  );
}

export default function ClientDetails() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [accessName, setAccessName] = useState('');
  const [accessEmail, setAccessEmail] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (!stored) {
      setClients([]);
      setClient(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const normalized = (
          parsed as (ClientRecord & {
            ctaColor?: string;
            ctaColors?: string[];
            logoPreview?: string;
            logoPreviews?: string[];
          })[]
        ).map((item) => ({
          ...item,
          ctaColors:
            Array.isArray(item.ctaColors) && item.ctaColors.length > 0
              ? item.ctaColors
              : item.ctaColor
                ? [item.ctaColor]
                : [],
          logoPreviews: Array.isArray(item.logoPreviews)
            ? item.logoPreviews
            : item.logoPreview
              ? [item.logoPreview]
              : [],
          accessList: Array.isArray(item.accessList) ? item.accessList : [],
        }));
        const found = normalized.find((item) => item.id === clientId) as
          | ClientRecord
          | undefined;
        setClients(normalized);
        setClient(found ?? null);
      } else {
        setClients([]);
        setClient(null);
      }
    } catch {
      setClients([]);
      setClient(null);
    }
  }, [clientId]);

  const initials = useMemo(
    () => getClientInitials(client?.companyName || 'Client'),
    [client?.companyName],
  );

  const accessList = client?.accessList ?? [];
  const ctaColors = client?.ctaColors ?? [];
  const logos = client?.logoPreviews ?? [];

  function persistClients(next: ClientRecord[]) {
    setClients(next);
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(next));
    const refreshed = next.find((item) => item.id === clientId) ?? null;
    setClient(refreshed);
  }

  function handleAddAccess() {
    if (!client) return;
    const trimmedName = accessName.trim();
    const trimmedEmail = accessEmail.trim();
    if (!trimmedName) {
      toast.error('Enter the access name');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast.error('Enter a valid access email');
      return;
    }
    const exists = accessList.some(
      (entry) => entry.email.toLowerCase() === trimmedEmail.toLowerCase(),
    );
    if (exists) {
      toast.error('This email already has access');
      return;
    }
    const updatedClient: ClientRecord = {
      ...client,
      accessList: [...accessList, { name: trimmedName, email: trimmedEmail }],
    };
    const nextClients = (clients.length ? clients : [updatedClient]).map((item) =>
      item.id === updatedClient.id ? updatedClient : item,
    );
    persistClients(nextClients);
    setAccessName('');
    setAccessEmail('');
    toast.success('Access added');
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-black">Client details</h1>
          <p className="text-sm text-black/60">Client not found or removed.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/clients')}>
          Back to clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black">Client details</h1>
          <p className="text-sm text-black/60">
            Full configuration and brand information for this client.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/clients')}>
          Back to clients
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-black">Company details</h2>
            <p className="text-sm text-black/60">Contact information and access list.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Contact name" value={client.contactName} />
            <DetailItem label="Email" value={client.contactEmail} />
          </div>
          <DetailItem label="Phone" value={client.contactPhone} />
          <DetailItem label="Created at" value={client.createdAt} />

          <div className="space-y-3 rounded-md border border-dashed border-black/10 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-black">Website access</h3>
                <span className="text-xs text-black/50">{accessList.length} users</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={handleAddAccess}
              >
                Add access
              </Button>
            </div>

            {accessList.length === 0 ? (
              <p className="text-sm text-black/60">No access users added yet.</p>
            ) : (
              <div className="space-y-2">
                {accessList.map((entry) => (
                  <div
                    key={entry.email}
                    className="flex items-center justify-between rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium text-black">{entry.name}</div>
                      <div className="text-xs text-black/60">{entry.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Access name"
                placeholder="Name"
                value={accessName}
                onChange={(e) => setAccessName(e.target.value)}
              />
              <Input
                label="Access email"
                placeholder="email@company.com"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-black">Website specification</h2>
            <p className="text-sm text-black/60">Branding and content requirements.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {logos.length > 0 ? (
              <div className="flex items-center gap-2">
                {logos.slice(0, 3).map((logo, index) => (
                  <img
                    key={`${logo}-${index}`}
                    src={logo}
                    alt={`${client.companyName} logo ${index + 1}`}
                    className="h-12 w-12 rounded-lg object-cover border border-black/10 bg-white"
                  />
                ))}
                {logos.length > 3 ? (
                  <div className="h-12 w-12 rounded-lg border border-black/10 bg-yellow-50 text-xs font-semibold text-black flex items-center justify-center">
                    +{logos.length - 3}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-14 w-14 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center font-semibold text-lg">
                {initials}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-black">{client.companyName}</div>
              <div className="text-sm text-black/60">{client.tagline || 'No tagline'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
              CTA colors
            </div>
            {ctaColors.length === 0 ? (
              <p className="text-sm text-black/60">No CTA colors defined.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ctaColors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1 text-xs"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-black/70">{color}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-black/10 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
              Custom text
            </div>
            <p className="mt-2 text-sm text-black/70">{client.customText || '-'}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black">Website requirements</h3>
            <p className="mt-2 text-sm text-black/70">{client.notes || '-'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
