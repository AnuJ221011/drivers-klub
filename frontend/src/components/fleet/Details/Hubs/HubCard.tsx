type Hub = {
  id: string;
  name: string;
  type: string;
};

type Props = {
  hub: Hub;
  onClick: () => void;
};

export default function HubCard({ hub, onClick }: Props) {
  const typeLabel =
    hub.type === "AIRPORT"
      ? "Airport Hub"
      : hub.type === "OFFICE"
        ? "Office Hub"
        : hub.type === "YARD"
          ? "Yard"
          : hub.type;

  return (
    <div
      onClick={onClick}
      className="
        cursor-pointer rounded-lg border border-black/10 bg-white
        p-4 hover:shadow-md transition
      "
    >
      <h3 className="font-semibold text-sm">{hub.name}</h3>
      <p className="text-xs text-black/60 mt-1">
        {typeLabel}
      </p>
    </div>
  );
}