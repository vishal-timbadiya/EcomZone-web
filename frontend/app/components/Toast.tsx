"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  show,
  onClose,
}: {
  message: string;
  show: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-black text-white px-6 py-3 rounded-full shadow-lg text-sm">
        {message}
      </div>
    </div>
  );
}