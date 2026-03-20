import { XIcon } from './Icons';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg fade max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-xl">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-warm-gray hover:bg-light-gray/30"><XIcon /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
