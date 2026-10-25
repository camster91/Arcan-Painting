-- Preserve the legacy preferred_contact value while recording an exact
-- requested response method for SMS/text callback preferences.
-- Nullable keeps existing enquiries valid and makes this additive-only.
ALTER TABLE enquiries ADD COLUMN response_method TEXT CHECK (response_method IN ('email', 'phone', 'sms'));
