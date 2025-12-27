import Button from "../../ui/Button";

export default function FleetHeader({ fleet }: any) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold">{fleet.name}</h1>
        <p className="text-sm text-black/60">{fleet.city}</p>
      </div>

      {/* <Button variant="secondary">Edit Fleet</Button> */}
    </div>
  );
}
