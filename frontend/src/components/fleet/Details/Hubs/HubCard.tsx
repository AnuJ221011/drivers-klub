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
        {hub.type === "AIRPORT" ? "Airport Hub" : "Office Hub"}
      </p>
    </div>
  );
}
