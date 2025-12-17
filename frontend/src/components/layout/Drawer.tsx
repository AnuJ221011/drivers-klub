import { X } from "lucide-react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: DrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] bg-white z-50
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <h2 className="font-semibold text-black">{title}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
