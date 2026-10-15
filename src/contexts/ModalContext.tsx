import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppModal } from "@/components/shared/AppModal";
export type ModalType = "success" | "error" | "warning" | "info";

export interface ModalOptions {
  type: ModalType;
  title: string;
  description?: string;
}

interface ModalContextValue {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

export const ModalContext = createContext<ModalContextValue | undefined>(
  undefined,
);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showModal = useCallback((options: ModalOptions) => {
    setModal(options);
  }, []);

  const hideModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo(
    () => ({
      showModal,
      hideModal,
    }),
    [showModal, hideModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AppModal modal={modal} onClose={hideModal} />
    </ModalContext.Provider>
  );
}