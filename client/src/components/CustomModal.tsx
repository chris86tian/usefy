import React from "react";

const CustomModal = ({ isOpen, onClose, children }: CustomFixedModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="text-white border border-gray-600 rounded-lg shadow-lg w-full max-w-lg">
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          ×
        </button>
      </div>
    </div>
  );
};


export default CustomModal;