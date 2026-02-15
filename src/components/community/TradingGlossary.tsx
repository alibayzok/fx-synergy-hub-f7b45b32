import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { BookText, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GlossaryTerm {
  term_ar: string;
  term_en: string;
  definition_ar: string;
  definition_en: string;
}

const glossaryData: GlossaryTerm[] = [
  // أ
  { term_ar: 'أمر تحديد الشراء', term_en: 'Buy Limit Order', definition_ar: 'أمر إلى وسيط لشراء كمية معينة من ائتمان في سعر محدد أو أقل منه (يسمى سعر التحديد).', definition_en: 'An order to buy at or below a specified price.' },
  { term_ar: 'أو تي سي', term_en: 'OTC (Over The Counter)', definition_ar: 'سوق لا مركزي يتم فيه التداول مباشرة بين الأطراف دون بورصة مركزية.', definition_en: 'A decentralized market where trading occurs directly between parties.' },
  { term_ar: 'أي سي بي', term_en: 'ECB', definition_ar: 'البنك المركزي الأوروبي المسؤول عن السياسة النقدية لمنطقة اليورو.', definition_en: 'European Central Bank responsible for eurozone monetary policy.' },
  { term_ar: 'أي أم أم', term_en: 'IMM', definition_ar: 'السوق النقدي الدولي، قسم من بورصة شيكاغو التجارية.', definition_en: 'International Monetary Market, a division of the CME.' },
  { term_ar: 'أي أم اف', term_en: 'IMF', definition_ar: 'صندوق النقد الدولي، منظمة دولية تهدف لتعزيز الاستقرار المالي العالمي.', definition_en: 'International Monetary Fund, promoting global financial stability.' },
  // ا
  { term_ar: 'اتجاه الى الأسفل', term_en: 'Downtrend', definition_ar: 'حالة السوق عندما تكون الأسعار في انخفاض مستمر مع قمم وقيعان هابطة.', definition_en: 'Market condition where prices consistently decline with lower highs and lows.' },
  { term_ar: 'اجمالي', term_en: 'Aggregate', definition_ar: 'المجموع الكلي أو الإجمالي لعدة قيم أو صفقات.', definition_en: 'The total sum of multiple values or transactions.' },
  { term_ar: 'اخذ الربح', term_en: 'Take Profit (TP)', definition_ar: 'أمر لإغلاق الصفقة تلقائياً عند الوصول لمستوى ربح محدد مسبقاً.', definition_en: 'An order to close a position automatically at a predetermined profit level.' },
  { term_ar: 'اسعار متقاطعة', term_en: 'Cross Rates', definition_ar: 'سعر صرف بين عملتين لا يتضمن الدولار الأمريكي.', definition_en: 'Exchange rate between two currencies that does not involve USD.' },
  { term_ar: 'اس دي أر', term_en: 'SDR', definition_ar: 'حقوق السحب الخاصة، أصل احتياطي دولي أنشأه صندوق النقد الدولي.', definition_en: 'Special Drawing Rights, an international reserve asset by the IMF.' },
  { term_ar: 'اس & بي 500', term_en: 'S&P 500', definition_ar: 'مؤشر يتتبع أداء 500 شركة كبرى مدرجة في البورصات الأمريكية.', definition_en: 'Index tracking 500 large US-listed companies.' },
  { term_ar: 'اشعار التسليم', term_en: 'Delivery Notice', definition_ar: 'إشعار رسمي بتسليم السلعة المادية بموجب عقد آجل.', definition_en: 'Formal notice of physical commodity delivery under a futures contract.' },
  { term_ar: 'الاتجاه', term_en: 'Trend', definition_ar: 'الاتجاه العام لحركة السعر سواء صعوداً أو هبوطاً أو جانبياً.', definition_en: 'The general direction of price movement: up, down, or sideways.' },
  { term_ar: 'الاحتياط', term_en: 'Reserve', definition_ar: 'أموال تحتفظ بها البنوك المركزية كضمان للعملة والسياسة النقدية.', definition_en: 'Funds held by central banks to back currency and monetary policy.' },
  { term_ar: 'الاستيراد', term_en: 'Import', definition_ar: 'شراء السلع والخدمات من دولة أجنبية.', definition_en: 'Buying goods and services from a foreign country.' },
  { term_ar: 'الاعتماد', term_en: 'Credit', definition_ar: 'القدرة على الاقتراض أو الحصول على سلع وخدمات مع وعد بالدفع لاحقاً.', definition_en: 'The ability to borrow or obtain goods with a promise to pay later.' },
  { term_ar: 'الانتاج الصناعي', term_en: 'Industrial Production', definition_ar: 'مقياس اقتصادي يقيس إنتاج المصانع والمناجم والمرافق.', definition_en: 'Economic measure of output from factories, mines, and utilities.' },
  { term_ar: 'الانتاجية', term_en: 'Productivity', definition_ar: 'مقياس كفاءة الإنتاج، عادة الناتج لكل وحدة من العمالة.', definition_en: 'Measure of production efficiency, typically output per unit of labor.' },
  { term_ar: 'الانسحاب', term_en: 'Withdrawal', definition_ar: 'سحب الأموال من حساب التداول.', definition_en: 'Removing funds from a trading account.' },
  { term_ar: 'الانكماش', term_en: 'Deflation', definition_ar: 'انخفاض مستمر في المستوى العام للأسعار.', definition_en: 'A sustained decrease in the general price level.' },
  { term_ar: 'الايداع', term_en: 'Deposit', definition_ar: 'إيداع الأموال في حساب التداول.', definition_en: 'Adding funds to a trading account.' },
  { term_ar: 'التاجر', term_en: 'Trader', definition_ar: 'شخص يقوم بشراء وبيع الأصول المالية بهدف الربح.', definition_en: 'A person who buys and sells financial assets for profit.' },
  { term_ar: 'التباعد', term_en: 'Divergence', definition_ar: 'حالة يتحرك فيها السعر في اتجاه معاكس لمؤشر فني، وتشير لاحتمال انعكاس الاتجاه.', definition_en: 'When price moves opposite to a technical indicator, signaling possible reversal.' },
  { term_ar: 'التثبيت', term_en: 'Pegging', definition_ar: 'ربط سعر صرف عملة بعملة أخرى أو بسلة عملات بسعر ثابت.', definition_en: 'Fixing a currency exchange rate to another currency at a set rate.' },
  { term_ar: 'التجارة الالكترونية', term_en: 'E-Commerce', definition_ar: 'التداول والتجارة عبر الإنترنت والمنصات الإلكترونية.', definition_en: 'Trading and commerce conducted via the internet.' },
  { term_ar: 'التحليل', term_en: 'Analysis', definition_ar: 'دراسة حركة الأسعار والمؤشرات لاتخاذ قرارات تداول مدروسة.', definition_en: 'Studying price movements and indicators for informed trading decisions.' },
  { term_ar: 'التحليل الأساسي الجوهري', term_en: 'Fundamental Analysis', definition_ar: 'تحليل العوامل الاقتصادية والمالية والسياسية التي تؤثر على قيمة العملة.', definition_en: 'Analysis of economic, financial, and political factors affecting currency value.' },
  { term_ar: 'التدحرج', term_en: 'Rollover', definition_ar: 'تمديد تاريخ تسوية صفقة مفتوحة لليوم التالي مع احتساب فارق الفائدة.', definition_en: 'Extending a position settlement date with interest rate differential applied.' },
  { term_ar: 'التدخل', term_en: 'Intervention', definition_ar: 'تدخل البنك المركزي في سوق العملات للتأثير على سعر صرف عملته.', definition_en: 'Central bank action in the forex market to influence its currency value.' },
  { term_ar: 'التسوية', term_en: 'Settlement', definition_ar: 'عملية إتمام الصفقة بتبادل العملات أو الأصول المالية.', definition_en: 'The process of completing a trade by exchanging currencies or assets.' },
  { term_ar: 'التصدير', term_en: 'Export', definition_ar: 'بيع السلع والخدمات إلى دولة أجنبية.', definition_en: 'Selling goods and services to a foreign country.' },
  { term_ar: 'التضخم', term_en: 'Inflation', definition_ar: 'ارتفاع مستمر في المستوى العام للأسعار وانخفاض القوة الشرائية للعملة.', definition_en: 'A sustained increase in prices reducing the purchasing power of money.' },
  { term_ar: 'التعرض', term_en: 'Exposure', definition_ar: 'مقدار المخاطر التي يتعرض لها المتداول في السوق.', definition_en: 'The degree of risk a trader faces in the market.' },
  { term_ar: 'التعقيم', term_en: 'Sterilization', definition_ar: 'إجراء يقوم به البنك المركزي لتحييد أثر تدخله في سوق العملات على العرض النقدي.', definition_en: 'Central bank action to neutralize the effect of forex intervention on money supply.' },
  { term_ar: 'التغطية', term_en: 'Hedging', definition_ar: 'استراتيجية لتقليل المخاطر بفتح صفقة معاكسة للصفقة الأصلية.', definition_en: 'A strategy to reduce risk by opening an opposite position.' },
  { term_ar: 'التفاصيل', term_en: 'Specifications', definition_ar: 'الشروط والمواصفات التفصيلية لعقد التداول أو الأداة المالية.', definition_en: 'Detailed terms and conditions of a trading contract or instrument.' },
  { term_ar: 'التقلب', term_en: 'Volatility', definition_ar: 'مقياس لمدى تغير السعر خلال فترة زمنية، كلما زاد التقلب زادت المخاطر والفرص.', definition_en: 'Measure of price change over time; higher volatility means more risk and opportunity.' },
  { term_ar: 'التقلب التاريخي', term_en: 'Historical Volatility', definition_ar: 'قياس التقلبات السعرية السابقة بناءً على البيانات التاريخية.', definition_en: 'Measurement of past price fluctuations based on historical data.' },
  { term_ar: 'التنبيه', term_en: 'Alert', definition_ar: 'إشعار يتم تفعيله عند وصول السعر لمستوى محدد مسبقاً.', definition_en: 'A notification triggered when price reaches a predetermined level.' },
  { term_ar: 'التوريد الاجمالي', term_en: 'Aggregate Supply', definition_ar: 'إجمالي المعروض من السلع والخدمات في الاقتصاد خلال فترة معينة.', definition_en: 'Total supply of goods and services in an economy over a period.' },
  // ب
  { term_ar: 'بيب (نقطة)', term_en: 'Pip', definition_ar: 'أصغر وحدة تغيير في سعر صرف زوج عملات، عادة الخانة العشرية الرابعة (0.0001).', definition_en: 'The smallest price move in a currency pair, typically 0.0001.' },
  { term_ar: 'بيع على المكشوف', term_en: 'Short Selling', definition_ar: 'بيع أصل مالي لا تملكه بهدف إعادة شرائه بسعر أقل لاحقاً.', definition_en: 'Selling an asset you don\'t own, hoping to buy it back cheaper later.' },
  // ت
  { term_ar: 'تاريخ الدفع', term_en: 'Value Date', definition_ar: 'التاريخ الذي يتم فيه تسوية الصفقة فعلياً.', definition_en: 'The date on which a trade is actually settled.' },
  { term_ar: 'تسليم نقدي', term_en: 'Cash Delivery', definition_ar: 'تسوية العقد نقداً بدلاً من التسليم الفعلي للسلعة.', definition_en: 'Settling a contract in cash instead of physical delivery.' },
  { term_ar: 'تذكرة', term_en: 'Ticket', definition_ar: 'رقم تعريفي فريد لكل صفقة تداول.', definition_en: 'A unique identification number for each trade.' },
  { term_ar: 'تحسن', term_en: 'Rally', definition_ar: 'ارتفاع سريع وقوي في الأسعار بعد فترة من الانخفاض أو الاستقرار.', definition_en: 'A rapid and strong price increase after a decline or consolidation.' },
  { term_ar: 'تيك', term_en: 'Tick', definition_ar: 'أصغر حركة سعرية ممكنة في أداة مالية.', definition_en: 'The smallest possible price movement in a financial instrument.' },
  // ج
  { term_ar: 'جلوبكس', term_en: 'Globex', definition_ar: 'نظام تداول إلكتروني عالمي تابع لبورصة شيكاغو التجارية (CME).', definition_en: 'Global electronic trading system operated by CME.' },
  { term_ar: 'جي - 7', term_en: 'G-7', definition_ar: 'مجموعة الدول السبع الصناعية الكبرى: أمريكا، بريطانيا، فرنسا، ألمانيا، إيطاليا، كندا، واليابان.', definition_en: 'Group of 7 major industrialized nations.' },
  { term_ar: 'جدول الرواتب', term_en: 'Non-Farm Payrolls (NFP)', definition_ar: 'تقرير شهري أمريكي يقيس عدد الوظائف المضافة باستثناء القطاع الزراعي، من أهم المؤشرات الاقتصادية.', definition_en: 'Monthly US report measuring jobs added excluding farming, a key economic indicator.' },
  { term_ar: 'جيد حتى يتم إلغاؤه', term_en: 'GTC (Good Till Cancelled)', definition_ar: 'أمر تداول يبقى فعالاً حتى يتم تنفيذه أو إلغاؤه يدوياً.', definition_en: 'A trading order that remains active until executed or manually cancelled.' },
  // ح
  { term_ar: 'حجم العقد', term_en: 'Lot Size', definition_ar: 'حجم وحدة التداول القياسية. العقد القياسي = 100,000 وحدة من العملة الأساسية.', definition_en: 'Standard trading unit. A standard lot = 100,000 units of base currency.' },
  { term_ar: 'حجم السعر', term_en: 'Tick Size', definition_ar: 'الحد الأدنى لتغير السعر في أداة مالية معينة.', definition_en: 'The minimum price change for a given financial instrument.' },
  { term_ar: 'حد اليوم التالي', term_en: 'Overnight Limit', definition_ar: 'الحد الأقصى للمراكز المفتوحة التي يمكن الاحتفاظ بها حتى اليوم التالي.', definition_en: 'Maximum open positions that can be held overnight.' },
  { term_ar: 'حساب جاري', term_en: 'Current Account', definition_ar: 'جزء من ميزان المدفوعات يشمل التجارة في السلع والخدمات والتحويلات.', definition_en: 'Part of balance of payments covering trade in goods, services, and transfers.' },
  // خ
  { term_ar: 'خصم', term_en: 'Discount', definition_ar: 'الفرق السلبي بين السعر الآجل والسعر الفوري للعملة.', definition_en: 'The negative difference between forward and spot price of a currency.' },
  { term_ar: 'خسارة غير متحققة', term_en: 'Unrealized Loss', definition_ar: 'خسارة نظرية في صفقة مفتوحة لم يتم إغلاقها بعد.', definition_en: 'A theoretical loss on an open position not yet closed.' },
  { term_ar: 'خيارات معدل الفائدة', term_en: 'Interest Rate Options', definition_ar: 'عقود خيارات ترتبط بأسعار الفائدة، تمنح الحق في الاقتراض أو الإقراض بسعر محدد.', definition_en: 'Options contracts tied to interest rates.' },
  // د
  { term_ar: 'الدعم والمساندة', term_en: 'Support', definition_ar: 'مستوى سعري يميل السعر للارتداد صعوداً منه بسبب زيادة الطلب.', definition_en: 'A price level where buying interest tends to prevent further decline.' },
  // ر
  { term_ar: 'الرصيد', term_en: 'Balance', definition_ar: 'إجمالي الأموال في حساب التداول بعد إغلاق جميع الصفقات.', definition_en: 'Total funds in a trading account after all closed positions.' },
  { term_ar: 'الرضية', term_en: 'Floor', definition_ar: 'الحد الأدنى لسعر الصرف أو سعر الفائدة.', definition_en: 'The minimum exchange rate or interest rate.' },
  { term_ar: 'الربح / الخسارة المعومة', term_en: 'Floating P/L', definition_ar: 'الأرباح أو الخسائر غير المحققة على الصفقات المفتوحة حالياً.', definition_en: 'Unrealized profits or losses on currently open positions.' },
  { term_ar: 'الرأس والأكتف', term_en: 'Head and Shoulders', definition_ar: 'نمط فني انعكاسي يتكون من ثلاث قمم، القمة الوسطى أعلى من الجانبيتين.', definition_en: 'A reversal chart pattern with three peaks, the middle being highest.' },
  // س
  { term_ar: 'السعر', term_en: 'Price/Rate', definition_ar: 'القيمة الحالية لزوج عملات أو أصل مالي في السوق.', definition_en: 'The current value of a currency pair or asset in the market.' },
  { term_ar: 'السعر المعدل', term_en: 'Adjusted Price', definition_ar: 'السعر بعد تعديله ليأخذ بعين الاعتبار عوامل مثل توزيعات الأرباح.', definition_en: 'Price adjusted for factors like dividends.' },
  { term_ar: 'السعر المطلوب', term_en: 'Ask Price', definition_ar: 'السعر الذي يمكنك الشراء به من السوق (أعلى من سعر البيع).', definition_en: 'The price at which you can buy from the market.' },
  { term_ar: 'السبيكة', term_en: 'Bullion', definition_ar: 'المعادن الثمينة كالذهب والفضة بشكلها الخام أو سبائك.', definition_en: 'Precious metals like gold and silver in raw or bar form.' },
  { term_ar: 'السوق الفعلي', term_en: 'Spot Market', definition_ar: 'سوق يتم فيه تداول الأصول بالأسعار الحالية مع تسوية فورية.', definition_en: 'A market where assets are traded at current prices with immediate settlement.' },
  { term_ar: 'السلسلة', term_en: 'Series', definition_ar: 'مجموعة من عقود الخيارات بنفس الخصائص.', definition_en: 'A group of options contracts with the same characteristics.' },
  // ص
  { term_ar: 'الصرف الأجنبي', term_en: 'Forex (FX)', definition_ar: 'سوق تداول العملات الأجنبية، أكبر سوق مالي في العالم بحجم تداول يومي يتجاوز 6 تريليون دولار.', definition_en: 'Foreign exchange market, the largest financial market with over $6 trillion daily volume.' },
  // ط
  { term_ar: 'الطلب', term_en: 'Demand', definition_ar: 'رغبة المشترين في شراء أصل مالي عند مستوى سعري معين.', definition_en: 'Buyers\' desire to purchase an asset at a given price level.' },
  { term_ar: 'الطرف المقابل', term_en: 'Counterparty', definition_ar: 'الطرف الآخر في صفقة التداول.', definition_en: 'The other party in a trading transaction.' },
  // ع
  { term_ar: 'العجز', term_en: 'Deficit', definition_ar: 'الفرق السلبي عندما تتجاوز النفقات الإيرادات.', definition_en: 'A negative difference when expenditure exceeds revenue.' },
  { term_ar: 'العقد', term_en: 'Contract/Lot', definition_ar: 'وحدة قياس حجم الصفقة في التداول.', definition_en: 'A unit of measurement for trade size.' },
  { term_ar: 'العلاوة', term_en: 'Premium', definition_ar: 'الفرق الإيجابي بين السعر الآجل والسعر الفوري، أو تكلفة شراء عقد خيار.', definition_en: 'The positive difference between forward and spot price, or cost of an option.' },
  { term_ar: 'العمولة', term_en: 'Commission', definition_ar: 'رسوم يتقاضاها الوسيط مقابل تنفيذ الصفقات.', definition_en: 'Fees charged by a broker for executing trades.' },
  // ف
  { term_ar: 'الفجوة', term_en: 'Gap', definition_ar: 'فراغ سعري يحدث عندما يفتح السوق بسعر مختلف تماماً عن سعر الإغلاق السابق.', definition_en: 'A price void when the market opens at a significantly different price from previous close.' },
  { term_ar: 'الفوري', term_en: 'Spot', definition_ar: 'تداول يتم تسويته فوراً بالسعر الحالي للسوق (عادة خلال يومي عمل).', definition_en: 'A trade settled immediately at current market price (usually within 2 business days).' },
  { term_ar: 'اف او ام سي', term_en: 'FOMC', definition_ar: 'لجنة السوق المفتوحة الفيدرالية، المسؤولة عن تحديد سعر الفائدة الأمريكية.', definition_en: 'Federal Open Market Committee, responsible for US interest rate decisions.' },
  // ق
  { term_ar: 'القبول', term_en: 'Acceptance', definition_ar: 'الموافقة على شروط صفقة أو عقد تداول.', definition_en: 'Agreement to the terms of a trade or contract.' },
  { term_ar: 'القمة المزدوجة', term_en: 'Double Top', definition_ar: 'نمط فني انعكاسي يتشكل عندما يصل السعر لنفس القمة مرتين ثم يهبط.', definition_en: 'A reversal pattern formed when price hits the same high twice then declines.' },
  // ك
  { term_ar: 'الكشف', term_en: 'Statement', definition_ar: 'تقرير تفصيلي لجميع العمليات والأرصدة في حساب التداول.', definition_en: 'A detailed report of all transactions and balances in a trading account.' },
  // ل
  { term_ar: 'الرافعة المالية', term_en: 'Leverage', definition_ar: 'أداة تتيح التداول بمبالغ أكبر من رأس المال الفعلي. مثلاً رافعة 1:100 تعني التحكم بـ 100,000$ بـ 1,000$ فقط.', definition_en: 'A tool allowing trading with amounts larger than actual capital. E.g., 1:100 means controlling $100,000 with just $1,000.' },
  // م
  { term_ar: 'المؤشر', term_en: 'Index/Indicator', definition_ar: 'مقياس إحصائي يتتبع أداء مجموعة من الأسهم أو الأصول المالية.', definition_en: 'A statistical measure tracking performance of a group of stocks or assets.' },
  { term_ar: 'المسافة التقويمية', term_en: 'Calendar Spread', definition_ar: 'استراتيجية تتضمن شراء وبيع عقود لنفس الأصل بتواريخ انتهاء مختلفة.', definition_en: 'A strategy involving buying and selling contracts with different expiration dates.' },
  { term_ar: 'المخزون', term_en: 'Inventory', definition_ar: 'كمية الأصول أو السلع المحتفظ بها.', definition_en: 'The quantity of assets or commodities held.' },
  { term_ar: 'المسافة', term_en: 'Spread', definition_ar: 'الفرق بين سعر الشراء (Ask) وسعر البيع (Bid) لزوج عملات.', definition_en: 'The difference between Ask and Bid price of a currency pair.' },
  { term_ar: 'المال الفعال', term_en: 'Real Money', definition_ar: 'أموال حقيقية مقابل الأموال الافتراضية في الحسابات التجريبية.', definition_en: 'Real funds as opposed to virtual money in demo accounts.' },
  { term_ar: 'المتاجرة الأساس', term_en: 'Basis Trading', definition_ar: 'التداول بناءً على الفرق بين السعر الفوري والسعر الآجل.', definition_en: 'Trading based on the difference between spot and forward prices.' },
  { term_ar: 'المستقبليات المالية', term_en: 'Financial Futures', definition_ar: 'عقود آجلة على أدوات مالية مثل العملات والمؤشرات وأسعار الفائدة.', definition_en: 'Futures contracts on financial instruments like currencies, indices, and interest rates.' },
  { term_ar: 'المستفيد', term_en: 'Beneficiary', definition_ar: 'الشخص أو الجهة المستفيدة من حوالة مالية أو عقد.', definition_en: 'The person or entity receiving benefit from a financial transfer or contract.' },
  // ن
  { term_ar: 'نقطة المقاومة', term_en: 'Resistance', definition_ar: 'مستوى سعري يميل السعر للارتداد هبوطاً منه بسبب زيادة العرض.', definition_en: 'A price level where selling interest tends to prevent further rise.' },
  // و
  { term_ar: 'وقف الخسارة', term_en: 'Stop Loss (SL)', definition_ar: 'أمر لإغلاق الصفقة تلقائياً عند مستوى خسارة محدد لحماية رأس المال.', definition_en: 'An order to close a position at a set loss level to protect capital.' },
  { term_ar: 'الهامش', term_en: 'Margin', definition_ar: 'المبلغ المطلوب كضمان لفتح صفقة تداول بالرافعة المالية.', definition_en: 'The collateral required to open a leveraged trading position.' },
  { term_ar: 'الشهر الفوري', term_en: 'Spot Month', definition_ar: 'أقرب شهر لتسليم عقد آجل.', definition_en: 'The nearest month for futures contract delivery.' },
  { term_ar: 'السياح', term_en: 'Tourist', definition_ar: 'مصطلح يطلق على المتداولين قصيري المدى أو غير المحترفين.', definition_en: 'Slang for short-term or non-professional traders.' },
];

const arabicLetters = ['الكل', 'أ', 'ا', 'ب', 'ت', 'ج', 'ح', 'خ', 'د', 'ر', 'س', 'ش', 'ص', 'ط', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'و'];

const getFirstArabicLetter = (term: string): string => {
  const ch = term.charAt(0);
  // normalize alef variants
  if (['إ', 'آ', 'أ'].includes(ch)) return 'أ';
  if (ch === 'ا') return 'ا';
  return ch;
};

export const TradingGlossary = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [selectedLetter, setSelectedLetter] = useState('الكل');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTerms = useMemo(() => {
    let terms = glossaryData;
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      terms = terms.filter(t =>
        t.term_ar.includes(q) || t.term_en.toLowerCase().includes(q)
      );
    } else if (selectedLetter !== 'الكل') {
      terms = terms.filter(t => {
        const first = getFirstArabicLetter(t.term_ar);
        return first === selectedLetter;
      });
    }

    return terms;
  }, [selectedLetter, searchQuery]);

  // Group by first letter
  const grouped = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach(term => {
      const letter = getFirstArabicLetter(term.term_ar);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    });
    return groups;
  }, [filteredTerms]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <BookText className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">
          {isArabic ? 'مصطلحات التداول' : 'Trading Glossary'}
        </h3>
        <span className="text-xs text-muted-foreground">({glossaryData.length})</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isArabic ? 'ابحث عن مصطلح...' : 'Search term...'}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedLetter('الكل'); }}
          className="ps-9 bg-background/50"
        />
      </div>

      {/* Letter Filter */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-1.5">
          {arabicLetters.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={cn(
                "min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold transition-all",
                selectedLetter === letter
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {/* Terms Grid */}
      {Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([letter, terms]) => (
          <div key={letter}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-primary">{letter}</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {terms.map((term, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setSelectedTerm(term)}
                  className="text-start p-3 rounded-xl border border-border/30 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-sm text-foreground leading-snug">{isArabic ? term.term_ar : term.term_en}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{isArabic ? term.term_en : term.term_ar}</p>
                </motion.button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {isArabic ? 'لا توجد مصطلحات مطابقة' : 'No matching terms'}
        </div>
      )}

      {/* Term Detail Card */}
      <AnimatePresence>
        {selectedTerm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedTerm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-border/40 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/30 bg-primary/5">
                <div>
                  <h4 className="font-bold text-lg text-foreground">{isArabic ? selectedTerm.term_ar : selectedTerm.term_en}</h4>
                  <p className="text-sm text-primary font-medium">{isArabic ? selectedTerm.term_en : selectedTerm.term_ar}</p>
                </div>
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-foreground leading-relaxed">
                  {isArabic ? selectedTerm.definition_ar : selectedTerm.definition_en}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
