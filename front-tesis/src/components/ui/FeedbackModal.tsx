import { useEffect } from "react";

type FeedbackModalProps = {
  feedback: {
    type: "success" | "error";
    message: string;
  } | null;
  onClose: () => void;
};

const FeedbackModal = ({ feedback, onClose }: FeedbackModalProps) => {
  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [feedback, onClose]);

  if (!feedback) {
    return null;
  }

  const isError = feedback.type === "error";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isError ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.message}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Cerrar
          </button>
          {isError ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
            >
              Continuar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
