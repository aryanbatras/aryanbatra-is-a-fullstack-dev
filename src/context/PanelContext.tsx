import { createContext, useContext, useState, ReactNode } from "react";

interface PanelContextType {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <PanelContext.Provider value={{ visible, setVisible }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanelVisible() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error("usePanelVisible must be used within a PanelProvider");
  }
  return context;
}
