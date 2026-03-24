#!/bin/bash
# ============================================================
# سكريبت تحضير الإنتاج - ASSASSIN FX
# ============================================================
# يقوم بتنظيف اعتمادات Lovable وتجهيز الكود للنشر المستقل
#
# الاستخدام:
#   bash scripts/prepare-production.sh
#
# ⚠️ شغّل هذا السكريبت مرة واحدة فقط بعد git clone
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}   🔧 ASSASSIN FX — تحضير الكود للإنتاج المستقل${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

ERRORS=0

# ────────────────────────────────────────────────────────────
# 1. إزالة lovable-tagger من vite.config.ts
# ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5]${NC} إزالة lovable-tagger من vite.config.ts..."

if [ -f "vite.config.ts" ]; then
  # Remove the import line
  sed -i.bak '/import.*lovable-tagger/d' vite.config.ts
  # Remove the componentTagger() line
  sed -i.bak '/componentTagger/d' vite.config.ts
  rm -f vite.config.ts.bak
  echo -e "  ${GREEN}✓${NC} تم إزالة lovable-tagger"
else
  echo -e "  ${RED}✗${NC} ملف vite.config.ts غير موجود!"
  ERRORS=$((ERRORS + 1))
fi

# ────────────────────────────────────────────────────────────
# 2. حذف مجلد integrations/lovable
# ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/5]${NC} حذف src/integrations/lovable/..."

if [ -d "src/integrations/lovable" ]; then
  rm -rf src/integrations/lovable
  echo -e "  ${GREEN}✓${NC} تم حذف مجلد lovable"
else
  echo -e "  ${GREEN}✓${NC} مجلد lovable غير موجود (محذوف مسبقاً)"
fi

# ────────────────────────────────────────────────────────────
# 3. تعيين USE_LOVABLE_AUTH = false
# ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/5]${NC} تعطيل Lovable Auth في auth-helpers.ts..."

AUTH_FILE="src/lib/auth-helpers.ts"
if [ -f "$AUTH_FILE" ]; then
  sed -i.bak 's/const USE_LOVABLE_AUTH = true/const USE_LOVABLE_AUTH = false/' "$AUTH_FILE"
  # Remove the lovable import since the directory is deleted
  sed -i.bak "/import.*lovable.*index/d" "$AUTH_FILE"
  rm -f "$AUTH_FILE.bak"
  echo -e "  ${GREEN}✓${NC} تم تعطيل USE_LOVABLE_AUTH"
else
  echo -e "  ${RED}✗${NC} ملف auth-helpers.ts غير موجود!"
  ERRORS=$((ERRORS + 1))
fi

# ────────────────────────────────────────────────────────────
# 4. حذف قسم server من capacitor.config.ts
# ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/5]${NC} حذف قسم server من capacitor.config.ts..."

CAP_FILE="capacitor.config.ts"
if [ -f "$CAP_FILE" ]; then
  # Use perl for multi-line replacement (more portable than sed for multi-line)
  perl -i -0pe 's/\n\s*\/\/.*إعدادات الخادم.*\n\s*\/\/.*احذف.*\n\s*\/\/.*\n\s*server:\s*\{[^}]*\}//s' "$CAP_FILE"
  echo -e "  ${GREEN}✓${NC} تم حذف قسم server"
else
  echo -e "  ${RED}✗${NC} ملف capacitor.config.ts غير موجود!"
  ERRORS=$((ERRORS + 1))
fi

# ────────────────────────────────────────────────────────────
# 5. إزالة حزمة lovable-tagger من package.json
# ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/5]${NC} إزالة حزمة lovable-tagger..."

if command -v npm &> /dev/null; then
  npm uninstall lovable-tagger 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} تم إزالة lovable-tagger من package.json" || \
    echo -e "  ${GREEN}✓${NC} lovable-tagger غير مثبت (محذوف مسبقاً)"
else
  echo -e "  ${YELLOW}!${NC} npm غير متوفر — احذف lovable-tagger يدوياً من package.json"
fi

# ────────────────────────────────────────────────────────────
# النتيجة
# ────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}============================================================${NC}"

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}  ✅ تم تنظيف الكود بنجاح!${NC}"
else
  echo -e "${RED}  ⚠️ تم الانتهاء مع $ERRORS أخطاء${NC}"
fi

echo -e "${BLUE}============================================================${NC}"
echo ""
echo -e "${YELLOW}📋 الخطوات التالية:${NC}"
echo ""
echo -e "  1. عدّل ملف ${GREEN}.env${NC} بقيم مشروع Supabase الجديد:"
echo -e "     ${BLUE}VITE_SUPABASE_URL${NC}=https://YOUR_PROJECT.supabase.co"
echo -e "     ${BLUE}VITE_SUPABASE_PUBLISHABLE_KEY${NC}=your_anon_key"
echo -e "     ${BLUE}VITE_SUPABASE_PROJECT_ID${NC}=your_project_id"
echo ""
echo -e "  2. نفّذ ${GREEN}scripts/export-schema.sql${NC} في SQL Editor"
echo ""
echo -e "  3. أنشئ 9 Storage Buckets (راجع MIGRATION_GUIDE.md)"
echo ""
echo -e "  4. شغّل ${GREEN}bash scripts/deploy-all.sh${NC} لنشر Edge Functions"
echo ""
echo -e "  5. أعد إعداد Google OAuth في Supabase Dashboard"
echo ""
echo -e "  6. ابنِ التطبيق:"
echo -e "     ${GREEN}npm run build${NC}"
echo -e "     ${GREEN}npx cap sync android${NC}"
echo -e "     ${GREEN}npx cap open android${NC}"
echo ""
