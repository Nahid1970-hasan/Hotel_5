import { Navigate, Route, Routes } from 'react-router-dom'
import { ForgotPage, LoginPage, MyBookingsPage, RegisterPage } from './hotel/Account'
import { AdminLogin, AdminShell, ProfilePage } from './hotel/admin/AdminShell'
import {
  ArrivalsPage,
  AuditPage,
  ContentPage,
  DashboardPage,
  GuestsPage,
  HousekeepingPage,
  InventoryPage,
  MaintenancePage,
  MessagesPage,
  PaymentsPage,
  RatesPage,
  ReportsPage,
  ReservationsPage,
  ReviewsPage,
  RoomTypesPage,
  RoomsPage,
  ServicesPage,
  SettingsPage,
  UsersPage,
} from './hotel/admin/screens'
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
        <Route path="rooms/physical-rooms" element={<RoomsPage />} />
        <Route path="rooms/inventory" element={<InventoryPage />} />
        <Route path="revenue/rate-plans" element={<RatesPage />} />
        <Route path="revenue/payments" element={<PaymentsPage />} />
        <Route path="revenue/reports" element={<ReportsPage />} />
        <Route path="operations/housekeeping" element={<HousekeepingPage />} />
        <Route path="operations/maintenance" element={<MaintenancePage />} />
        <Route path="operations/services" element={<ServicesPage />} />
        <Route path="website/content" element={<ContentPage />} />
        <Route path="website/reviews" element={<ReviewsPage />} />
        <Route path="website/messages" element={<MessagesPage />} />
        <Route path="system/users" element={<UsersPage />} />
        <Route path="system/settings" element={<SettingsPage />} />
        <Route path="system/audit-logs" element={<AuditPage />} />
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
