-- Indexes for high-traffic public reads and admin reporting filters.
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at");

CREATE INDEX "announcements_is_active_created_at_idx" ON "announcements"("is_active", "created_at");
CREATE INDEX "comments_announcement_id_created_at_idx" ON "comments"("announcement_id", "created_at");

CREATE INDEX "courts_status_name_idx" ON "courts"("status", "name");
CREATE INDEX "courts_category_status_idx" ON "courts"("category", "status");

CREATE INDEX "court_availabilities_court_id_is_available_start_time_idx"
  ON "court_availabilities"("court_id", "is_available", "start_time");

CREATE INDEX "bookings_booked_at_idx" ON "bookings"("booked_at");
CREATE INDEX "bookings_status_booked_at_idx" ON "bookings"("status", "booked_at");
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

CREATE INDEX "booking_items_court_id_start_time_idx" ON "booking_items"("court_id", "start_time");

CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");
CREATE INDEX "payments_status_paid_at_idx" ON "payments"("status", "paid_at");
CREATE INDEX "payments_status_payment_provider_paid_at_idx"
  ON "payments"("status", "payment_provider", "paid_at");

CREATE INDEX "wallet_transactions_type_status_idx" ON "wallet_transactions"("type", "status");
CREATE INDEX "top_up_orders_status_paid_at_idx" ON "top_up_orders"("status", "paid_at");
