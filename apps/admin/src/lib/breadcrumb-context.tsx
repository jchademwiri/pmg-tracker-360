'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type BreadcrumbContextType = {
  labels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  labels: {},
  setLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = (segment: string, label: string) => {
    setLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  };

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}

export function SetBreadcrumbLabel({ segment, label }: { segment: string; label: string }) {
  const { setLabel } = useBreadcrumb();

  useEffect(() => {
    if (segment && label) {
      setLabel(segment, label);
    }
  }, [segment, label, setLabel]);

  return null;
}
