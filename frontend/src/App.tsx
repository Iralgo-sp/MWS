import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VehicleForm from "./pages/VehicleForm";
import VehicleDetail from "./pages/VehicleDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles/new" element={<VehicleForm mode="create" />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/vehicles/:id/edit" element={<VehicleForm mode="edit" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
