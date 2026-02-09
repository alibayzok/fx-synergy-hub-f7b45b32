-- إضافة حقول جديدة لطلبات USDT
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- تحديث الـ enum لإضافة المزيد من الخيارات إذا لزم الأمر
COMMENT ON COLUMN public.service_requests.payment_method IS 'Payment method for USDT transactions: bank_transfer, omt, whish, cash, etc.';
COMMENT ON COLUMN public.service_requests.wallet_address IS 'Wallet address for receiving USDT (for buy requests)';