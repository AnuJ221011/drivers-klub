// import { X } from "lucide-react";

// type ModalProps = {
//   open: boolean;
//   onClose: () => void;
//   title?: string;
//   children: React.ReactNode;
//   size?: 'sm' | 'md' | 'lg';
// };

// export default function Modal({
//   open,
//   onClose,
//   title,
//   children,
//   size = 'lg',
// }: ModalProps) {
//   if (!open) return null;

//   const maxWidth =
//     size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : 'max-w-lg';

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Backdrop */}
//       <div
//         className="absolute inset-0 bg-black/40"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div className={`relative w-full ${maxWidth} bg-white rounded-lg shadow-lg animate-scaleIn`}>
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 py-3 border-b">
//           <h2 className="font-semibold">{title}</h2>
//           <button onClick={onClose}>
//             <X size={18} />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="p-4">{children}</div>
//       </div>
//     </div>
//   );
// }

import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'lg',
}: ModalProps) {
  if (!open) return null;

  const maxWidth =
    size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${maxWidth} max-h-[90vh] bg-white rounded-lg shadow-lg animate-scaleIn flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

