import { lazy, Suspense } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation
} from "react-router";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { LoadingState } from "../shared/ui/components";
import { Empty } from "../shared/ui/feedback";

const ProcurementList = lazy(() =>
  import("../modules/procurement/presentation/ProcurementList").then((m) => ({ default: m.ProcurementList })),
);
const ProcurementDetail = lazy(() =>
  import("../pages/procurement/ProcurementDetail").then((m) => ({ default: m.ProcurementDetail })),
);
const VendorDocuments = lazy(() =>
  import("../pages/procurement/VendorDocuments").then((m) => ({ default: m.VendorDocuments })),
);
const Review = lazy(() =>
  import("../modules/documents/presentation/Review").then((m) => ({ default: m.Review })),
);
const Bank = lazy(() => import("../modules/historical-prices/presentation/BankPage"));
const HistoryPage = lazy(() => import("../pages/history/HistoryPage"));

export function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense
      fallback={
        <div className="page">
          <LoadingState label="Menyiapkan ruang kerja" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pengadaan" element={<ProcurementList />} />
        <Route
          path="/pengadaan/:id"
          element={<ProcurementDetail key={location.pathname} />}
        />
        <Route
          path="/pengadaan/:id/vendor/:vendorId"
          element={<VendorDocuments key={location.pathname} />}
        />
        <Route
          path="/pengadaan/:id/review/:documentId"
          element={<Review key={location.pathname} />}
        />
        <Route path="/bank" element={<Bank />} />
        <Route
          path="/riwayat"
          element={<HistoryPage />}
        />
        <Route
          path="*"
          element={
            <div className="page">
              <Empty title="Halaman tidak ditemukan">
                Kembali ke <Link to="/">Dashboard</Link> untuk melanjutkan.
              </Empty>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );

}
