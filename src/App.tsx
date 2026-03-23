import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { CharityPortalSimple } from "./pages/CharityPortalSimple";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { PasswordChangePage } from "./pages/PasswordChangePage";
import { StaffChangePassword } from "./pages/StaffChangePassword";
import { ApplyPage } from "./pages/ApplyPage";
import { ApplyStatusPage } from "./pages/ApplyStatusPage";
import { MyProfile } from "./pages/MyProfile";
import { RequestForm } from "./pages/RequestForm";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { WeeklySchedule } from "./pages/WeeklySchedule";
import { SubmitSupportRequest } from "./pages/SubmitSupportRequest";
import { StaffSupportRequests } from "./pages/StaffSupportRequests";
import { StaffManageRequests } from "./pages/StaffManageRequests";
import { StaffInventory } from "./pages/StaffInventory";
import { SponsorSignature } from "./pages/SponsorSignature";
import { SheetsConfig } from "./pages/SheetsConfig";
import { ScheduleDelivery } from "./pages/ScheduleDelivery";
import { RequestDetail } from "./pages/RequestDetail";
import { RecurringWishLists } from "./pages/RecurringWishLists";
import { QuickActions } from "./pages/QuickActions";
import { PartnerProfile } from "./pages/PartnerProfile";
import { PartnerDeliveries } from "./pages/PartnerDeliveries";
import { PartnerAccountManagement } from "./pages/PartnerAccountManagement";
import { Partners } from "./pages/Partners";
import { PartnersPage } from "./pages/PartnersPage";
import { AvailableInventory } from "./pages/AvailableInventory";
import { ChangePassword } from "./pages/ChangePassword";
import { PartnerAccountStatus } from "./pages/PartnerAccountStatus";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { AboutPage } from "./pages/AboutPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { DonationBinPage } from "./pages/DonationBinPage";
import { DeliveryConfirmationPage } from "./pages/DeliveryConfirmationPage";

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/password-change" element={<PasswordChangePage />} />
      <Route path="/callback" element={<AuthCallbackPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/donation-bin" element={<DonationBinPage />} />
      <Route path="/delivery-confirmations" element={<DeliveryConfirmationPage />} />

      {/* Partner Portal */}
      <Route path="/portal" element={<CharityPortalSimple />} />
      <Route path="/available-inventory" element={<AvailableInventory />} />
      <Route path="/deliveries" element={<PartnerDeliveries />} />
      <Route path="/my-account" element={<PartnerAccountStatus />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/submit-support-request" element={<SubmitSupportRequest />} />
      <Route path="/my-profile" element={<MyProfile />} />
      <Route path="/my-requests" element={<MyRequestsPage />} />
      <Route path="/requests/new" element={<RequestForm />} />
      <Route path="/requests/:id/edit" element={<RequestForm />} />
      <Route path="/request/:id" element={<RequestDetail />} />
      <Route path="/support/new" element={<SubmitSupportRequest />} />
      <Route path="/support/my-requests" element={<StaffSupportRequests />} />
      <Route path="/recurring-wishlists" element={<RecurringWishLists />} />
      <Route path="/quick-actions" element={<QuickActions />} />
      <Route path="/partner-profile" element={<PartnerProfile />} />
      <Route path="/partner/profile" element={<PartnerProfile />} />
      <Route path="/partner/deliveries" element={<PartnerDeliveries />} />
      <Route path="/partner/deliveries/new" element={<ScheduleDelivery />} />
      <Route path="/partner/requests/:id/edit" element={<RequestForm />} />

      {/* Schedule */}
      <Route path="/weekly-schedule" element={<WeeklySchedule />} />
      <Route path="/schedule-delivery" element={<ScheduleDelivery />} />

      {/* Staff */}
      <Route path="/staff/login" element={<Login />} />
      <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
      <Route path="/staff/change-password" element={<StaffChangePassword />} />
      <Route path="/staff/inventory" element={<StaffInventory />} />
      <Route path="/staff/partners" element={<PartnerAccountManagement />} />
      <Route path="/staff/support-requests" element={<StaffSupportRequests />} />
      <Route path="/staff/manage-requests" element={<StaffManageRequests />} />

      {/* Admin */}
      <Route path="/admin/weekly-schedule" element={<WeeklySchedule />} />
      <Route path="/admin/deliveries" element={<PartnerDeliveries />} />
      <Route path="/admin/recurring-wishlists" element={<RecurringWishLists />} />

      {/* Signature / Sponsor */}
      <Route path="/sponsor/:deliveryId" element={<SponsorSignature />} />

      {/* Config */}
      <Route path="/sheets" element={<SheetsConfig />} />

      {/* Partners */}
      <Route path="/partners" element={<Partners />} />
      <Route path="/partners/join" element={<PartnersPage />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/apply/status" element={<ApplyStatusPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

