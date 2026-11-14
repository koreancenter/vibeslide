import React, { createContext, useContext, useState, useCallback } from "react";

export type ModalType =
  | "drive"
  | "presentation"
  | "batchTranslate"
  | "history"
  | "shortcuts"
  | "pdfExport"
  | "aiImport"
  | "themeRecommender"
  | "aiPromptBar"
  | "aiSettings"
  | "ragDiffReview"
  | "constitution"
  | "collab"
  | "webPublish"
  | "timelineAnimation"
  | "iconStudio";


interface ModalContextType {
  openModal: (modal: ModalType) => void;
  closeModal: (modal: ModalType) => void;
  toggleModal: (modal: ModalType) => void;
  isModalOpen: (modal: ModalType) => boolean;
  activeModals: Set<ModalType>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModals, setActiveModals] = useState<Set<ModalType>>(new Set());

  const openModal = useCallback((modal: ModalType) => {
    setActiveModals((prev) => new Set(prev).add(modal));
  }, []);

  const closeModal = useCallback((modal: ModalType) => {
    setActiveModals((prev) => {
      const next = new Set(prev);
      next.delete(modal);
      return next;
    });
  }, []);

  const toggleModal = useCallback((modal: ModalType) => {
    setActiveModals((prev) => {
      const next = new Set(prev);
      if (next.has(modal)) {
        next.delete(modal);
      } else {
        next.add(modal);
      }
      return next;
    });
  }, []);

  const isModalOpen = useCallback((modal: ModalType) => activeModals.has(modal), [activeModals]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, toggleModal, isModalOpen, activeModals }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
};
