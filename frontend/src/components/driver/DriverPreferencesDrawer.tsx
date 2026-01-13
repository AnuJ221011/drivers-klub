import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '../ui/Button';
import Modal from '../layout/Modal';
import Switch from '../ui/Switch';

import {
  DRIVER_PREFERENCE_GROUPS,
  DRIVER_PREFERENCE_LABEL,
  type DriverPreference,
  type DriverPreferenceChangeRequest,
  type DriverPreferenceKey,
} from '../../models/driver/driverPreferences';

import {
  getPendingDriverPreferenceRequests,
} from '../../api/driverPreference.api';


import {
  getDriverPreference,
  createDriverPreferenceChangeRequest,
} from '../../api/driverPreferences.extra'; 

type Props = {
  driverId: string;
};

function buildPendingByKey(
  driverId: string,
  pending: DriverPreferenceChangeRequest[],
): Partial<Record<DriverPreferenceKey, boolean>> {
  const best: Partial<Record<DriverPreferenceKey, { value: boolean; at: number }>> =
    {};

  for (const r of pending) {
    if (r.driverId !== driverId) continue;
    const at = Number(new Date(r.requestAt));

    for (const [k, v] of Object.entries(r.requestedPreference || {}) as Array<
      [DriverPreferenceKey, boolean]
    >) {
      const existing = best[k];
      if (!existing || at >= existing.at) {
        best[k] = { value: v, at };
      }
    }
  }

  const out: Partial<Record<DriverPreferenceKey, boolean>> = {};
  for (const [k, payload] of Object.entries(best) as Array<
    [DriverPreferenceKey, { value: boolean; at: number }]
  >) {
    out[k] = payload.value;
  }

  return out;
}

export default function DriverPreferencesDrawer({ driverId }: Props) {
  const [loading, setLoading] = useState(false);
  const [pref, setPref] = useState<DriverPreference | null>(null);
  const [pending, setPending] = useState<DriverPreferenceChangeRequest[]>([]);
  const [editMode, setEditMode] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKey, setConfirmKey] = useState<DriverPreferenceKey | null>(null);
  const [confirmValue, setConfirmValue] = useState(false);

  const pendingByKey = useMemo(
    () => buildPendingByKey(driverId, pending),
    [driverId, pending],
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const [p, reqs] = await Promise.all([
        getDriverPreference(driverId),
        getPendingDriverPreferenceRequests(),
      ]);
      setPref(p);
      setPending(reqs);
      console.log('Drivers Preferences', p);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const pendingForDriver = pending.filter((r) => r.driverId === driverId);

  const onToggle = (key: DriverPreferenceKey, next: boolean) => {
    setConfirmKey(key);
    setConfirmValue(next);
    setConfirmOpen(true);
  };

  const confirmTitle =
    confirmKey != null ? DRIVER_PREFERENCE_LABEL[confirmKey] : 'Confirm change';

  const confirmBody =
    confirmKey != null
      ? confirmValue
        ? `Press "Confirm" to enable this feature. Changes take place on next day login.\n\nYou can turn it off anytime.`
        : `Press "Confirm" to disable this feature. Changes take place on next day login.\n\nYou can turn it on anytime.`
      : '';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-black/60">Driver ID</div>
          <div className="text-sm font-semibold text-black break-all">
            {driverId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void refresh()} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {pendingForDriver.length > 0 && (
        <div className="rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-black">
          <div className="font-semibold">Pending approvals</div>
          <div className="text-black/70">
            This driver has pending preference approvals. Changes are temporarily locked.
          </div>
        </div>
      )}

      {!pref ? (
        <div className="text-sm text-black/60">Loading preferences...</div>
      ) : (
        <div className="rounded-lg border border-black/10 bg-white">
          <div className="divide-y">
            {DRIVER_PREFERENCE_GROUPS.map((group) => (
              <div key={group.title} className="px-4 py-3">
                <div className="mb-2 font-semibold text-black">
                  {group.title}
                </div>
                <div className="space-y-2">
                  {group.keys.map((key) => {
                    const pendingValue = pendingByKey[key];
                    const checked = pendingValue ?? pref[key];
                    const lockedByPending = typeof pendingValue === 'boolean';
                    const disabled = !editMode || lockedByPending;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {DRIVER_PREFERENCE_LABEL[key]}
                          </div>
                          {lockedByPending && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-black/70">
                              Pending
                            </span>
                          )}
                        </div>

                        <Switch
                          checked={checked}
                          disabled={disabled}
                          aria-label={DRIVER_PREFERENCE_LABEL[key]}
                          onChange={(next) => onToggle(key, next)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmKey(null);
        }}
        title={confirmTitle}
        size="sm"
      >
        <div className="space-y-4">
          <div className="whitespace-pre-line text-sm text-black/80">
            {confirmBody}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmKey(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!confirmKey) return;
                try {
                  await createDriverPreferenceChangeRequest({
                    driverId,
                    key: confirmKey,
                    value: confirmValue,
                  });
                  toast.success('Request sent for approval');
                  setConfirmOpen(false);
                  setConfirmKey(null);
                  setEditMode(false);
                  await refresh();
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : 'Failed to create request',
                  );
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
