import React from "react";
import { createPortal } from "react-dom";

const PDFViewerModal = ({ isOpen, onClose, children }: CustomFixedModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="text-white border border-gray-600 rounded-lg shadow-lg w-auto max-w-full">
        {children}
      </div>
    </div>,
    document.body
  );
};


export default PDFViewerModal;