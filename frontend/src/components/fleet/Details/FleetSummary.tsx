type Props = {
  fleet: {
    name: string;
    mobile: string;
    email?: string;
    city: string;
    fleetType: string;
    panNumber: string;
    modeId: string;
    createdAt: string;
  };
};

export default function FleetSummary({ fleet }: Props) {
  return (
    <div className="bg-white border rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div><b>Owner:</b> {fleet.name}</div>
      <div><b>Mobile:</b> {fleet.mobile}</div>
      <div><b>Email:</b> {fleet.email}</div>
      <div><b>City:</b> {fleet.city}</div>
      <div><b>Fleet Type:</b> {fleet.fleetType}</div>
      <div><b>PAN:</b> {fleet.panNumber}</div>
      <div><b>Mode ID:</b> {fleet.modeId}</div>
      <div><b>Created:</b> {fleet.createdAt}</div>
    </div>
  );
}