import api from './axios';

export type RentalPlan = {
  id: string;
  fleetId: string;
  name: string;
  rentalAmount: number;
  depositAmount: number;
  validityDays: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PenaltyType = 'MONETARY' | 'WARNING' | 'SUSPENSION' | 'BLACKLIST';
export type PenaltyCategory = 'BEHAVIOR' | 'SAFETY' | 'DAMAGE' | 'OTHER';

export type Penalty = {
  id: string;
  driverId: string;
  type: PenaltyType;
  amount: number;
  reason: string;
  category?: string | null;
  isPaid: boolean;
  deductedFromDeposit: boolean;
  isWaived: boolean;
  waiverReason?: string | null;
  waivedAt?: string | null;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type IncentiveCategory = 'MILESTONE' | 'PERFORMANCE' | 'OTHER';

export type Incentive = {
  id: string;
  driverId: string;
  amount: number;
  reason: string;
  category?: string | null;
  isPaid: boolean;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PayoutResult = {
  success?: boolean;
  txnId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  utr?: string;
  amount?: number;
};

export type PendingReconciliation = {
  id: string;
  driverId: string;
  vehicleId: string;
  date: string;
  totalCollection: number;
  isReconciled: boolean;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile?: string;
  };
  vehicle?: {
    vehicleNumber: string;
  };
};

export type PendingPayout = {
  id: string;
  driverId: string;
  date: string;
  netPayout: number | null;
  isPaid: boolean;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    bankAccountName?: string | null;
  };
};

export type VehicleQr = {
  id: string;
  vehicleId: string;
  virtualAccountId?: string | null;
  virtualAccountNumber?: string | null;
  ifscCode?: string | null;
  qrCodeUrl?: string | null;
  qrCodeBase64?: string | null;
  upiId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function createRentalPlan(payload: {
  fleetId: string;
  name: string;
  rentalAmount: number;
  depositAmount: number;
  validityDays: number;
}): Promise<RentalPlan> {
  const res = await api.post<RentalPlan>('/payment/admin/rental-plans', payload);
  return res.data;
}

export async function getRentalPlans(fleetId: string, params?: { activeOnly?: boolean }): Promise<RentalPlan[]> {
  const res = await api.get<RentalPlan[]>(`/payment/admin/rental-plans/${fleetId}`, {
    params: {
      activeOnly: params?.activeOnly ?? true,
    },
  });
  return res.data;
}

export async function createPenalty(payload: {
  driverId: string;
  type: PenaltyType;
  amount?: number;
  reason: string;
  category?: PenaltyCategory;
  suspensionStartDate?: string;
  suspensionEndDate?: string;
}): Promise<Penalty> {
  const res = await api.post<Penalty>('/payment/admin/penalty', payload);
  return res.data;
}

export async function waivePenalty(penaltyId: string, payload: { waiverReason: string }): Promise<Penalty> {
  const res = await api.post<Penalty>(`/payment/admin/penalty/${penaltyId}/waive`, payload);
  return res.data;
}

export async function createIncentive(payload: {
  driverId: string;
  amount: number;
  reason: string;
  category?: IncentiveCategory;
}): Promise<Incentive> {
  const res = await api.post<Incentive>('/payment/admin/incentive', payload);
  return res.data;
}

export async function payoutIncentive(incentiveId: string): Promise<PayoutResult> {
  const res = await api.post<PayoutResult>(`/payment/admin/incentive/${incentiveId}/payout`);
  return res.data;
}

export async function getPendingReconciliations(): Promise<PendingReconciliation[]> {
  const res = await api.get<PendingReconciliation[]>('/payment/admin/reconciliations/pending');
  return res.data;
}

export async function reconcileCollection(collectionId: string, payload: { expectedRevenue?: number; reconciliationNotes: string }) {
  const res = await api.post(`/payment/admin/collection/${collectionId}/reconcile`, payload);
  return res.data;
}

export async function getPendingPayouts(): Promise<PendingPayout[]> {
  const res = await api.get<PendingPayout[]>('/payment/admin/payouts/pending');
  return res.data;
}

export async function processCollectionPayout(collectionId: string): Promise<PayoutResult> {
  const res = await api.post<PayoutResult>(`/payment/admin/collection/${collectionId}/payout`);
  return res.data;
}

export async function generateVehicleQr(vehicleId: string): Promise<VehicleQr> {
  const res = await api.post<VehicleQr>(`/payment/admin/vehicle/${vehicleId}/qr`);
  return res.data;
}

export async function getVehicleQr(vehicleId: string): Promise<VehicleQr> {
  const res = await api.get<VehicleQr>(`/payment/admin/vehicle/${vehicleId}/qr`);
  return res.data;
}
