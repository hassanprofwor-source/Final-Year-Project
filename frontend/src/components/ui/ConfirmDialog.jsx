import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  isDestructive = true,
}) => {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red/10">
          <AlertTriangle className="h-6 w-6 text-red" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {message && <p className="mt-2 text-sm text-gray">{message}</p>}

        <div className="mt-6 flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold text-white ${
              isDestructive ? "bg-red hover:bg-red/90" : "bg-elevated hover:bg-white/10"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
