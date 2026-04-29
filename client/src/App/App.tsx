import { useState, useCallback } from "react";

import "./App.css";
import LeftPanel from "../LeftPanel/LeftPanel";
import RightPanel from "../RightPanel/RightPanel";
import AddItemDialog from "../AddItemDialog/AddItemDialog";

function App() {
  const [isRefresh, setRefreshKey] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleSelectionChange = useCallback(() => {
    setRefreshKey((prev) => !prev);
  }, []);

  return (
    <div className="app">
      <div className="header">
        <h1>Item Manager</h1>
        <button onClick={() => setShowAddDialog(true)}>Add Item</button>
      </div>
      <div className="panels">
        <LeftPanel
          isRefresh={isRefresh}
          onSelectionChange={handleSelectionChange}
        />
        <RightPanel
          isRefresh={isRefresh}
          onSelectionChange={handleSelectionChange}
        />
      </div>
      {showAddDialog && (
        <AddItemDialog onClose={() => setShowAddDialog(false)} />
      )}
    </div>
  );
}

export default App;
