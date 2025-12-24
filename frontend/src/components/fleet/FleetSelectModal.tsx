import { useEffect, useMemo, useState } from 'react';
import Modal from '../layout/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useFleet } from '../../context/FleetContext';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelected: (fleetId: string) => void;
  title?: string;
};

export default function FleetSelectModal({ open, onClose, onSelected, title }: Props) {
  const { fleets, fleetsLoading, activeFleetId, refreshFleets } = useFleet();
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    void refreshFleets();
  }, [open, refreshFleets]);

  useEffect(() => {
    if (!open) return;
    setSelected(activeFleetId || fleets?.[0]?.id || '');
  }, [open, activeFleetId, fleets]);

  const options = useMemo(
    () => (fleets || []).map((f) => ({ label: `${f.name} (${f.city})`, value: f.id })),
    [fleets],
  );

  return (
    <Modal open={open} onClose={onClose} title={title || 'Select Fleet'}>
      <div className="space-y-4">
        <div className="text-sm text-black/60">
          Choose the fleet you want to work with.
        </div>

        <Select
          label="Fleet"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          options={options}
          disabled={fleetsLoading || options.length === 0}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selected || fleetsLoading || options.length === 0}
            onClick={() => onSelected(selected)}
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}

