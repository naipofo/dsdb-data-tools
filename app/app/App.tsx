import React, { useState, useMemo, useCallback } from "react";
import { DsdbProvider } from "./contexts/DsdbContext";
import { DsdbViewer } from "./components/DsdbViewer";

const App: React.FC = () => {
  return (
    <DsdbProvider>
      <DsdbViewer />
    </DsdbProvider>
  );
};

export default App;
