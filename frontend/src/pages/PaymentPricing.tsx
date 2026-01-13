import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, QrCode } from 'lucide-react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table, { type Column } from '../components/ui/Table';
import Modal from '../components/layout/Modal';
import FleetSelectBar from '../components/fleet/FleetSelectBar';
import { useFleet } from '../context/FleetContext';
import { getDriversByFleet } from '../api/driver.api';
import { getVehiclesByFleet } from '../api/vehicle.api';
import {
  createIncentive,
  createPenalty,
  createRentalPlan,
  generateVehicleQr,
  getPendingPayouts,
  getPendingReconciliations,
  getRentalPlans,
  getVehicleQr,
  payoutIncentive,
  processCollectionPayout,
  reconcileCollection,
  waivePenalty,
  type Incentive,
  type IncentiveCategory,
  type Penalty,
  type PenaltyCategory,
  type PenaltyType,
  type PendingPayout,
  type PendingReconciliation,
  type RentalPlan,
  type VehicleQr,
} from '../api/paymentAdmin.api';
import type { Driver } from '../models/driver/driver';
import type { Vehicle } from '../models/vehicle/vehicle';

type TabKey =
  | 'RENTAL_PLANS'
  | 'PENALTIES'
  | 'INCENTIVES'
  | 'RECONCILIATIONS'
  | 'PAYOUTS'
  | 'VEHICLE_QR';

const TAB_LABEL: Record<TabKey, string> = {
  RENTAL_PLANS: 'Rental Plans',
  PENALTIES: 'Penalties',
  INCENTIVES: 'Incentives',
  RECONCILIATIONS: 'Pending Reconciliations',
  PAYOUTS: 'Pending Payouts',
  VEHICLE_QR: 'Vehicle QR',
};

type IncentiveWithPayout = Incentive & {
  payout?: { txnId: string; status: 'PENDING' | 'SUCCESS' | 'FAILED'; utr?: string; paidAt?: string };
};

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('en-IN');
}

function driverLabel(d?: { firstName?: string; lastName?: string } | null) {
  if (!d) return '—';
  return `${d.firstName || ''} ${d.lastName || ''}`.trim() || '—';
}

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

