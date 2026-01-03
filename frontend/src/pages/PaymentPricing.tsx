import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, QrCode } from 'lucide-react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table, { type Column } from '../components/ui/Table';
import Modal from '../components/layout/Modal';
import FleetSelectBar from '../components/fleet/FleetSelectBar';
import { useFleet } from '../context/FleetContext';

type RentalPlan = {
  id: string;
  fleetId: string;
  name: string;
  rentalAmount: number;
  depositAmount: number;
  validityDays: number;
  isActive: boolean;
};

type PenaltyType = 'MONETARY' | 'WARNING' | 'SUSPENSION' | 'BLACKLIST';
type PenaltyCategory = 'BEHAVIOR' | 'SAFETY' | 'DAMAGE' | 'OTHER';

type Penalty = {
  id: string;
  driverId: string;
  type: PenaltyType;
  amount?: number;
  reason: string;
  category: PenaltyCategory;
  isPaid: boolean;
  deductedFromDeposit: boolean;
  isWaived: boolean;
  waiverReason?: string;
  waivedAt?: string;
  suspensionStartDate?: string;
  suspensionEndDate?: string;
};

type IncentiveCategory = 'MILESTONE' | 'PERFORMANCE' | 'OTHER';

type Incentive = {
  id: string;
  driverId: string;
  amount: number;
  reason: string;
  category: IncentiveCategory;
  isPaid: boolean;
  payout?: {
    txnId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    utr?: string;
    paidAt?: string;
  };
};

type DriverLite = {
  id: string;
  firstName: string;
  lastName: string;
  bankAccountNumber: string;
};

type Collection = {
  id: string;
  driverId: string;
  date: string; // ISO
  totalCollection: number;
  isReconciled: boolean;
  expectedRevenue?: number;
  reconciliationNotes?: string;
  netPayout?: number;
  isPaid: boolean;
  payout?: { txnId: string; status: 'PENDING' | 'SUCCESS' | 'FAILED'; utr?: string; paidAt?: string };
};

type VehicleLite = {
  id: string;
  number: string;
  model?: string;
};

type VehicleQr = {
  id: string;
  vehicleId: string;
  virtualAccountId: string;
  virtualAccountNumber: string;
  ifscCode: string;
  qrCodeBase64: string;
  upiId: string;
  isActive: boolean;
};

function makeId(prefix: string) {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}_${uuid}`;
}

function makeTxnId(suffix: string) {
  return `TXN_${Math.floor(Date.now() / 1000)}_${suffix}`;
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-IN');
}

function fullName(d: DriverLite) {
  return `${d.firstName} ${d.lastName}`.trim();
}

function buildPlaceholderQrDataUri() {
  // lightweight placeholder "QR-like" SVG to keep the feature usable without a backend QR service
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <rect width="220" height="220" fill="#fff"/>
  <rect x="10" y="10" width="60" height="60" fill="#000"/>
  <rect x="20" y="20" width="40" height="40" fill="#fff"/>
  <rect x="30" y="30" width="20" height="20" fill="#000"/>
  <rect x="150" y="10" width="60" height="60" fill="#000"/>
  <rect x="160" y="20" width="40" height="40" fill="#fff"/>
  <rect x="170" y="30" width="20" height="20" fill="#000"/>
  <rect x="10" y="150" width="60" height="60" fill="#000"/>
  <rect x="20" y="160" width="40" height="40" fill="#fff"/>
  <rect x="30" y="170" width="20" height="20" fill="#000"/>
  <g fill="#000">
    <rect x="95" y="90" width="10" height="10"/>
    <rect x="110" y="90" width="10" height="10"/>
    <rect x="125" y="90" width="10" height="10"/>
    <rect x="95" y="105" width="10" height="10"/>
    <rect x="115" y="105" width="10" height="10"/>
    <rect x="135" y="105" width="10" height="10"/>
    <rect x="95" y="120" width="10" height="10"/>
    <rect x="110" y="120" width="10" height="10"/>
    <rect x="130" y="120" width="10" height="10"/>
  </g>
  <text x="110" y="212" font-size="10" text-anchor="middle" fill="#111">DUMMY QR</text>
</svg>
`.trim();

  // btoa expects latin1; SVG here is ASCII
  const encoded = typeof btoa !== 'undefined' ? btoa(svg) : '';
  return `data:image/svg+xml;base64,${encoded}`;
}

