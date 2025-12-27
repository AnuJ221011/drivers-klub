import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import FleetSelectBar from '../components/fleet/FleetSelectBar';
import Button from '../components/ui/Button';
import Table, { type Column } from '../components/ui/Table';
import { useFleet } from '../context/FleetContext';
import { getAttendanceHistory } from '../api/attendance.api';
import type { AttendanceEntity } from '../models/attendance/attendance';

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function CheckinsPage() {
  const { effectiveFleetId } = useFleet();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AttendanceEntity[]>([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAttendanceHistory({
        page,
        limit,
        ...(effectiveFleetId ? { fleetId: effectiveFleetId } : {}),
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny.response?.data;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : 'Failed to load check-in history';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveFleetId, page, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [effectiveFleetId]);

  const columns = useMemo<Column<AttendanceEntity>[]>(
    () => [
      { key: 'index', label: 'S.No', render: (_r, i) => i + 1 },
      {
        key: 'driver',
        label: 'Driver',
        render: (r) => `${r.driver?.firstName || ''} ${r.driver?.lastName || ''}`.trim() || r.driverId,
      },
      {
        key: 'fleet',
        label: 'Fleet',
        render: (r) => r.driver?.fleet?.name || '-',
      },
      {
        key: 'checkInTime',
        label: 'Check-in',
        render: (r) => formatDateTime(r.checkInTime),
      },
      {
        key: 'checkOutTime',
        label: 'Check-out',
        render: (r) => formatDateTime(r.checkOutTime),
      },
      {
        key: 'status',
        label: 'Status',
      },
      {
        key: 'remarks',
        label: 'Remarks',
        render: (r) => r.adminRemarks || '-',
      },
    ],
    [],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Check-ins</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <FleetSelectBar />
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading check-in history…</div>
      ) : (
        <Table columns={columns} data={rows} />
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-black/60">
          Page {page} of {totalPages} • Total {total}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