function getApiErrorStatus(err: unknown): number | undefined {
  return (err as ApiErrorLike)?.response?.status;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as ApiErrorLike)?.response?.data;
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export default function PaymentPricing() {
  const { effectiveFleetId } = useFleet();
  const fleetId = effectiveFleetId;

  const [tab, setTab] = useState<TabKey>('RENTAL_PLANS');

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const driverNameById = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);
  const driverIdsForSelectedFleet = useMemo(() => new Set(drivers.map((d) => d.id)), [drivers]);

  const [driversLoading, setDriversLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // ===== Rental plans =====
  const [activeOnly, setActiveOnly] = useState(true);
  const [rentalPlans, setRentalPlans] = useState<RentalPlan[]>([]);
  const [rentalPlansLoading, setRentalPlansLoading] = useState(false);

  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createPlanBusy, setCreatePlanBusy] = useState(false);
  const [planDraft, setPlanDraft] = useState({
    name: 'Weekly Plan',
    rentalAmount: '3500',
    depositAmount: '5000',
    validityDays: '7',
  });

  // ===== Penalties =====
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [createPenaltyOpen, setCreatePenaltyOpen] = useState(false);
  const [createPenaltyBusy, setCreatePenaltyBusy] = useState(false);
  const [waivePenaltyId, setWaivePenaltyId] = useState<string | null>(null);
  const [waiveBusy, setWaiveBusy] = useState(false);
  const [waiverReason, setWaiverReason] = useState('');
  const [penaltyDraft, setPenaltyDraft] = useState({
    driverId: '',
    type: 'MONETARY' as PenaltyType,
    amount: '500',
    reason: 'Customer complaint',
    category: 'BEHAVIOR' as PenaltyCategory,
    suspensionStartDate: '',
    suspensionEndDate: '',
  });

  // ===== Incentives =====
  const [incentives, setIncentives] = useState<IncentiveWithPayout[]>([]);
  const [createIncentiveOpen, setCreateIncentiveOpen] = useState(false);
  const [createIncentiveBusy, setCreateIncentiveBusy] = useState(false);
  const [incentiveDraft, setIncentiveDraft] = useState({
    driverId: '',
    amount: '500',
    reason: 'Completed 50 trips this month',
    category: 'MILESTONE' as IncentiveCategory,
  });

  // ===== Reconciliations / payouts =====
  const [pendingReconciliations, setPendingReconciliations] = useState<PendingReconciliation[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [reconciliationsLoading, setReconciliationsLoading] = useState(false);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [reconcileDraft, setReconcileDraft] = useState({ expectedRevenue: '', notes: '' });

  const reconciliationsForUi = useMemo(() => {
    if (!fleetId) return pendingReconciliations;
    return pendingReconciliations.filter((x) => driverIdsForSelectedFleet.has(x.driverId));
  }, [pendingReconciliations, fleetId, driverIdsForSelectedFleet]);

  const payoutsForUi = useMemo(() => {
    if (!fleetId) return pendingPayouts;
    return pendingPayouts.filter((x) => driverIdsForSelectedFleet.has(x.driverId));
  }, [pendingPayouts, fleetId, driverIdsForSelectedFleet]);

  // ===== Vehicle QR =====
  const [vehicleQrs, setVehicleQrs] = useState<Record<string, VehicleQr>>({});
  const [qrVehicleId, setQrVehicleId] = useState<string | null>(null);
  const [qrViewVehicleId, setQrViewVehicleId] = useState<string | null>(null);
  const [qrBusyVehicleId, setQrBusyVehicleId] = useState<string | null>(null);

  const qrToView = qrViewVehicleId ? vehicleQrs[qrViewVehicleId] : undefined;

  // ===== Load drivers/vehicles when fleet changes =====
  useEffect(() => {
    setDrivers([]);
    setVehicles([]);
    setVehicleQrs({});

    if (!fleetId) {
      setPenaltyDraft((p) => ({ ...p, driverId: '' }));
      setIncentiveDraft((p) => ({ ...p, driverId: '' }));
      return;
    }

    let cancelled = false;
    (async () => {
      setDriversLoading(true);
      setVehiclesLoading(true);
      try {
        const [drv, veh] = await Promise.all([getDriversByFleet(fleetId), getVehiclesByFleet(fleetId)]);
        if (cancelled) return;
        setDrivers(drv || []);
        setVehicles(veh || []);

        const firstDriverId = drv?.[0]?.id || '';
        setPenaltyDraft((p) => ({ ...p, driverId: p.driverId || firstDriverId }));
        setIncentiveDraft((p) => ({ ...p, driverId: p.driverId || firstDriverId }));
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Failed to load fleet data'));
      } finally {
        if (!cancelled) {
          setDriversLoading(false);
          setVehiclesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fleetId]);

  // ===== Load rental plans when tab / filters change =====
  useEffect(() => {
    if (tab !== 'RENTAL_PLANS') return;
    setRentalPlans([]);
    if (!fleetId) return;

    let cancelled = false;
    (async () => {
      setRentalPlansLoading(true);
      try {
        const plans = await getRentalPlans(fleetId, { activeOnly });
        if (!cancelled) setRentalPlans(plans || []);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Failed to load rental plans'));
      } finally {
        if (!cancelled) setRentalPlansLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, fleetId, activeOnly]);

  // ===== Load pending reconciliations =====
  useEffect(() => {
    if (tab !== 'RECONCILIATIONS') return;
    let cancelled = false;
    (async () => {
      setReconciliationsLoading(true);
      try {
        const rows = await getPendingReconciliations();
        if (!cancelled) setPendingReconciliations(rows || []);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Failed to load pending reconciliations'));
      } finally {
        if (!cancelled) setReconciliationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // ===== Load pending payouts =====
  useEffect(() => {
    if (tab !== 'PAYOUTS') return;
    let cancelled = false;
    (async () => {
      setPayoutsLoading(true);
      try {
        const rows = await getPendingPayouts();
        if (!cancelled) setPendingPayouts(rows || []);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, 'Failed to load pending payouts'));
      } finally {
        if (!cancelled) setPayoutsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // ===== Load vehicle QR statuses (best-effort) =====
  useEffect(() => {
    if (tab !== 'VEHICLE_QR') return;
    if (!fleetId) return;
    if (vehicles.length === 0) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        vehicles.map(async (v) => {
          try {
            const qr = await getVehicleQr(v.id);
            return { vehicleId: v.id, qr };
          } catch (err: unknown) {
            const status = getApiErrorStatus(err);
            if (status === 404) return { vehicleId: v.id, qr: null };
            throw err;
          }
        })
      );

      if (cancelled) return;

      const next: Record<string, VehicleQr> = {};
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        if (!r.value.qr) continue;
        next[r.value.vehicleId] = r.value.qr;
      }
      setVehicleQrs(next);
    })().catch((err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Failed to load vehicle QR status'));
    });

    return () => {
      cancelled = true;
    };
  }, [tab, fleetId, vehicles]);

  // ===== Columns =====
  const rentalPlanColumns: Column<RentalPlan>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'name', label: 'Name' },
    { key: 'rentalAmount', label: 'Rental Amount', render: (p) => fmtMoney(p.rentalAmount) },
    { key: 'depositAmount', label: 'Deposit Amount', render: (p) => fmtMoney(p.depositAmount) },
    { key: 'validityDays', label: 'Validity (days)' },
    {
      key: 'isActive',
      label: 'Status',
      render: (p) => (
        <span className={`px-2 py-1 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {p.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const penaltyColumns: Column<Penalty>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'driver', label: 'Driver', render: (p) => driverNameById.get(p.driverId) || p.driverId },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category', render: (p) => p.category || '—' },
    { key: 'amount', label: 'Amount', render: (p) => (p.type === 'MONETARY' ? fmtMoney(p.amount || 0) : '—') },
    { key: 'reason', label: 'Reason' },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <span className={`px-2 py-1 rounded-full text-xs ${p.isWaived ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {p.isWaived ? 'Waived' : 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <Button
          variant="secondary"
          className="px-3 py-1"
          disabled={p.isWaived}
          onClick={() => {
            setWaivePenaltyId(p.id);
            setWaiverReason('');
          }}
        >
          Waive
        </Button>
      ),
    },
  ];

  const incentiveColumns: Column<IncentiveWithPayout>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'driver', label: 'Driver', render: (x) => driverNameById.get(x.driverId) || x.driverId },
    { key: 'category', label: 'Category', render: (x) => x.category || '—' },
    { key: 'amount', label: 'Amount', render: (x) => fmtMoney(x.amount) },
    { key: 'reason', label: 'Reason' },
    {
      key: 'paid',
      label: 'Paid',
      render: (x) => (
        <span className={`px-2 py-1 rounded-full text-xs ${x.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {x.isPaid ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (x) => (
        <Button
          variant="secondary"
          className="px-3 py-1"
          disabled={x.isPaid}
          onClick={async () => {
            try {
              const res = await payoutIncentive(x.id);
              setIncentives((prev) =>
                prev.map((i) =>
                  i.id === x.id
                    ? {
                        ...i,
                        isPaid: true,
                        paidAt: new Date().toISOString(),
                        payout: {
                          txnId: res.txnId,
                          status: res.status,
                          utr: res.utr,
                          paidAt: new Date().toISOString(),
                        },
                      }
                    : i
                )
              );
              toast.success(`Incentive payout initiated (${res.txnId})`);
            } catch (err: unknown) {
              toast.error(getApiErrorMessage(err, 'Failed to initiate incentive payout'));
            }
          }}
        >
          Payout
        </Button>
      ),
    },
  ];

  const reconciliationColumns: Column<PendingReconciliation>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'driver', label: 'Driver', render: (c) => driverLabel(c.driver) },
    { key: 'vehicle', label: 'Vehicle', render: (c) => c.vehicle?.vehicleNumber || '—' },
    { key: 'date', label: 'Date', render: (c) => new Date(c.date).toLocaleDateString() },
    { key: 'totalCollection', label: 'Total Collection', render: (c) => fmtMoney(c.totalCollection) },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <Button
          variant="secondary"
          className="px-3 py-1"
          onClick={() => {
            setReconcileId(c.id);
            setReconcileDraft({ expectedRevenue: String(Math.round(c.totalCollection)), notes: 'All collections verified' });
          }}
        >
          Reconcile
        </Button>
      ),
    },
  ];

  const payoutColumns: Column<PendingPayout>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'driver', label: 'Driver', render: (c) => driverLabel(c.driver) },
    { key: 'bank', label: 'Bank Account', render: (c) => c.driver?.bankAccountNumber || '—' },
    { key: 'date', label: 'Date', render: (c) => new Date(c.date).toLocaleDateString() },
    { key: 'netPayout', label: 'Net Payout', render: (c) => (typeof c.netPayout === 'number' ? fmtMoney(c.netPayout) : '—') },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <Button
          className="px-3 py-1"
          onClick={async () => {
            try {
              const res = await processCollectionPayout(c.id);
              toast.success(`Payout processed (${res.txnId})`);
              const rows = await getPendingPayouts();
              setPendingPayouts(rows || []);
            } catch (err: unknown) {
              toast.error(getApiErrorMessage(err, 'Failed to process payout'));
            }
          }}
        >
          Payout
        </Button>
      ),
    },
  ];

  const vehicleQrColumns: Column<Vehicle>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'number', label: 'Vehicle', render: (v) => (v.model ? `${v.number} (${v.model})` : v.number) },
    {
      key: 'status',
      label: 'QR Status',
      render: (v) => {
        const qr = vehicleQrs[v.id];
        const active = qr?.isActive;
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {active ? 'Active' : 'Not generated'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1"
            disabled={qrBusyVehicleId === v.id || !!vehicleQrs[v.id]}
            onClick={() => {
              if (vehicleQrs[v.id]) return;
              setQrVehicleId(v.id);
            }}
          >
            {vehicleQrs[v.id] ? 'Generated' : 'Generate'}
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1"
            disabled={!vehicleQrs[v.id]}
            onClick={() => setQrViewVehicleId(v.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  // ===== Actions =====
  async function onCreateRentalPlan() {
    if (!fleetId) return toast.error('Select a fleet first');
    const rentalAmount = Number(planDraft.rentalAmount);
    const depositAmount = Number(planDraft.depositAmount);
    const validityDays = Number(planDraft.validityDays);
    if (!planDraft.name.trim()) return toast.error('Plan name is required');
    if (!Number.isFinite(rentalAmount) || rentalAmount <= 0) return toast.error('Rental amount must be > 0');
    if (!Number.isFinite(depositAmount) || depositAmount < 0) return toast.error('Deposit amount must be >= 0');
    if (!Number.isFinite(validityDays) || validityDays <= 0) return toast.error('Validity days must be > 0');

    setCreatePlanBusy(true);
    try {
      await createRentalPlan({
        fleetId,
        name: planDraft.name.trim(),
        rentalAmount,
        depositAmount,
        validityDays,
      });
      toast.success('Rental plan created');
      setCreatePlanOpen(false);
      const plans = await getRentalPlans(fleetId, { activeOnly });
      setRentalPlans(plans || []);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to create rental plan'));
    } finally {
      setCreatePlanBusy(false);
    }
  }

  async function onCreatePenalty() {
    if (!fleetId) return toast.error('Select a fleet first');
    if (!penaltyDraft.driverId) return toast.error('Driver is required');
    if (!penaltyDraft.reason.trim()) return toast.error('Reason is required');

    const type = penaltyDraft.type;
    const payload: {
      driverId: string;
      type: PenaltyType;
      amount?: number;
      reason: string;
      category?: PenaltyCategory;
      suspensionStartDate?: string;
      suspensionEndDate?: string;
    } = {
      driverId: penaltyDraft.driverId,
      type,
      reason: penaltyDraft.reason.trim(),
      category: penaltyDraft.category,
    };

    if (type === 'MONETARY') {
      const amount = Number(penaltyDraft.amount);
      if (!Number.isFinite(amount) || amount <= 0) return toast.error('Amount must be > 0 for monetary penalties');
      payload.amount = amount;
    }
    if (type === 'SUSPENSION') {
      if (!penaltyDraft.suspensionStartDate || !penaltyDraft.suspensionEndDate) return toast.error('Suspension start/end dates are required');
      payload.suspensionStartDate = new Date(penaltyDraft.suspensionStartDate).toISOString();
      payload.suspensionEndDate = new Date(penaltyDraft.suspensionEndDate).toISOString();
    }

    setCreatePenaltyBusy(true);
    try {
      const created = await createPenalty(payload);
      setPenalties((prev) => [created, ...prev]);
      setCreatePenaltyOpen(false);
      toast.success('Penalty created');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to create penalty'));
    } finally {
      setCreatePenaltyBusy(false);
    }
  }

  async function onWaivePenalty(id: string) {
    if (!waiverReason.trim()) return toast.error('Waiver reason is required');
    setWaiveBusy(true);
    try {
      const updated = await waivePenalty(id, { waiverReason: waiverReason.trim() });
      setPenalties((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setWaivePenaltyId(null);
      toast.success('Penalty waived successfully');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to waive penalty'));
    } finally {
      setWaiveBusy(false);
    }
  }

  async function onCreateIncentive() {
    if (!fleetId) return toast.error('Select a fleet first');
    if (!incentiveDraft.driverId) return toast.error('Driver is required');
    const amount = Number(incentiveDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error('Amount must be > 0');
    if (!incentiveDraft.reason.trim()) return toast.error('Reason is required');

    setCreateIncentiveBusy(true);
    try {
      const created = await createIncentive({
        driverId: incentiveDraft.driverId,
        amount,
        reason: incentiveDraft.reason.trim(),
        category: incentiveDraft.category,
      });
      setIncentives((prev) => [created, ...prev]);
      setCreateIncentiveOpen(false);
      toast.success('Incentive created');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to create incentive'));
    } finally {
      setCreateIncentiveBusy(false);
    }
  }

  async function onReconcileCollection(id: string) {
    const expectedRevenueNum = reconcileDraft.expectedRevenue ? Number(reconcileDraft.expectedRevenue) : undefined;
    if (expectedRevenueNum !== undefined && (!Number.isFinite(expectedRevenueNum) || expectedRevenueNum < 0)) return toast.error('Expected revenue must be >= 0');
    if (!reconcileDraft.notes.trim()) return toast.error('Reconciliation notes are required');

    setReconcileBusy(true);
    try {
      await reconcileCollection(id, { expectedRevenue: expectedRevenueNum, reconciliationNotes: reconcileDraft.notes.trim() });
      toast.success('Collection reconciled successfully');
      setReconcileId(null);
      const [recs, pays] = await Promise.all([getPendingReconciliations(), getPendingPayouts()]);
      setPendingReconciliations(recs || []);
      setPendingPayouts(pays || []);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to reconcile collection'));
    } finally {
      setReconcileBusy(false);
    }
  }

  async function onGenerateVehicleQr(vehicleId: string) {
    setQrBusyVehicleId(vehicleId);
    try {
      const created = await generateVehicleQr(vehicleId);
      setVehicleQrs((prev) => ({ ...prev, [vehicleId]: created }));
      toast.success('Vehicle QR generated');
      setQrVehicleId(null);
      setQrViewVehicleId(vehicleId);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to generate vehicle QR'));
    } finally {
      setQrBusyVehicleId(null);
    }
  }

  // Ensure view modal has latest QR
  useEffect(() => {
    if (!qrViewVehicleId) return;
    if (!fleetId) return;
    if (vehicleQrs[qrViewVehicleId]) return;

    let cancelled = false;
    (async () => {
      try {
        const qr = await getVehicleQr(qrViewVehicleId);
        if (!cancelled) setVehicleQrs((prev) => ({ ...prev, [qrViewVehicleId]: qr }));
      } catch (err: unknown) {
        const status = getApiErrorStatus(err);
        if (status === 404) return;
        toast.error(getApiErrorMessage(err, 'Failed to load vehicle QR'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qrViewVehicleId, fleetId, vehicleQrs]);

  const fleetRequiredNotice = !fleetId ? (
    <div className="text-sm text-black/60">Select a fleet to use this section.</div>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Payment & Pricing</h1>
            <div className="text-sm text-black/60">Admin tools</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FleetSelectBar className="w-72" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-black/10 overflow-x-auto">
        {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap
              ${
                tab === k
                  ? 'border-yellow-400 text-black'
                  : 'border-transparent text-black/60 hover:text-black'
              }`}
          >
            {TAB_LABEL[k]}
          </button>
        ))}
      </div>

      {tab === 'RENTAL_PLANS' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreatePlanOpen(true)} disabled={!fleetId}>
                + Create Rental Plan
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveOnly((v) => !v)}
                className="px-3 py-2"
                title="Toggle activeOnly"
                disabled={!fleetId}
              >
                Active only: {activeOnly ? 'ON' : 'OFF'}
              </Button>
              {rentalPlansLoading ? <div className="text-sm text-black/60">Loading…</div> : null}
            </div>
            {fleetRequiredNotice}
          </div>

          <Table columns={rentalPlanColumns} data={rentalPlans} />

          <Modal open={createPlanOpen} onClose={() => setCreatePlanOpen(false)} title="Create Rental Plan">
            <div className="space-y-3">
              <Input label="Name" value={planDraft.name} onChange={(e) => setPlanDraft((p) => ({ ...p, name: e.target.value }))} />
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label="Rental Amount"
                  type="number"
                  value={planDraft.rentalAmount}
                  onChange={(e) => setPlanDraft((p) => ({ ...p, rentalAmount: e.target.value }))}
                />
                <Input
                  label="Deposit Amount"
                  type="number"
                  value={planDraft.depositAmount}
                  onChange={(e) => setPlanDraft((p) => ({ ...p, depositAmount: e.target.value }))}
                />
                <Input
                  label="Validity Days"
                  type="number"
                  value={planDraft.validityDays}
                  onChange={(e) => setPlanDraft((p) => ({ ...p, validityDays: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCreatePlanOpen(false)} disabled={createPlanBusy}>
                  Cancel
                </Button>
                <Button onClick={onCreateRentalPlan} disabled={createPlanBusy}>
                  {createPlanBusy ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'PENALTIES' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreatePenaltyOpen(true)} disabled={!fleetId || driversLoading}>
                + Create Penalty
              </Button>
              {driversLoading ? <div className="text-sm text-black/60">Loading drivers…</div> : null}
            </div>
            {fleetRequiredNotice}
          </div>

          <Table columns={penaltyColumns} data={penalties} />

          <Modal open={createPenaltyOpen} onClose={() => setCreatePenaltyOpen(false)} title="Create Penalty">
            <div className="space-y-3">
              <Select
                label="Driver"
                value={penaltyDraft.driverId}
                onChange={(e) => setPenaltyDraft((p) => ({ ...p, driverId: e.target.value }))}
                options={drivers.map((d) => ({ label: d.name, value: d.id }))}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  label="Type"
                  value={penaltyDraft.type}
                  onChange={(e) => setPenaltyDraft((p) => ({ ...p, type: e.target.value as PenaltyType }))}
                  options={[
                    { label: 'MONETARY', value: 'MONETARY' },
                    { label: 'WARNING', value: 'WARNING' },
                    { label: 'SUSPENSION', value: 'SUSPENSION' },
                    { label: 'BLACKLIST', value: 'BLACKLIST' },
                  ]}
                />
                <Select
                  label="Category"
                  value={penaltyDraft.category}
                  onChange={(e) => setPenaltyDraft((p) => ({ ...p, category: e.target.value as PenaltyCategory }))}
                  options={[
                    { label: 'BEHAVIOR', value: 'BEHAVIOR' },
                    { label: 'SAFETY', value: 'SAFETY' },
                    { label: 'DAMAGE', value: 'DAMAGE' },
                    { label: 'OTHER', value: 'OTHER' },
                  ]}
                />
              </div>

              {penaltyDraft.type === 'MONETARY' ? (
                <Input
                  label="Amount"
                  type="number"
                  value={penaltyDraft.amount}
                  onChange={(e) => setPenaltyDraft((p) => ({ ...p, amount: e.target.value }))}
                />
              ) : null}

              {penaltyDraft.type === 'SUSPENSION' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Suspension Start Date"
                    type="date"
                    value={penaltyDraft.suspensionStartDate}
                    onChange={(e) => setPenaltyDraft((p) => ({ ...p, suspensionStartDate: e.target.value }))}
                  />
                  <Input
                    label="Suspension End Date"
                    type="date"
                    value={penaltyDraft.suspensionEndDate}
                    onChange={(e) => setPenaltyDraft((p) => ({ ...p, suspensionEndDate: e.target.value }))}
                  />
                </div>
              ) : null}

              <Input label="Reason" value={penaltyDraft.reason} onChange={(e) => setPenaltyDraft((p) => ({ ...p, reason: e.target.value }))} />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCreatePenaltyOpen(false)} disabled={createPenaltyBusy}>
                  Cancel
                </Button>
                <Button onClick={onCreatePenalty} disabled={createPenaltyBusy}>
                  {createPenaltyBusy ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal open={waivePenaltyId != null} onClose={() => setWaivePenaltyId(null)} title="Waive Penalty">
            <div className="space-y-3">
              <Input
                label="Waiver Reason"
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                placeholder="First-time offense, driver apologized"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setWaivePenaltyId(null)} disabled={waiveBusy}>
                  Cancel
                </Button>
                <Button onClick={() => onWaivePenalty(waivePenaltyId || '')} disabled={waiveBusy}>
                  {waiveBusy ? 'Waiving…' : 'Waive'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'INCENTIVES' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateIncentiveOpen(true)} disabled={!fleetId || driversLoading}>
                + Create Incentive
              </Button>
              {driversLoading ? <div className="text-sm text-black/60">Loading drivers…</div> : null}
            </div>
            {fleetRequiredNotice}
          </div>

          <Table columns={incentiveColumns} data={incentives} />

          <Modal open={createIncentiveOpen} onClose={() => setCreateIncentiveOpen(false)} title="Create Incentive">
            <div className="space-y-3">
              <Select
                label="Driver"
                value={incentiveDraft.driverId}
                onChange={(e) => setIncentiveDraft((p) => ({ ...p, driverId: e.target.value }))}
                options={drivers.map((d) => ({ label: d.name, value: d.id }))}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Amount"
                  type="number"
                  value={incentiveDraft.amount}
                  onChange={(e) => setIncentiveDraft((p) => ({ ...p, amount: e.target.value }))}
                />
                <Select
                  label="Category"
                  value={incentiveDraft.category}
                  onChange={(e) => setIncentiveDraft((p) => ({ ...p, category: e.target.value as IncentiveCategory }))}
                  options={[
                    { label: 'MILESTONE', value: 'MILESTONE' },
                    { label: 'PERFORMANCE', value: 'PERFORMANCE' },
                    { label: 'OTHER', value: 'OTHER' },
                  ]}
                />
              </div>
              <Input label="Reason" value={incentiveDraft.reason} onChange={(e) => setIncentiveDraft((p) => ({ ...p, reason: e.target.value }))} />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCreateIncentiveOpen(false)} disabled={createIncentiveBusy}>
                  Cancel
                </Button>
                <Button onClick={onCreateIncentive} disabled={createIncentiveBusy}>
                  {createIncentiveBusy ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'RECONCILIATIONS' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-black/60">Reconcile collections to prepare net payout.</div>
            <div className="text-sm text-black/60">{reconciliationsLoading ? 'Loading…' : null}</div>
          </div>
          <Table columns={reconciliationColumns} data={reconciliationsForUi} />

          <Modal open={reconcileId != null} onClose={() => setReconcileId(null)} title="Reconcile Collection">
            <div className="space-y-3">
              <Input
                label="Expected Revenue"
                type="number"
                value={reconcileDraft.expectedRevenue}
                onChange={(e) => setReconcileDraft((p) => ({ ...p, expectedRevenue: e.target.value }))}
                placeholder="Leave empty to use backend defaults"
              />
              <Input
                label="Reconciliation Notes"
                value={reconcileDraft.notes}
                onChange={(e) => setReconcileDraft((p) => ({ ...p, notes: e.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setReconcileId(null)} disabled={reconcileBusy}>
                  Cancel
                </Button>
                <Button onClick={() => onReconcileCollection(reconcileId || '')} disabled={reconcileBusy}>
                  {reconcileBusy ? 'Reconciling…' : 'Reconcile'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'PAYOUTS' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-black/60">Process payouts for reconciled collections.</div>
            <div className="text-sm text-black/60">{payoutsLoading ? 'Loading…' : null}</div>
          </div>
          <Table columns={payoutColumns} data={payoutsForUi} />
        </div>
      ) : null}

      {tab === 'VEHICLE_QR' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-black/60">
              <QrCode size={16} /> Generate / view vehicle payment QR.
            </div>
            {fleetRequiredNotice}
          </div>

          {!fleetId ? null : vehiclesLoading ? <div className="text-sm text-black/60">Loading vehicles…</div> : null}

          <Table columns={vehicleQrColumns} data={vehicles} />

          <Modal open={qrVehicleId != null} onClose={() => setQrVehicleId(null)} title="Generate Vehicle QR">
            <div className="space-y-3">
              <div className="text-sm text-black/60">This will call `POST /payment/admin/vehicle/:id/qr`.</div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setQrVehicleId(null)} disabled={qrBusyVehicleId === qrVehicleId}>
                  Cancel
                </Button>
                <Button onClick={() => onGenerateVehicleQr(qrVehicleId || '')} disabled={qrBusyVehicleId === qrVehicleId}>
                  {qrBusyVehicleId === qrVehicleId ? 'Generating…' : 'Generate'}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal open={qrViewVehicleId != null} onClose={() => setQrViewVehicleId(null)} title="Vehicle QR">
            {qrToView ? (
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  {qrToView.qrCodeBase64 ? (
                    <img
                      src={
                        qrToView.qrCodeBase64.startsWith("data:")
                          ? qrToView.qrCodeBase64
                          : `data:image/png;base64,${qrToView.qrCodeBase64}`
                      }
                      alt="Vehicle QR"
                      className="h-40 w-40 border rounded-md"
                    />
                  ) : (
                    <div className="h-40 w-40 border rounded-md flex items-center justify-center text-sm text-black/60">No QR image</div>
                  )}
                  <div className="text-sm">
                    <div>
                      <span className="text-black/60">UPI ID:</span> <span className="font-medium">{qrToView.upiId || '—'}</span>
                    </div>
                    <div>
                      <span className="text-black/60">VA ID:</span> <span className="font-medium">{qrToView.virtualAccountId || '—'}</span>
                    </div>
                    <div>
                      <span className="text-black/60">VA Number:</span> <span className="font-medium">{qrToView.virtualAccountNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-black/60">IFSC:</span> <span className="font-medium">{qrToView.ifscCode || '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setQrViewVehicleId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-black/60">No QR found for this vehicle.</div>
            )}
          </Modal>
        </div>
      ) : null}
    </div>
  );
}