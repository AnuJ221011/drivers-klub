export type TeamStatus = 'Active' | 'Inactive';

export type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  /** Readable hub labels for table display (Operations/Managers can have multiple hubs) */
  hubLabels?: string[];
  /** Assigned hub ids (derived from hubs where hubManagerId === user.id) */
  hubIds?: string[];
  status: TeamStatus;
};