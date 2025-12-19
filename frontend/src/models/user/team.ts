export type TeamStatus = 'Active' | 'Inactive';

export type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: TeamStatus;
};

