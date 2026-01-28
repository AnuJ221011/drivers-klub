import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Table, { type Column } from '../components/ui/Table';
import Modal from '../components/layout/Modal';

import {
  DRIVER_PREFERENCE_LABEL,
  type DriverPreferenceChangeRequest,
  type DriverPreferenceKey,
} from '../models/driver/driverPreferences';

import {
  getPendingDriverPreferenceRequests,
  updateDriverPreferenceRequestStatus,
} from '../api/driverPreference.api';

type TabKey = 'all' | 'pending';

function formatIso(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatRequestedPreference(req: DriverPreferenceChangeRequest): string {
  const entries = Object.entries(req.requestedPreference || {}) as Array<
    [DriverPreferenceKey, boolean]
  >;
  if (entries.length === 0) return '—';
  return entries
    .map(([k, v]) => `${DRIVER_PREFERENCE_LABEL[k]}: ${v ? 'ON' : 'OFF'}`)
    .join(', ');
}

function StatusBadge({ status }: { status: DriverPreferenceChangeRequest['status'] }) {
  const cls =
    status === 'PENDING'
      ? 'bg-yellow-100 text-black'
      : status === 'APPROVED'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700';

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default function DriverPreferencesPage() {
  const [tab, setTab] = useState<TabKey>('pending');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<DriverPreferenceChangeRequest[]>([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pending = useMemo(
    () => requests.filter((r) => r.status === 'PENDING'),
    [requests],
  );

  const refresh = async () => {
  setLoading(true);
  try {
    const reqs = await getPendingDriverPreferenceRequests();

    const normalized = reqs.map((r) => ({
      ...r,
      requestedPreference:
        // flatten bad backend shape
        'requestedPreference' in (r.requestedPreference as any)
          ? (r.requestedPreference as any).requestedPreference
          : r.requestedPreference,
    }));

    setRequests(normalized);
    console.log('Normalized requests:', normalized);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to load requests');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adminColumns: Column<DriverPreferenceChangeRequest>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    {
      key: 'shortId',
      label: 'Request ID',
      render: (r) => r.shortId || r.id,
    },
    {
      key: 'driverId',
      label: 'Driver ID',
      render: (r) => r.driverShortId || r.driverId,
    },
    {
      key: 'requestedPreference',
      label: 'Requested changes',
      render: (r) => formatRequestedPreference(r),
    },
    {
      key: 'requestAt',
      label: 'Requested at',
      render: (r) => formatIso(r.requestAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'reviewedAt',
      label: 'Reviewed at',
      render: (r) => (r.reviewedAt ? formatIso(r.reviewedAt) : '—'),
    },
    {
      key: 'rejectionReason',
      label: 'Rejection reason',
      render: (r) => r.rejectionReason || '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status !== 'PENDING' ? (
          <span className="text-sm text-black/50">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              className="px-3 py-1.5 text-sm"
              onClick={async () => {
                try {
                  await updateDriverPreferenceRequestStatus({
                    id: r.id,
                    status: 'APPROVED',
                  });
                  toast.success('Request approved');
                  await refresh();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : 'Failed to approve',
                  );
                }
              }}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-sm"
              onClick={() => {
                setRejectId(r.id);
                setRejectReason('');
                setRejectOpen(true);
              }}
            >
              Reject
            </Button>
          </div>
        ),
    },
  ];

  const rows = tab === 'pending' ? pending : requests;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Driver Preference Requests</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={tab === 'all' ? 'primary' : 'secondary'}
            onClick={() => setTab('all')}
          >
            All ({requests.length})
          </Button>
          <Button
            variant={tab === 'pending' ? 'primary' : 'secondary'}
            onClick={() => setTab('pending')}
          >
            Pending ({pending.length})
          </Button>
          <Button variant="secondary" onClick={() => void refresh()} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="text-sm text-black/60">
            {tab === 'pending' ? 'No pending requests.' : 'No requests found.'}
          </div>
        ) : (
          <Table columns={adminColumns} data={rows} />
        )}
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectId(null);
          setRejectReason('');
        }}
        title="Reject request"
      >
        <div className="space-y-3">
          <div className="text-sm text-black/70">
            Add a rejection reason (required).
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            rows={4}
            placeholder="demo test"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setRejectOpen(false);
                setRejectId(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectId || rejectReason.trim().length === 0}
              onClick={async () => {
                if (!rejectId) return;
                try {
                  await updateDriverPreferenceRequestStatus({
                    id: rejectId,
                    status: 'REJECTED',
                    rejection_reason: rejectReason.trim(),
                  });
                  toast.success('Request rejected');
                  setRejectOpen(false);
                  setRejectId(null);
                  setRejectReason('');
                  await refresh();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : 'Failed to reject',
                  );
                }
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
