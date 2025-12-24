import { useEffect, useMemo } from 'react';
import { useFleet } from '../../context/FleetContext';
import Select from '../ui/Select';

type Props = {
  label?: string;
  className?: string;
};

export default function FleetSelectBar({
  label = 'Fleet',
  className = '',
}: Props) {
  const {
    fleets,
    fleetsLoading,
    activeFleetId,
    setActiveFleetId,
    clearActiveFleetId,
    refreshFleets,
  } = useFleet();

  useEffect(() => {
    void refreshFleets();
  }, [refreshFleets]);

  const options = useMemo(() => {
    const placeholderLabel = fleetsLoading ? 'Loading fleets…' : 'Select fleet';
    return [
      { label: placeholderLabel, value: '' },
      ...(fleets || []).map((f) => ({
        label: `${f.name} (${f.city})`,
        value: f.id,
      })),
    ];
  }, [fleets, fleetsLoading]);

  return (
    <div
      className={`
        w-full
        max-w-full
        sm:max-w-xs
        md:max-w-sm
        ${className}
      `}
    >
      <Select
        label={label}
        value={activeFleetId || ''}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) clearActiveFleetId();
          else setActiveFleetId(id);
        }}
        options={options}
        disabled={fleetsLoading || (fleets || []).length === 0}
        className="w-full text-sm sm:text-base"
      />
    </div>
  );
}
