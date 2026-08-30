import React from "react";
import { X } from "lucide-react";

const Modal = ({ open, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-2xl border border-white/8 bg-surface p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-3 rounded-lg p-1 text-gray hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        {title && <h2 className="mb-4 pr-8 text-xl font-semibold text-white">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
