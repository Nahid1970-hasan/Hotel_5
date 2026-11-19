import { Navigate, Route, Routes } from 'react-router-dom'
import { ForgotPage, LoginPage, MyBookingsPage, RegisterPage } from './hotel/Account'
import { AdminLogin, AdminShell, ProfilePage } from './hotel/admin/AdminShell'
import ArrivalsPage from './pages/FrontOffice/Arrivals'
import DashboardPage from './pages/FrontOffice/Dashboard'
import GuestsPage from './pages/FrontOffice/Guests'
import ReservationsPage from './pages/FrontOffice/Reservations'
import HousekeepingPage from './pages/Operations/Housekeeping'
import MaintenancePage from './pages/Operations/Maintenance'
import ServicesPage from './pages/Operations/Services'
import PortalApprovalPage from './pages/PublicPortal/Approval'
import PortalContactPage from './pages/PublicPortal/Contact'
import PortalDestinationPage from './pages/PublicPortal/Destination'
import PortalDiningPage from './pages/PublicPortal/Dining'
import PortalExperiencesPage from './pages/PublicPortal/Experiences'
import PortalFacilitiesPage from './pages/PublicPortal/Facilities'
import PortalGalleryPage from './pages/PublicPortal/Gallery'
import PortalOffersPage from './pages/PublicPortal/Offers'
import PortalRoomsPage from './pages/PublicPortal/Rooms&Suits'
import PaymentsPage from './pages/Revenue/Payments'
import RatePlansPage from './pages/Revenue/RatePlans'
import ReportsPage from './pages/Revenue/Reports'
import InventoryPage from './pages/Rooms/Inventory'
import PhysicalRoomsPage from './pages/Rooms/PhysicalRooms'
import RoomTypesPage from './pages/Rooms/RoomTypes'
import AuditLogsPage from './pages/System/AuditLogs'
import SettingsPage from './pages/System/Settings'
import UsersPage from './pages/System/Users'
import ContentPage from './pages/Website/Content'
import MessagesPage from './pages/Website/Messages'
import ReviewApprovalPage from './pages/Website/ReviewApproval'
import ReviewsPage from './pages/Website/Reviews'
import {
  ContactPage,
  DestinationPage,
  DiningPage,
  ExperiencesPage,
  FacilitiesPage,
  FaqPage,
  GalleryPage,
  NotFoundPage,
  OffersPage,
  PolicyPage,
  ReviewsPage as PublicReviewsPage,
} from './hotel/Discover'
import Home from './hotel/Home'
import PublicLayout from './hotel/PublicLayout'
import { AvailabilityPage, BookPage, RoomDetailPage, RoomsPage as PublicRoomsPage } from './hotel/Stay'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to="front-office/dashboard" replace />} />
        <Route path="front-office/dashboard" element={<DashboardPage />} />
        <Route path="front-office/arrivals" element={<ArrivalsPage />} />
        <Route path="front-office/reservations" element={<ReservationsPage />} />
        <Route path="front-office/guests" element={<GuestsPage />} />
        <Route path="rooms/room-types" element={<RoomTypesPage />} />
        <Route path="rooms/physical-rooms" element={<PhysicalRoomsPage />} />
        <Route path="rooms/inventory" element={<InventoryPage />} />
        <Route path="revenue/rate-plans" element={<RatePlansPage />} />
        <Route path="revenue/payments" element={<PaymentsPage />} />
        <Route path="revenue/reports" element={<ReportsPage />} />
        <Route path="operations/housekeeping" element={<HousekeepingPage />} />
        <Route path="operations/maintenance" element={<MaintenancePage />} />
        <Route path="operations/services" element={<ServicesPage />} />
        <Route path="website/content" element={<ContentPage />} />
        <Route path="website/reviews" element={<ReviewsPage />} />
        <Route path="website/review-approval" element={<ReviewApprovalPage />} />
        <Route path="website/messages" element={<MessagesPage />} />
        <Route path="public-portal/rooms-and-suites" element={<PortalRoomsPage />} />
        <Route path="public-portal/dining" element={<PortalDiningPage />} />
        <Route path="public-portal/experiences" element={<PortalExperiencesPage />} />
        <Route path="public-portal/facilities" element={<PortalFacilitiesPage />} />
        <Route path="public-portal/offers" element={<PortalOffersPage />} />
        <Route path="public-portal/gallery" element={<PortalGalleryPage />} />
        <Route path="public-portal/destination" element={<PortalDestinationPage />} />
        <Route path="public-portal/contact" element={<PortalContactPage />} />
        <Route path="public-portal/approval" element={<PortalApprovalPage />} />
        <Route path="system/users" element={<UsersPage />} />
        <Route path="system/settings" element={<SettingsPage />} />
        <Route path="system/audit-logs" element={<AuditLogsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/admin/front-office/dashboard" replace />} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<PublicRoomsPage />} />
        <Route path="/rooms/:slug" element={<RoomDetailPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/dining" element={<DiningPage />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/experiences" element={<ExperiencesPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/destination" element={<DestinationPage />} />
        <Route path="/about" element={<PolicyPage slug="about" />} />
        <Route path="/reviews" element={<PublicReviewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/booking-policy" element={<PolicyPage slug="booking-policy" />} />
        <Route path="/privacy-policy" element={<PolicyPage slug="privacy-policy" />} />
        <Route path="/terms" element={<PolicyPage slug="terms" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
