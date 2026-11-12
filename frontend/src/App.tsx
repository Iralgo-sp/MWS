import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfirmProvider } from "./components/ConfirmDialog";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VehicleForm from "./pages/VehicleForm";
import VehicleDetail from "./pages/VehicleDetail";
import VehicleExport from "./pages/VehicleExport";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles/new" element={<VehicleForm mode="create" />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/vehicles/:id/export" element={<VehicleExport />} />
            <Route path="/vehicles/:id/edit" element={<VehicleForm mode="edit" />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