type TabKey = 'RENTAL_PLANS' | 'PENALTIES' | 'INCENTIVES' | 'RECONCILIATIONS' | 'PAYOUTS' | 'VEHICLE_QR';

const TAB_LABEL: Record<TabKey, string> = {
  RENTAL_PLANS: 'Rental Plans',
  PENALTIES: 'Penalties',
  INCENTIVES: 'Incentives',
  RECONCILIATIONS: 'Pending Reconciliations',
  PAYOUTS: 'Pending Payouts',
  VEHICLE_QR: 'Vehicle QR',
};

export default function PaymentPricing() {
  const { effectiveFleetId } = useFleet();

  const [tab, setTab] = useState<TabKey>('RENTAL_PLANS');

  // Dummy directory
  const [drivers] = useState<DriverLite[]>([
    { id: 'drv_raj', firstName: 'Raj', lastName: 'Kumar', bankAccountNumber: '1234567890' },
    { id: 'drv_neha', firstName: 'Neha', lastName: 'Sharma', bankAccountNumber: '9876543210' },
  ]);
  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  const [vehicles] = useState<VehicleLite[]>([
    { id: 'veh_001', number: 'DL01AB1234', model: 'WagonR' },
    { id: 'veh_002', number: 'DL01CD5678', model: 'Dzire' },
  ]);

  // Dummy data stores
  const [rentalPlans, setRentalPlans] = useState<RentalPlan[]>([
    {
      id: makeId('plan'),
      fleetId: 'fleet_demo',
      name: 'Weekly Plan',
      rentalAmount: 3500,
      depositAmount: 5000,
      validityDays: 7,
      isActive: true,
    },
  ]);

  const [penalties, setPenalties] = useState<Penalty[]>([
    {
      id: makeId('pen'),
      driverId: drivers[0].id,
      type: 'MONETARY',
      amount: 500,
      reason: 'Customer complaint',
      category: 'BEHAVIOR',
      isPaid: true,
      deductedFromDeposit: true,
      isWaived: false,
    },
  ]);

  const [incentives, setIncentives] = useState<Incentive[]>([
    {
      id: makeId('inc'),
      driverId: drivers[0].id,
      amount: 500,
      reason: 'Completed 50 trips this month',
      category: 'MILESTONE',
      isPaid: false,
    },
  ]);

  const [collections, setCollections] = useState<Collection[]>([
    {
      id: makeId('col'),
      driverId: drivers[0].id,
      date: new Date('2025-12-29T00:00:00.000Z').toISOString(),
      totalCollection: 5000,
      isReconciled: false,
      isPaid: false,
    },
  ]);

  const [vehicleQrs, setVehicleQrs] = useState<VehicleQr[]>([]);

  // ===== Rental plans =====
  const [activeOnly, setActiveOnly] = useState(true);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [planDraft, setPlanDraft] = useState({
    name: 'Weekly Plan',
    rentalAmount: '3500',
    depositAmount: '5000',
    validityDays: '7',
  });

  const plansForFleet = useMemo(() => {
    const fleetId = effectiveFleetId || 'fleet_demo';
    return rentalPlans.filter((p) => p.fleetId === fleetId && (!activeOnly || p.isActive));
  }, [activeOnly, effectiveFleetId, rentalPlans]);

  // ===== Penalties =====
  const [createPenaltyOpen, setCreatePenaltyOpen] = useState(false);
  const [waivePenaltyId, setWaivePenaltyId] = useState<string | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [penaltyDraft, setPenaltyDraft] = useState({
    driverId: drivers[0]?.id || '',
    type: 'MONETARY' as PenaltyType,
    amount: '500',
    reason: 'Customer complaint',
    category: 'BEHAVIOR' as PenaltyCategory,
    suspensionStartDate: '',
    suspensionEndDate: '',
  });

  // ===== Incentives =====
  const [createIncentiveOpen, setCreateIncentiveOpen] = useState(false);
  const [incentiveDraft, setIncentiveDraft] = useState({
    driverId: drivers[0]?.id || '',
    amount: '500',
    reason: 'Completed 50 trips this month',
    category: 'MILESTONE' as IncentiveCategory,
  });

  // ===== Reconciliations / payouts =====
  const pendingReconciliations = useMemo(() => collections.filter((c) => !c.isReconciled), [collections]);
  const pendingPayouts = useMemo(() => collections.filter((c) => c.isReconciled && !c.isPaid), [collections]);

  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const [reconcileDraft, setReconcileDraft] = useState({ expectedRevenue: '5000', notes: 'All collections verified' });

  // ===== Vehicle QR =====
  const [qrVehicleId, setQrVehicleId] = useState<string | null>(null);
  const [qrViewVehicleId, setQrViewVehicleId] = useState<string | null>(null);

  const qrByVehicleId = useMemo(() => {
    const map = new Map<string, VehicleQr>();
    for (const q of vehicleQrs) map.set(q.vehicleId, q);
    return map;
  }, [vehicleQrs]);

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
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <Button
          variant="secondary"
          className="px-3 py-1"
          onClick={() => {
            setRentalPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
            toast.success(`Plan ${p.isActive ? 'deactivated' : 'activated'}`);
          }}
        >
          {p.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  const penaltyColumns: Column<Penalty>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    {
      key: 'driver',
      label: 'Driver',
      render: (p) => {
        const d = driverById.get(p.driverId);
        return d ? fullName(d) : p.driverId;
      },
    },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', render: (p) => (p.amount != null ? fmtMoney(p.amount) : '—') },
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
        <div className="flex items-center gap-2">
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
        </div>
      ),
    },
  ];

  const incentiveColumns: Column<Incentive>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    {
      key: 'driver',
      label: 'Driver',
      render: (x) => {
        const d = driverById.get(x.driverId);
        return d ? fullName(d) : x.driverId;
      },
    },
    { key: 'category', label: 'Category' },
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
          onClick={() => {
            const txnId = makeTxnId('PAY123');
            setIncentives((prev) =>
              prev.map((i) =>
                i.id === x.id
                  ? {
                      ...i,
                      isPaid: true,
                      payout: {
                        txnId,
                        status: 'PENDING',
                        utr: 'UTR123456789',
                        paidAt: new Date().toISOString(),
                      },
                    }
                  : i
              )
            );
            toast.success(`Incentive payout initiated (${txnId})`);
          }}
        >
          Payout
        </Button>
      ),
    },
  ];

  const reconciliationColumns: Column<Collection>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    {
      key: 'driver',
      label: 'Driver',
      render: (c) => {
        const d = driverById.get(c.driverId);
        return d ? fullName(d) : c.driverId;
      },
    },
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
            setReconcileDraft({ expectedRevenue: String(c.totalCollection), notes: 'All collections verified' });
          }}
        >
          Reconcile
        </Button>
      ),
    },
  ];

  const payoutColumns: Column<Collection>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    {
      key: 'driver',
      label: 'Driver',
      render: (c) => {
        const d = driverById.get(c.driverId);
        return d ? fullName(d) : c.driverId;
      },
    },
    {
      key: 'bank',
      label: 'Bank Account',
      render: (c) => {
        const d = driverById.get(c.driverId);
        return d?.bankAccountNumber || '—';
      },
    },
    { key: 'date', label: 'Date', render: (c) => new Date(c.date).toLocaleDateString() },
    { key: 'netPayout', label: 'Net Payout', render: (c) => (typeof c.netPayout === 'number' ? fmtMoney(c.netPayout) : '—') },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <Button
          className="px-3 py-1"
          onClick={() => {
            const txnId = makeTxnId('PAY456');
            const utr = 'UTR987654321';
            setCollections((prev) =>
              prev.map((x) =>
                x.id === c.id
                  ? {
                      ...x,
                      isPaid: true,
                      payout: { txnId, status: 'SUCCESS', utr, paidAt: new Date().toISOString() },
                    }
                  : x
              )
            );
            toast.success(`Payout processed (${txnId})`);
          }}
        >
          Payout
        </Button>
      ),
    },
  ];

  const vehicleQrColumns: Column<VehicleLite>[] = [
    { key: 'index', label: 'S.No', render: (_, i) => i + 1 },
    { key: 'number', label: 'Vehicle', render: (v) => (v.model ? `${v.number} (${v.model})` : v.number) },
    {
      key: 'status',
      label: 'QR Status',
      render: (v) => {
        const qr = qrByVehicleId.get(v.id);
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
            onClick={() => {
              setQrVehicleId(v.id);
              const existing = qrByVehicleId.get(v.id);
              if (existing) setQrViewVehicleId(v.id);
            }}
          >
            {qrByVehicleId.has(v.id) ? 'Regenerate' : 'Generate'}
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1"
            disabled={!qrByVehicleId.has(v.id)}
            onClick={() => setQrViewVehicleId(v.id)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  // ===== Actions =====
  function createRentalPlan() {
    const fleetId = effectiveFleetId || 'fleet_demo';
    const rentalAmount = Number(planDraft.rentalAmount);
    const depositAmount = Number(planDraft.depositAmount);
    const validityDays = Number(planDraft.validityDays);
    if (!planDraft.name.trim()) return toast.error('Plan name is required');
    if (!Number.isFinite(rentalAmount) || rentalAmount <= 0) return toast.error('Rental amount must be > 0');
    if (!Number.isFinite(depositAmount) || depositAmount < 0) return toast.error('Deposit amount must be >= 0');
    if (!Number.isFinite(validityDays) || validityDays <= 0) return toast.error('Validity days must be > 0');

    const created: RentalPlan = {
      id: makeId('plan'),
      fleetId,
      name: planDraft.name.trim(),
      rentalAmount,
      depositAmount,
      validityDays,
      isActive: true,
    };
    setRentalPlans((prev) => [created, ...prev]);
    setCreatePlanOpen(false);
    toast.success('Rental plan created (dummy)');
  }

  function createPenalty() {
    if (!penaltyDraft.driverId) return toast.error('Driver is required');
    if (!penaltyDraft.reason.trim()) return toast.error('Reason is required');

    const nowIso = new Date().toISOString();
    const type = penaltyDraft.type;

    const base: Penalty = {
      id: makeId('pen'),
      driverId: penaltyDraft.driverId,
      type,
      reason: penaltyDraft.reason.trim(),
      category: penaltyDraft.category,
      isPaid: false,
      deductedFromDeposit: false,
      isWaived: false,
    };

    let created: Penalty = base;
    if (type === 'MONETARY') {
      const amount = Number(penaltyDraft.amount);
      if (!Number.isFinite(amount) || amount <= 0) return toast.error('Amount must be > 0 for monetary penalties');
      // dummy side effect: auto-deduct from deposit
      created = { ...base, amount, isPaid: true, deductedFromDeposit: true };
    } else if (type === 'SUSPENSION') {
      if (!penaltyDraft.suspensionStartDate || !penaltyDraft.suspensionEndDate) {
        return toast.error('Suspension start/end dates are required');
      }
      created = {
        ...base,
        suspensionStartDate: new Date(penaltyDraft.suspensionStartDate).toISOString(),
        suspensionEndDate: new Date(penaltyDraft.suspensionEndDate).toISOString(),
      };
    } else if (type === 'BLACKLIST') {
      // no extra fields
      created = base;
    } else if (type === 'WARNING') {
      created = base;
    }

    setPenalties((prev) => [{ ...created, waivedAt: undefined }, ...prev]);
    setCreatePenaltyOpen(false);
    toast.success(`Penalty created (dummy) at ${new Date(nowIso).toLocaleTimeString()}`);
  }

  function waivePenalty(id: string) {
    if (!waiverReason.trim()) return toast.error('Waiver reason is required');
    setPenalties((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isWaived: true,
              waiverReason: waiverReason.trim(),
              waivedAt: new Date().toISOString(),
              // dummy side effect: reverse deposit deduction (if any)
              isPaid: false,
              deductedFromDeposit: false,
            }
          : p
      )
    );
    setWaivePenaltyId(null);
    toast.success('Penalty waived successfully (dummy)');
  }

  function createIncentive() {
    if (!incentiveDraft.driverId) return toast.error('Driver is required');
    const amount = Number(incentiveDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error('Amount must be > 0');
    if (!incentiveDraft.reason.trim()) return toast.error('Reason is required');

    const created: Incentive = {
      id: makeId('inc'),
      driverId: incentiveDraft.driverId,
      amount,
      reason: incentiveDraft.reason.trim(),
      category: incentiveDraft.category,
      isPaid: false,
    };
    setIncentives((prev) => [created, ...prev]);
    setCreateIncentiveOpen(false);
    toast.success('Incentive created (dummy)');
  }

  function reconcileCollection(id: string) {
    const expectedRevenue = Number(reconcileDraft.expectedRevenue);
    if (!Number.isFinite(expectedRevenue) || expectedRevenue < 0) return toast.error('Expected revenue must be >= 0');
    if (!reconcileDraft.notes.trim()) return toast.error('Reconciliation notes are required');

    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const driverPenaltyTotal = penalties
          .filter((p) => p.driverId === c.driverId && p.type === 'MONETARY' && !p.isWaived)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const driverIncentiveTotal = incentives
          .filter((i) => i.driverId === c.driverId)
          .reduce((sum, i) => sum + i.amount, 0);
        const netPayout = Math.max(0, expectedRevenue - driverPenaltyTotal + driverIncentiveTotal);

        return {
          ...c,
          expectedRevenue,
          reconciliationNotes: reconcileDraft.notes.trim(),
          isReconciled: true,
          netPayout,
        };
      })
    );

    setReconcileId(null);
    toast.success('Collection reconciled successfully (dummy)');
  }

  const qrToView = useMemo(() => (qrViewVehicleId ? qrByVehicleId.get(qrViewVehicleId) : undefined), [qrByVehicleId, qrViewVehicleId]);

  function generateVehicleQr(vehicleId: string) {
    const virtualAccountId = `VA${String(Math.floor(100000 + Math.random() * 900000))}`;
    const virtualAccountNumber = `${Math.floor(10 ** 15 + Math.random() * 9 * 10 ** 15)}`;
    const ifscCode = 'HDFC0000001';
    const qrCodeBase64 = buildPlaceholderQrDataUri();
    const upiId = `driversklub.${virtualAccountId.toLowerCase()}@easebuzz`;

    const created: VehicleQr = {
      id: makeId('vqr'),
      vehicleId,
      virtualAccountId,
      virtualAccountNumber,
      ifscCode,
      qrCodeBase64,
      upiId,
      isActive: true,
    };

    setVehicleQrs((prev) => {
      const without = prev.filter((q) => q.vehicleId !== vehicleId);
      return [created, ...without];
    });

    toast.success('Vehicle QR generated (dummy)');
    setQrVehicleId(null);
    setQrViewVehicleId(vehicleId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <CreditCard size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Payment & Pricing</h1>
            <div className="text-sm text-black/60">Admin tools (dummy data mode)</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FleetSelectBar className="w-72" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              tab === k ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-white border-black/10 text-black hover:bg-yellow-50'
            }`}
          >
            {TAB_LABEL[k]}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'RENTAL_PLANS' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreatePlanOpen(true)}>
                + Create Rental Plan
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveOnly((v) => !v)}
                className="px-3 py-2"
                title="Toggle activeOnly"
              >
                Active only: {activeOnly ? 'ON' : 'OFF'}
              </Button>
            </div>
            {!effectiveFleetId ? <div className="text-sm text-black/60">No fleet selected — using Demo Fleet for dummy data.</div> : null}
          </div>

          <Table columns={rentalPlanColumns} data={plansForFleet} />

          <Modal open={createPlanOpen} onClose={() => setCreatePlanOpen(false)} title="Create Rental Plan (dummy)">
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
                <Button variant="secondary" onClick={() => setCreatePlanOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createRentalPlan}>Create</Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'PENALTIES' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button onClick={() => setCreatePenaltyOpen(true)}>+ Create Penalty</Button>
            <div className="text-sm text-black/60">Dummy side effects: monetary penalties auto-deduct from deposit.</div>
          </div>
          <Table columns={penaltyColumns} data={penalties} />

          <Modal open={createPenaltyOpen} onClose={() => setCreatePenaltyOpen(false)} title="Create Penalty (dummy)">
            <div className="space-y-3">
              <Select
                label="Driver"
                value={penaltyDraft.driverId}
                onChange={(e) => setPenaltyDraft((p) => ({ ...p, driverId: e.target.value }))}
                options={drivers.map((d) => ({ label: `${fullName(d)} (${d.bankAccountNumber})`, value: d.id }))}
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

              <Input
                label="Reason"
                value={penaltyDraft.reason}
                onChange={(e) => setPenaltyDraft((p) => ({ ...p, reason: e.target.value }))}
              />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCreatePenaltyOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPenalty}>Create</Button>
              </div>
            </div>
          </Modal>

          <Modal open={waivePenaltyId != null} onClose={() => setWaivePenaltyId(null)} title="Waive Penalty (dummy)">
            <div className="space-y-3">
              <Input
                label="Waiver Reason"
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                placeholder="First-time offense, driver apologized"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setWaivePenaltyId(null)}>
                  Cancel
                </Button>
                <Button onClick={() => waivePenalty(waivePenaltyId || '')}>Waive</Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'INCENTIVES' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button onClick={() => setCreateIncentiveOpen(true)}>+ Create Incentive</Button>
            <div className="text-sm text-black/60">Dummy payouts mark incentives as paid with PENDING status.</div>
          </div>
          <Table columns={incentiveColumns} data={incentives} />

          <Modal open={createIncentiveOpen} onClose={() => setCreateIncentiveOpen(false)} title="Create Incentive (dummy)">
            <div className="space-y-3">
              <Select
                label="Driver"
                value={incentiveDraft.driverId}
                onChange={(e) => setIncentiveDraft((p) => ({ ...p, driverId: e.target.value }))}
                options={drivers.map((d) => ({ label: `${fullName(d)} (${d.bankAccountNumber})`, value: d.id }))}
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
                <Button variant="secondary" onClick={() => setCreateIncentiveOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createIncentive}>Create</Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'RECONCILIATIONS' ? (
        <div className="space-y-4">
          <div className="text-sm text-black/60">
            Reconcile collections to compute net payout (dummy: \(net = expectedRevenue - monetaryPenalties + incentives\)).
          </div>
          <Table columns={reconciliationColumns} data={pendingReconciliations} />

          <Modal open={reconcileId != null} onClose={() => setReconcileId(null)} title="Reconcile Collection (dummy)">
            <div className="space-y-3">
              <Input
                label="Expected Revenue"
                type="number"
                value={reconcileDraft.expectedRevenue}
                onChange={(e) => setReconcileDraft((p) => ({ ...p, expectedRevenue: e.target.value }))}
              />
              <Input
                label="Reconciliation Notes"
                value={reconcileDraft.notes}
                onChange={(e) => setReconcileDraft((p) => ({ ...p, notes: e.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setReconcileId(null)}>
                  Cancel
                </Button>
                <Button onClick={() => reconcileCollection(reconcileId || '')}>Reconcile</Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : null}

      {tab === 'PAYOUTS' ? (
        <div className="space-y-4">
          <div className="text-sm text-black/60">Process payouts for reconciled collections (dummy). </div>
          <Table columns={payoutColumns} data={pendingPayouts} />
        </div>
      ) : null}

      {tab === 'VEHICLE_QR' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-black/60">
              <QrCode size={16} /> Generate / view vehicle payment QR (dummy).
            </div>
          </div>

          <Table columns={vehicleQrColumns} data={vehicles} />

          <Modal open={qrVehicleId != null} onClose={() => setQrVehicleId(null)} title="Generate Vehicle QR (dummy)">
            <div className="space-y-3">
              <div className="text-sm text-black/60">
                This simulates `POST /payment/admin/vehicle/:id/qr` and returns a placeholder QR + dummy virtual account.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setQrVehicleId(null)}>
                  Cancel
                </Button>
                <Button onClick={() => generateVehicleQr(qrVehicleId || '')}>Generate</Button>
              </div>
            </div>
          </Modal>

          <Modal open={qrViewVehicleId != null} onClose={() => setQrViewVehicleId(null)} title="Vehicle QR (dummy)">
            {qrToView ? (
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <img src={qrToView.qrCodeBase64} alt="Vehicle QR" className="h-40 w-40 border rounded-md" />
                  <div className="text-sm">
                    <div>
                      <span className="text-black/60">UPI ID:</span> <span className="font-medium">{qrToView.upiId}</span>
                    </div>
                    <div>
                      <span className="text-black/60">VA ID:</span> <span className="font-medium">{qrToView.virtualAccountId}</span>
                    </div>
                    <div>
                      <span className="text-black/60">VA Number:</span> <span className="font-medium">{qrToView.virtualAccountNumber}</span>
                    </div>
                    <div>
                      <span className="text-black/60">IFSC:</span> <span className="font-medium">{qrToView.ifscCode}</span>
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

