#!/bin/bash
# =============================================================
# سكريبت نشر شامل لجميع Edge Functions + إعداد الأسرار
# الاستخدام: bash scripts/deploy-all.sh
# =============================================================

set -euo pipefail

# ─── ألوان ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SUCCESS=0
FAIL=0
FAILED_FUNCS=()

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚀  نشر جميع Edge Functions + الأسرار     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. التحقق من Supabase CLI ───
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}✗ Supabase CLI غير مثبت!${NC}"
  echo -e "  قم بتثبيته أولاً: ${YELLOW}npm install -g supabase${NC}"
  echo -e "  أو: ${YELLOW}brew install supabase/tap/supabase${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Supabase CLI موجود${NC}"
echo ""

# ─── 2. إعداد الأسرار ───
echo -e "${BLUE}━━━ إعداد الأسرار (Secrets) ━━━${NC}"
echo -e "${YELLOW}اترك الحقل فارغاً لتخطي أي سر لا تحتاجه${NC}"
echo ""

SECRETS_CMD=""

declare -a SECRET_NAMES=(
  "GOOGLE_AI_API_KEY"
  "FINNHUB_API_KEY"
  "FCM_SERVER_KEY"
  "TELEGRAM_BOT_TOKEN"
  "TELEGRAM_WEBHOOK_SECRET"
  "MARQETA_APP_TOKEN"
  "MARQETA_ADMIN_ACCESS_TOKEN"
  "MARQETA_BASE_URL"
)

declare -a SECRET_DESCS=(
  "Google AI (Gemini) API Key"
  "Finnhub API Key (بيانات السوق)"
  "Firebase Cloud Messaging Server Key"
  "Telegram Bot Token"
  "Telegram Webhook Secret"
  "Marqeta App Token"
  "Marqeta Admin Access Token"
  "Marqeta Base URL"
)

SECRETS_TO_SET=""
SECRETS_COUNT=0

for i in "${!SECRET_NAMES[@]}"; do
  read -rp "  ${SECRET_DESCS[$i]} (${SECRET_NAMES[$i]}): " value
  if [ -n "$value" ]; then
    SECRETS_TO_SET="${SECRETS_TO_SET} ${SECRET_NAMES[$i]}=${value}"
    ((SECRETS_COUNT++))
  fi
done

echo ""

if [ "$SECRETS_COUNT" -gt 0 ]; then
  echo -e "${BLUE}⏳ جاري إعداد ${SECRETS_COUNT} سر...${NC}"
  if eval supabase secrets set $SECRETS_TO_SET; then
    echo -e "${GREEN}✓ تم إعداد الأسرار بنجاح${NC}"
  else
    echo -e "${RED}✗ فشل إعداد الأسرار${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭  لم يتم إدخال أي أسرار، تم التخطي${NC}"
fi

echo ""

# ─── 3. نشر الوظائف ───
echo -e "${BLUE}━━━ نشر Edge Functions ━━━${NC}"
echo ""

FUNCTIONS=(
  "chat"
  "market-data"
  "moderate-image"
  "send-push-notification"
  "fetch-news"
  "fetch-article"
  "fetch-calendar"
  "check-sla"
  "marqeta-cards"
  "telegram-webhook"
  "setup-telegram-webhook"
)

TOTAL=${#FUNCTIONS[@]}

for i in "${!FUNCTIONS[@]}"; do
  func="${FUNCTIONS[$i]}"
  num=$((i + 1))
  echo -ne "  [${num}/${TOTAL}] ${func} ... "

  if supabase functions deploy "$func" --no-verify-jwt 2>/dev/null; then
    echo -e "${GREEN}✓ نجح${NC}"
    ((SUCCESS++))
  else
    echo -e "${RED}✗ فشل${NC}"
    ((FAIL++))
    FAILED_FUNCS+=("$func")
  fi
done

echo ""

# ─── 4. التقرير النهائي ───
echo -e "${CYAN}━━━ التقرير النهائي ━━━${NC}"
echo -e "  ${GREEN}✓ نجح: ${SUCCESS}/${TOTAL}${NC}"

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}✗ فشل: ${FAIL}/${TOTAL}${NC}"
  echo -e "  ${RED}  الوظائف الفاشلة: ${FAILED_FUNCS[*]}${NC}"
  echo ""
  echo -e "${YELLOW}💡 تلميح: تأكد من أنك مربوط بمشروع Supabase عبر: supabase link${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}🎉 تم نشر جميع الوظائف بنجاح!${NC}"
fi
