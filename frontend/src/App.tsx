import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import VehicleList from "./pages/VehicleList";
import VehicleForm from "./pages/VehicleForm";
import VehicleDetail from "./pages/VehicleDetail";
import InsurancePage from "./pages/InsurancePage";
import MaintenanceRecordPage from "./pages/MaintenanceRecordPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<VehicleList />} />
          <Route path="/vehicles/new" element={<VehicleForm mode="create" />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/vehicles/:id/edit" element={<VehicleForm mode="edit" />} />
          <Route path="/vehicles/:id/insurance" element={<InsurancePage />} />
          <Route path="/vehicles/:id/maintenance/:recordId" element={<MaintenanceRecordPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
