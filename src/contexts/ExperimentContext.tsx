import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExperimentContextType {
  assignments: Record<string, string>;
  setAssignments: (assignments: Record<string, string>) => void;
  getVariant: (experimentName: string) => string | null;
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

export const ExperimentProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const getVariant = (experimentName: string): string | null => {
    return assignments[experimentName] || null;
  };

  return (
    <ExperimentContext.Provider value={{ assignments, setAssignments, getVariant }}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return context;
};
