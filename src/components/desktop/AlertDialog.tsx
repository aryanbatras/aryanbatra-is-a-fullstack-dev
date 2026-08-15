import { useEffect, useRef } from "react";
import { sounds } from "@/utils/sounds";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

export interface AlertOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Renders the confirm button in system red for destructive actions. */
  destructive?: boolean;
  onConfirm: () => void;
}

interface AlertDialogProps {
  alert: AlertOptions;
  onClose: () => void;
}

/** A macOS-style glass alert: message, Cancel on the left, confirm on the right. */
export default function AlertDialog({ alert, onClose }: AlertDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    sounds.pop();
    cancelRef.current?.focus();
  }, []);

  const confirm = () => {
    onClose();
    alert.onConfirm();
  };

  return (
    <div className={styles.spotlightBackdrop} onClick={onClose}>
      <div
        className={styles.alert}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-label={alert.title}
      >
        <h3 className={styles.alertTitle}>{alert.title}</h3>
        <p className={styles.alertMessage}>{alert.message}</p>
        <div className={styles.alertActions}>
          <button
            ref={cancelRef}
            type="button"
            className={styles.alertCancel}
            onClick={onClose}
          >
            {alert.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            className={`${styles.alertConfirm} ${
              alert.destructive ? styles.alertConfirmDanger : ""
            }`}
            onClick={confirm}
          >
            {alert.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
