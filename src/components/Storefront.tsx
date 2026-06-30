import React, { useState, useRef } from "react";
import { CoffeeBlend, MenuItem, MenuCategory, BlendCategory, GalleryItem, BlendInfo, StoreSettings } from "../types";
import { Search, MapPin, Phone, Coffee, Sparkles, Filter, Eye, ChevronLeft, ChevronRight, X, BookOpen, Globe, Compass, Award, Info, Play, Video, Menu, LayoutGrid, List, Mail, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";

interface StorefrontProps {
  blends: CoffeeBlend[];
  menus: MenuItem[];
  menuCategories?: MenuCategory[];
  blendCategories?: BlendCategory[];
  gallery?: GalleryItem[];
  blendInfos?: BlendInfo[];
  settings?: StoreSettings;
  onGoToLogin: () => void;
  language: "en" | "ar";
  onToggleLanguage: () => void;
}

function getYouTubeEmbedUrl(url?: string) {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }
  return url;
}

export default function Storefront({
  blends,
  menus,
  menuCategories = [],
  blendCategories = [],
  gallery = [],
  blendInfos = [],
  settings,
  onGoToLogin,
  language,
  onToggleLanguage
}: StorefrontProps) {
  const [activeTab, setActiveTab] = useState<"prepared" | "beans" | "blendInfos" | "gallery" | "about">("prepared");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedBlendInfo, setSelectedBlendInfo] = useState<BlendInfo | null>(null);
  
  // Layout states persisted in localStorage
  const [menuLayout, setMenuLayout] = useState<"grid" | "list">(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("socotra_menu_layout") : null;
    return (saved as "grid" | "list") || "grid";
  });
  const [blendLayout, setBlendLayout] = useState<"grid" | "list">(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("socotra_blend_layout") : null;
    return (saved as "grid" | "list") || "grid";
  });

  // Persist layout changes
  React.useEffect(() => {
    localStorage.setItem("socotra_menu_layout", menuLayout);
  }, [menuLayout]);

  React.useEffect(() => {
    localStorage.setItem("socotra_blend_layout", blendLayout);
  }, [blendLayout]);

  const sortedGallery = [...gallery].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const sortedMenus = [...menus].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const sortedBlends = [...blends].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const sortedBlendInfos = [...blendInfos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const locationsList = settings?.locations || [];
  const loc1 = locationsList[0];
  const loc2 = locationsList[1];

  const l1Name = loc1 
    ? (language === "en" ? (loc1.nameEn || "Vivinz Mall") : (loc1.nameAr || "فيفينز مول - الدور الأول")) 
    : (language === "en" ? "Vivinz Mall" : "فيفينز مول - الدور الأول");
  const l1Address = loc1 
    ? (language === "en" ? (loc1.addressEn || "Al Shorouk City, Cairo Governorate, Egypt") : (loc1.addressAr || "مدينة الشروق، محافظة القاهرة، مصر")) 
    : (language === "en" ? "Al Shorouk City, Cairo Governorate, Egypt" : "مدينة الشروق، محافظة القاهرة، مصر");

  const l2Name = loc2 
    ? (language === "en" ? (loc2.nameEn || "Valio Mall") : (loc2.nameAr || "فاليو مول - الدور الأرضي")) 
    : (language === "en" ? "Valio Mall" : "فاليو مول - الدور الأرضي");
  const l2Address = loc2 
    ? (language === "en" ? (loc2.addressEn || "Al Shorouk City, Cairo Governorate, Egypt") : (loc2.addressAr || "مدينة الشروق، محافظة القاهرة، مصر")) 
    : (language === "en" ? "Al Shorouk City, Cairo Governorate, Egypt" : "مدينة الشروق، محافظة القاهرة، مصر");

  const displayPhones = settings?.contactPhones || ["010 1166 6167"];
  const displayEmails = settings?.contactEmails || ["Socotra@admin.com"];

  const noteText = language === "en" ? (settings?.wholesaleNoteEn || "Call or message for wholesale orders or private bean reserves.") : (settings?.wholesaleNoteAr || "اتصل أو راسلنا لطلبات الجملة أو احتياطيات حبوب البن الخاصة.");

  const menuScrollRef = useRef<HTMLDivElement>(null);
  const blendScrollRef = useRef<HTMLDivElement>(null);

  const handleViewBlendInfo = (blendId: string) => {
    setActiveTab("blendInfos");
    setTimeout(() => {
      const element = document.getElementById(`blend-info-card-${blendId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-4", "ring-[#B88A58]/30", "scale-[1.01]");
        setTimeout(() => {
          element.classList.remove("ring-4", "ring-[#B88A58]/30", "scale-[1.01]");
        }, 2000);
      }
    }, 120);
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 240;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Fallback category lists if the database list is empty
  const defaultMenuCategories = [
    { key: "Turkish Bar", label: "Turkish Bar", labelAr: "الركن التركي" },
    { key: "Espresso Bar", label: "Espresso Specialty", labelAr: "قهوة إسبريسو" },
    { key: "Non Espresso Beverages", label: "Hot Non-Espresso", labelAr: "مشروبات ساخنة" },
    { key: "Iced Espresso Bar And Specialty Coffee Beverages", label: "Iced Specialty", labelAr: "مشروبات إسبريسو مثلجة" },
    { key: "Iced Matcha Drinks", label: "Iced Matcha", labelAr: "ايس ماتشا" },
    { key: "Frappe", label: "Frappé & Sweets", labelAr: "فرابيه وحلوى" },
    { key: "Refreshers", label: "Refreshers & Juices", labelAr: "مشروبات منعشة" },
    { key: "Baked Goods & Dessert", label: "Bakery", labelAr: "الكوكيز وحلويات" },
    { key: "Alternatives & Add-Ons", label: "Add-Ons", labelAr: "الإضافات" }
  ];

  const defaultBlendCategories = [
    { key: "Plain Coffee", label: "Plain Coffee Bags", labelAr: "بن سادة" },
    { key: "Spiced Coffee", label: "Spiced Coffee Bags", labelAr: "بن محوج" },
    { key: "Espresso Beans", label: "Espresso Beans", labelAr: "حبوب الاسبريسو" },
    { key: "Single Origin Coffee", label: "Single Origin", labelAr: "بن منشأ واحد" },
    { key: "Coffee Supplements", label: "Supplements", labelAr: "مكملات القهوة" },
    { key: "Coffee Additives", label: "Additives", labelAr: "اضافات البن" }
  ];

  // Resolve Categories (adding "all" dynamically)
  const resolvedMenuCategories = [
    { key: "all", label: "All Items", labelAr: "الكل" },
    ...(menuCategories && menuCategories.length > 0 
      ? menuCategories.map(c => ({ key: c.key, label: c.label, labelAr: c.labelAr }))
      : defaultMenuCategories)
  ];

  const resolvedBlendCategories = [
    { key: "all", label: "All Blends", labelAr: "الكل" },
    ...(blendCategories && blendCategories.length > 0
      ? blendCategories.map(c => ({ key: c.key, label: c.label, labelAr: c.labelAr }))
      : defaultBlendCategories)
  ];

  // Filters prepared items
  const filteredMenus = sortedMenus.filter((item) => {
    const matchesSearch =
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameAr.includes(searchQuery) ||
      (item.descriptionEn && item.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.descriptionAr && item.descriptionAr.includes(searchQuery));
      
    if (activeCategoryFilter === "all") return matchesSearch;
    return item.category === activeCategoryFilter && matchesSearch;
  });

  // Filters beans items
  const filteredBlends = sortedBlends.filter((item) => {
    const matchesSearch =
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameAr.includes(searchQuery) ||
      (item.descriptionEn && item.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.descriptionAr && item.descriptionAr.includes(searchQuery));

    if (activeCategoryFilter === "all") return matchesSearch;
    return item.category === activeCategoryFilter && matchesSearch;
  });

  // Helper render pricing with slash-pricing
  const renderPrice = (single?: number, double?: number) => {
    if (single && double) {
      return `${single}/${double} EGP`;
    }
    if (single) {
      return `${single} EGP`;
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] flex flex-col selection:bg-[#B88A58] selection:text-white" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Upper Navigation Rail */}
      <header className="sticky top-0 z-50 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#0D2D3A]/10 px-4 py-3 shadow-none">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Brand Signature - Desktop */}
          <div className="hidden lg:flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("prepared"); setActiveCategoryFilter("all"); }}>
            <div className="scale-45 origin-center w-12 h-12 flex flex-col items-center justify-center flex-shrink-0">
              <Logo size={100} />
            </div>
            <div>
              <h1 className="font-display font-bold text-[#0D2D3A] text-lg tracking-wide">SOCOTRA COFFEE</h1>
              <p className="font-sans text-[10px] uppercase tracking-widest text-[#B88A58] font-semibold">BEN SOCOTRA • بن سقطرى</p>
            </div>
          </div>

          {/* Interactive Navigation System - Desktop */}
          <div className="hidden lg:flex flex-wrap items-center justify-center gap-1.5 bg-[#0D2D3A]/5 p-1 rounded-full text-xs font-semibold">
            <button
              onClick={() => { setActiveTab("prepared"); setActiveCategoryFilter("all"); setSearchQuery(""); }}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "prepared"
                  ? "bg-[#0D2D3A] text-[#FAF7EE] shadow-sm"
                  : "text-[#0D2D3A]/75 hover:bg-[#0D2D3A]/5"
              }`}
            >
              {language === "en" ? "Prepared Menus" : "قائمة المشروبات"}
            </button>
            <button
              onClick={() => { setActiveTab("beans"); setActiveCategoryFilter("all"); setSearchQuery(""); }}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "beans"
                  ? "bg-[#0D2D3A] text-[#FAF7EE] shadow-sm"
                  : "text-[#0D2D3A]/75 hover:bg-[#0D2D3A]/5"
              }`}
            >
              {language === "en" ? "Coffee Bags & Blends" : "حبوب البن والخلطات"}
            </button>
            <button
              onClick={() => { setActiveTab("blendInfos"); setSearchQuery(""); }}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "blendInfos"
                  ? "bg-[#0D2D3A] text-[#FAF7EE] shadow-sm"
                  : "text-[#0D2D3A]/75 hover:bg-[#0D2D3A]/5"
              }`}
            >
              {language === "en" ? "Blend Info" : "معلومات البن"}
            </button>
            <button
              onClick={() => { setActiveTab("gallery"); setActiveCategoryFilter("all"); setSearchQuery(""); }}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "gallery"
                  ? "bg-[#0D2D3A] text-[#FAF7EE] shadow-sm"
                  : "text-[#0D2D3A]/75 hover:bg-[#0D2D3A]/5"
              }`}
            >
              {language === "en" ? "Storefront Gallery" : "معرض الصور"}
            </button>
            <button
              onClick={() => { setActiveTab("about"); }}
              className={`px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "about"
                  ? "bg-[#0D2D3A] text-[#FAF7EE] shadow-sm"
                  : "text-[#0D2D3A]/75 hover:bg-[#0D2D3A]/5"
              }`}
            >
              {language === "en" ? "Socotra Locations" : "فروعنا"}
            </button>
          </div>

          {/* Action Hub - Desktop */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Language Switch Pill */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center justify-center min-w-[50px] h-8 text-[11px] font-black rounded-full bg-[#B88A58]/10 text-[#0D2D3A] border border-[#B88A58]/25 hover:bg-[#B88A58]/20 transition-all duration-250 cursor-pointer shadow-sm active:scale-95 uppercase tracking-tighter"
              title={language === "en" ? "Switch to Arabic" : "التغيير للإنجليزية"}
            >
              {language === "en" ? "Ar" : "En"}
            </button>

            {/* Staff Access Gate */}
            <button
              onClick={onGoToLogin}
              className="text-[11px] px-4 py-1.5 rounded-full font-black text-[#0D2D3A] border border-[#0D2D3A]/20 hover:border-[#0D2D3A] transition-all duration-200 cursor-pointer uppercase tracking-tight"
            >
              {language === "en" ? "Staff" : "الموظفين"}
            </button>
          </div>

          {/* Mobile Menu Button Layout */}
          <div className="lg:hidden w-full flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("prepared"); setActiveCategoryFilter("all"); }}>
              <Logo size={42} />
              <div>
                <h1 className="font-display font-black text-[#0D2D3A] text-base tracking-tight leading-none uppercase">SOCOTRA COFFEE</h1>
                <p className="font-sans text-[7px] uppercase tracking-[0.15em] text-[#B88A58] font-bold mt-0.5">BEN SOCOTRA • بن سقطرى</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-[#0D2D3A] hover:bg-[#0D2D3A]/5 rounded-xl transition-all active:scale-95"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-[#0D2D3A]/40 backdrop-blur-md lg:hidden"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: language === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: language === "ar" ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed top-0 bottom-0 z-[110] w-[85%] max-w-[320px] h-[100dvh] min-h-screen bg-[#FAF7EE] shadow-[0_0_50px_rgba(0,0,0,0.2)] lg:hidden flex flex-col overflow-hidden ${
                language === "ar" ? "right-0" : "left-0"
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-6 flex items-center justify-between border-b border-[#0D2D3A]/5 bg-white/50">
                <div className="flex items-center gap-2">
                  <Logo size={32} />
                  <span className="font-display font-black text-[#0D2D3A] text-[10px] tracking-widest uppercase">Socotra Coffee</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-[#0D2D3A]/40 hover:text-[#0D2D3A] hover:bg-[#0D2D3A]/5 rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-1.5">
                {[
                  { id: "prepared", en: "Prepared Menus", ar: "قائمة المشروبات" },
                  { id: "beans", en: "Coffee Bags & Blends", ar: "حبوب البن والخلطات" },
                  { id: "blendInfos", en: "Coffee Blend Info", ar: "معلومات البن" },
                  { id: "gallery", en: "Storefront Gallery", ar: "معرض الصور" },
                  { id: "about", en: "Socotra Locations", ar: "فروع سقطرى" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setActiveCategoryFilter("all");
                      setSearchQuery("");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-black transition-all flex items-center justify-between uppercase tracking-tight group ${
                      activeTab === item.id
                        ? "bg-[#0D2D3A] text-white shadow-lg shadow-[#0D2D3A]/20"
                        : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
                    } ${language === "ar" ? "flex-row-reverse text-right" : ""}`}
                  >
                    <span>{language === "en" ? item.en : item.ar}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${activeTab === item.id ? "opacity-100" : "opacity-30"} ${language === "ar" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                  </button>
                ))}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 bg-white/80 border-t border-[#0D2D3A]/5 flex flex-col gap-3">
                <button
                  onClick={() => {
                    onToggleLanguage();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#B88A58]/10 text-[#B88A58] border border-[#B88A58]/25 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                >
                  <Globe className="h-4 w-4" />
                  {language === "en" ? "Switch to Arabic" : "التغيير للإنجليزية"}
                </button>
                <button
                  onClick={() => {
                    onGoToLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-4 rounded-2xl bg-[#0D2D3A] text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#0D2D3A]/10 active:scale-95"
                >
                  {language === "en" ? "Staff Access Portal" : "بوابة وصول الموظفين"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Core Display */}
      <main className="flex-1 w-full relative">
        
        {/* Decorative Ambient Coffee SVGs Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
          {/* Elegant background branch illustration (Top Right) */}
          <div className="absolute right-[-40px] top-[8%] w-[380px] h-[380px] opacity-[0.035] text-[#B88A58] hidden xl:block">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M 10,90 Q 35,75 50,45 C 55,38 65,15 90,10" />
              <path d="M 30,70 C 22,55 35,48 42,58 C 45,62 38,75 30,70 Z" />
              <path d="M 30,70 Q 35,61 42,58" />
              <path d="M 50,45 C 42,30 55,23 62,33 C 65,37 58,50 50,45 Z" />
              <path d="M 50,45 Q 55,36 62,33" />
              <path d="M 70,25 C 62,10 75,3 82,13 C 85,17 78,30 70,25 Z" />
              <path d="M 70,25 Q 75,16 82,13" />
              <circle cx="36" cy="65" r="2.5" />
              <circle cx="39" cy="67" r="2.1" />
              <circle cx="56" cy="40" r="2.5" />
              <circle cx="53" cy="37" r="2.1" />
            </svg>
          </div>

          {/* Cezve/Turkish Coffee Pot Line Art (Middle Left) */}
          <div className="absolute left-[-20px] top-[40%] w-[260px] h-[260px] opacity-[0.03] text-[#B88A58] hidden lg:block">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M 35,75 L 45,45 L 35,45 M 53,75 L 47,45 M 35,75 C 35,82 53,82 53,75" />
              <path d="M 46,50 L 80,38 C 82,37 84,39 83,41 L 82,43" />
              <path d="M 40,35 Q 42,25 38,18" />
              <path d="M 46,35 Q 48,27 44,20" />
            </svg>
          </div>

          {/* Delicate floating coffee beans (Top Left) */}
          <div className="absolute left-[4%] top-[12%] w-[130px] h-[130px] opacity-[0.035] text-[#B88A58] hidden md:block">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M 25,45 C 8,33 18,10 35,15 C 52,20 42,55 25,45 Z" />
              <path d="M 15,26 Q 27,31 39,36" />
              <path d="M 70,70 C 53,58 63,35 80,41 C 97,47 87,80 70,70 Z" />
              <path d="M 60,51 Q 72,56 84,61" />
            </svg>
          </div>

          {/* Chemex / Pour-over line-art (Bottom Right) */}
          <div className="absolute right-[2%] top-[65%] w-[280px] h-[280px] opacity-[0.03] text-[#B88A58] hidden lg:block">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M 35,20 L 65,20 L 58,40 L 68,75 C 70,82 30,82 32,75 L 42,40 L 35,20 Z" />
              <path d="M 42,40 L 58,40 L 56,48 L 44,48 Z" />
              <circle cx="50" cy="54" r="2" />
              <path d="M 50,56 L 47,68 M 50,56 L 53,67" />
              <circle cx="50" cy="68" r="1" fill="currentColor" />
            </svg>
          </div>
          
          {/* Coffee Mug with Saucer (Lower Left) */}
          <div className="absolute left-[3%] top-[75%] w-[240px] h-[240px] opacity-[0.03] text-[#B88A58] hidden xl:block">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M 25,40 L 75,40 L 70,70 C 68,77 32,77 30,70 L 25,40 Z" />
              <path d="M 75,46 C 81,46 84,52 84,57 C 84,62 81,65 74,65" />
              <path d="M 15,82 L 85,82" />
              <path d="M 45,32 Q 47,20 42,15 M 55,32 Q 57,20 52,15" />
            </svg>
          </div>
        </div>

        {/* PREPARED DRINKS SECTION (Beige/Cream Theme) */}
        {activeTab === "prepared" && (
          <div className="bg-[#FAF7EE] py-6 lg:py-12 transition-all duration-500">
            <div className="max-w-6xl mx-auto px-4">
              
              {/* Cover banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0D2D3A] text-[#FAF7EE] p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#B88A58]/25">
                {/* Vintage circles background */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#B88A58]/5 -translate-y-20 translate-x-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#B88A58]/5 translate-y-20 -translate-x-20 pointer-events-none" />

                {/* Cover Logo Display - Now on top in mobile */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-2 p-4 bg-[#FAF7EE]/5 rounded-2xl border border-white/10 w-full md:w-auto order-first md:order-last">
                  <Logo size={100} />
                  <div className="text-center">
                    <span className="block text-[8px] tracking-[0.3em] text-[#B88A58] font-bold uppercase">ESTD</span>
                    <span className="block text-xs font-semibold text-[#FAF7EE] font-display">SOCOTRA COFFEE</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left">
                  <span className="bg-[#B88A58]/20 text-[#B88A58] border border-[#B88A58]/25 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase inline-block">
                    {language === "en" 
                      ? (settings?.menuSubHeadingEn || "Elegantly Crafted Beverages") 
                      : (settings?.menuSubHeadingAr || "مشروبات صُنعت بكل حب وشغف")}
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                    {language === "en" 
                      ? (settings?.menuMainHeadingEn || "The Finest Hot & Cold Brews") 
                      : (settings?.menuMainHeadingAr || "أرقى المشروبات الباردة والساخنة")}
                  </h2>
                  <p className="font-sans text-sm text-[#FAF7EE]/80 leading-relaxed font-light">
                    {language === "en" 
                      ? (settings?.menuDescriptionEn || "Every cup at Socotra is a celebration of origin. Hand-pulled espresso, traditional Turkish bars, rich frappés, and vibrant refreshers aligned with our original coffee shop tables.")
                      : (settings?.menuDescriptionAr || "كل كوب في سقطرى هو احتفال بالأصالة والمذاق المميز. إسبريسو مُعد يدويًا بكل حب، ركن القهوة التركية التقليدية العريقة، مشروبات الفرابيه الغنية، والمشروبات الباردة المنعشة.")}
                  </p>
                  
                  {/* Search filter in header */}
                  <div className="pt-2 flex items-center justify-center md:justify-start">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#0D2D3A]/55" />
                      <input
                        type="text"
                        placeholder={language === "en" ? "Search coffees, matcha, desserts..." : "ابحث عن القهوة، الماتشا، الحلويات..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-[#FAF7EE] text-[#0D2D3A] font-medium border border-[#0D2D3A]/20 focus:outline-none focus:border-[#B88A58] transition-colors shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-navigation Filters with Scroll Buttons */}
              <div className="relative flex items-center mb-6">
                {/* Left Click Arrow Indicator */}
                <button
                  type="button"
                  onClick={() => scrollContainer(menuScrollRef, "left")}
                  className="flex-shrink-0 mr-2 p-2.5 bg-white hover:bg-[#FAF7EE] text-[#0D2D3A] rounded-full border border-[#0D2D3A]/10 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center hover:border-[#B88A58]/40"
                  title="Scroll Left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Scrollable Container */}
                <div
                  ref={menuScrollRef}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-2 scroll-smooth scrollbar-none -mx-2 px-1"
                >
                  {resolvedMenuCategories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategoryFilter(cat.key)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all ${
                        activeCategoryFilter === cat.key
                          ? "bg-[#0D2D3A] text-[#FAF7EE] font-semibold scale-102"
                          : "bg-white text-[#0D2D3A]/80 hover:bg-white/85 border border-[#0D2D3A]/5"
                      }`}
                    >
                      {language === "en" ? cat.label : cat.labelAr}
                    </button>
                  ))}
                </div>

                {/* Right Click Arrow Indicator */}
                <button
                  type="button"
                  onClick={() => scrollContainer(menuScrollRef, "right")}
                  className="flex-shrink-0 ml-2 p-2.5 bg-white hover:bg-[#FAF7EE] text-[#0D2D3A] rounded-full border border-[#0D2D3A]/10 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center hover:border-[#B88A58]/40"
                  title="Scroll Right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Layout Toggle - NEW - Hidden on mobile */}
              <div className="hidden md:flex items-center justify-end mb-4 gap-2 px-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#0D2D3A]/40">
                  {language === "en" ? "Layout" : "التنسيق"}
                </span>
                <div className="flex bg-white rounded-lg border border-[#0D2D3A]/10 p-1">
                  <button
                    onClick={() => setMenuLayout("grid")}
                    className={`p-1.5 rounded-md transition-all ${menuLayout === "grid" ? "bg-[#0D2D3A] text-white" : "text-[#0D2D3A]/50 hover:bg-[#0D2D3A]/5"}`}
                    title={language === "en" ? "Grid View" : "عرض شبكي"}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setMenuLayout("list")}
                    className={`p-1.5 rounded-md transition-all ${menuLayout === "list" ? "bg-[#0D2D3A] text-white" : "text-[#0D2D3A]/50 hover:bg-[#0D2D3A]/5"}`}
                    title={language === "en" ? "List View" : "عرض قائمة"}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Prepared items layout - Grouped GRID/LIST */}
              <div className={menuLayout === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" : "flex flex-col gap-4"}>
                {filteredMenus.length > 0 ? (
                  filteredMenus.map((item) => (
                    <div
                      key={item.id}
                      className={`group bg-white rounded-2xl border border-[#0D2D3A]/[0.04] hover:shadow-md transition-all duration-300 flex items-start gap-4 ${menuLayout === "grid" ? "p-5" : "p-3"}`}
                    >
                      {/* Product image option */}
                      <div className={`${menuLayout === "grid" ? "w-20 h-20" : "w-16 h-16"} bg-[#FAF7EE] rounded-xl overflow-hidden flex-shrink-0 border border-[#0D2D3A]/5 flex flex-col items-center justify-center relative`}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={language === "en" ? item.nameEn : item.nameAr}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center text-[8px] font-mono opacity-30 select-none">
                            <Coffee className="h-5 w-5 stroke-[1.2] mb-1" />
                            <span>IMAGE</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Price */}
                      <div className="flex-1 min-w-0">
                        {/* Headers */}
                        <div className="flex items-baseline justify-between gap-1.5">
                          <h3 className={`font-display font-bold text-[#0D2D3A] tracking-tight truncate ${menuLayout === "grid" ? "text-base" : "text-sm"}`}>
                            {language === "en" ? item.nameEn : (item.nameAr || item.nameEn)}
                          </h3>
                          <span className="border-b border-dotted border-[#0D2D3A]/20 flex-1 mx-2" />
                          <span className={`font-display font-bold text-[#B88A58] whitespace-nowrap ${menuLayout === "grid" ? "text-sm" : "text-xs"}`}>
                            {renderPrice(item.priceSingle, item.priceDouble)} {language === "en" ? "EGP" : "ج.م"}
                          </span>
                        </div>

                        {/* Secondary language representation */}
                        <p className={`text-[10px] text-[#0D2D3A]/50 mt-0.5 font-medium ${language === "en" ? "text-right" : "text-left"}`}>
                          {language === "en" ? item.nameAr : item.nameEn}
                        </p>

                        {/* Description block (dual adaptive) */}
                        <div className="mt-2 text-[11px] leading-relaxed text-[#0D2D3A]/60 font-light space-y-1">
                          {language === "en" ? (
                            <>
                              {item.descriptionEn && <p className="line-clamp-2">{item.descriptionEn}</p>}
                              {item.descriptionAr && (
                                <p className="text-[10px] text-[#0D2D3A]/40 italic font-normal line-clamp-1">
                                  {item.descriptionAr}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              {item.descriptionAr && <p className="line-clamp-2">{item.descriptionAr}</p>}
                              {item.descriptionEn && (
                                <p className="text-[10px] text-[#0D2D3A]/40 italic font-normal line-clamp-1">
                                  {item.descriptionEn}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Badge category tag */}
                        <div className={`${menuLayout === "grid" ? "mt-2.5" : "mt-1.5"} flex items-center justify-between`}>
                          <span className="inline-block text-[9px] uppercase font-bold tracking-wider text-[#B88A58] bg-[#FAF7EE] px-2 py-0.5 rounded-md">
                            {language === "en" 
                              ? item.category 
                              : (resolvedMenuCategories.find(c => c.key === item.category)?.labelAr || item.category)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-[#0D2D3A]/40 flex flex-col items-center justify-center">
                    <Coffee className="h-10 w-10 stroke-[1.2] mb-3 text-[#B88A58]" />
                    <p className="font-display font-medium text-lg text-[#0D2D3A]">
                      {language === "en" ? "No prepared menu items found" : "لم يتم العثور على مشروبات"}
                    </p>
                    <p className="text-xs">
                      {language === "en" 
                        ? "Try searching a different item or clear the category filters." 
                        : "حاول البحث عن اسم آخر أو قم بإعادة ضبط فئة التصفية."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COFFEE BEANS & BLENDS (Redesigned to identical cream layout as requested!) */}
        {activeTab === "beans" && (
          <div className="bg-[#FAF7EE] py-6 lg:py-12 transition-all duration-500">
            <div className="max-w-6xl mx-auto px-4">
              
              {/* Cover banner (Redesigned matching cream/navy theme!) */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0D2D3A] text-[#FAF7EE] p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#B88A58]/25">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#B88A58]/5 -translate-y-20 translate-x-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#B88A58]/5 translate-y-20 -translate-x-20 pointer-events-none" />

                {/* Cover Logo Display - Now on top in mobile */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-2 p-4 bg-[#FAF7EE]/5 rounded-2xl border border-white/10 w-full md:w-auto order-first md:order-last">
                  <Logo size={100} />
                  <div className="text-center">
                    <span className="block text-[8px] tracking-[0.3em] text-[#B88A58] font-bold uppercase">ESTD</span>
                    <span className="block text-xs font-semibold text-[#FAF7EE] font-display">SOCOTRA COFFEE</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left">
                  <span className="bg-[#B88A58]/20 text-[#B88A58] border border-[#B88A58]/25 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase inline-block">
                    {language === "en" 
                      ? (settings?.blendSubHeadingEn || "Roasted Bean Reservoirs") 
                      : (settings?.blendSubHeadingAr || "مخازن البن الفاخر المحمص")}
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                    {language === "en" 
                      ? (settings?.blendMainHeadingEn || "Coffee Beans & Blends") 
                      : (settings?.blendMainHeadingAr || "حبوب البن والخلطات")}
                  </h2>
                  <p className="font-sans text-sm text-[#FAF7EE]/80 leading-relaxed font-light">
                    {language === "en" 
                      ? (settings?.blendDescriptionEn || "Our select roasted varieties, sorted into Plain, Spiced, Espresso, and Single Origins. Available in whole bean or custom ground to order, priced by Kilo (كيلو), Quarter (ربع - 250g), and Eighth (ثمن - 125g).")
                      : (settings?.blendDescriptionAr || "أجود أنواع البن المحمص بعناية، تشمل البن السادة والمحوّج وحبوب الإسبريسو والبن أحادي المصدر. متوفرة كحبوب كاملة أو مطحونة خصيصاً لتناسب طريقة تحضيركم المفضلة.")}
                  </p>
                  
                  {/* Search in header */}
                  <div className="pt-2 flex items-center justify-center md:justify-start">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#0D2D3A]/55" />
                      <input
                        type="text"
                        placeholder={language === "en" ? "Search plain, spiced, single origin..." : "ابحث عن بن سادة، بن محوج، حبوب اسبريسو..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-[#FAF7EE] text-[#0D2D3A] font-medium border border-[#0D2D3A]/20 focus:outline-none focus:border-[#B88A58] transition-colors shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-navigation Filters with Scroll Buttons */}
              <div className="relative flex items-center mb-6">
                {/* Left Click Arrow Indicator */}
                <button
                  type="button"
                  onClick={() => scrollContainer(blendScrollRef, "left")}
                  className="flex-shrink-0 mr-2 p-2.5 bg-white hover:bg-[#FAF7EE] text-[#0D2D3A] rounded-full border border-[#0D2D3A]/10 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center hover:border-[#B88A58]/40"
                  title="Scroll Left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Scrollable Container */}
                <div
                  ref={blendScrollRef}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-2 scroll-smooth scrollbar-none -mx-2 px-1"
                >
                  {resolvedBlendCategories.map((cat2) => (
                    <button
                      key={cat2.key}
                      onClick={() => setActiveCategoryFilter(cat2.key)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all ${
                        activeCategoryFilter === cat2.key
                          ? "bg-[#0D2D3A] text-[#FAF7EE] font-semibold scale-102"
                          : "bg-white text-[#0D2D3A]/80 hover:bg-white/85 border border-[#0D2D3A]/5"
                      }`}
                    >
                      {language === "en" ? cat2.label : cat2.labelAr}
                    </button>
                  ))}
                </div>

                {/* Right Click Arrow Indicator */}
                <button
                  type="button"
                  onClick={() => scrollContainer(blendScrollRef, "right")}
                  className="flex-shrink-0 ml-2 p-2.5 bg-white hover:bg-[#FAF7EE] text-[#0D2D3A] rounded-full border border-[#0D2D3A]/10 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center hover:border-[#B88A58]/40"
                  title="Scroll Right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Layout Toggle - NEW - Hidden on mobile */}
              <div className="hidden md:flex items-center justify-end mb-4 gap-2 px-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#0D2D3A]/40">
                  {language === "en" ? "Layout" : "التنسيق"}
                </span>
                <div className="flex bg-white rounded-lg border border-[#0D2D3A]/10 p-1">
                  <button
                    onClick={() => setBlendLayout("grid")}
                    className={`p-1.5 rounded-md transition-all ${blendLayout === "grid" ? "bg-[#0D2D3A] text-white" : "text-[#0D2D3A]/50 hover:bg-[#0D2D3A]/5"}`}
                    title={language === "en" ? "Grid View" : "عرض شبكي"}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setBlendLayout("list")}
                    className={`p-1.5 rounded-md transition-all ${blendLayout === "list" ? "bg-[#0D2D3A] text-white" : "text-[#0D2D3A]/50 hover:bg-[#0D2D3A]/5"}`}
                    title={language === "en" ? "List View" : "عرض قائمة"}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Blends Grid/List */}
              <div className={blendLayout === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "flex flex-col gap-6"}>
                {filteredBlends.length > 0 ? (
                  filteredBlends.map((blend) => (
                    <div
                      key={blend.id}
                      className={`group bg-white rounded-2xl border border-[#0D2D3A]/[0.04] hover:shadow-md transition-all duration-300 flex flex-col gap-4 ${blendLayout === "grid" ? "p-5 md:flex-row" : "p-4 sm:flex-row"}`}
                    >
                      {/* Product image option */}
                      <div className={`${blendLayout === "grid" ? "w-full md:w-28 h-28" : "w-20 h-20 sm:w-24 sm:h-24"} bg-[#FAF7EE] rounded-xl overflow-hidden flex-shrink-0 border border-[#0D2D3A]/5 flex flex-col items-center justify-center relative mx-auto md:mx-0 sm:mx-0`}>
                        {blend.imageUrl ? (
                          <img
                            src={blend.imageUrl}
                            alt={language === "en" ? blend.nameEn : blend.nameAr}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center text-[8px] font-mono opacity-30 select-none">
                            <Coffee className="h-6 w-6 stroke-[1.2] mb-1" />
                            <span>BAG CANVAS</span>
                          </div>
                        )}
                      </div>

                      {/* Details and Pricing Table */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          {/* Titles */}
                          <div className="flex items-start justify-between gap-1.5 flex-wrap">
                            <div>
                              <h4 className={`font-display font-bold text-[#0D2D3A] tracking-wide ${blendLayout === "grid" ? "text-base" : "text-sm"}`}>
                                {language === "en" ? blend.nameEn : (blend.nameAr || blend.nameEn)}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="inline-block text-[8px] uppercase tracking-widest text-[#B88A58] bg-[#FAF7EE] px-1.5 py-0.5 rounded font-bold">
                                  {language === "en" ? blend.category : (blend.categoryAr || blend.category)}
                                </span>
                                {blendInfos && blendInfos.some(bi => bi.blendId === blend.id) && (
                                  <button
                                    onClick={() => handleViewBlendInfo(blend.id)}
                                    className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider font-extrabold text-[#B88A58] bg-[#B88A58]/10 hover:bg-[#B88A58]/20 px-2 py-0.5 rounded transition-all cursor-pointer hover:scale-105 active:scale-95"
                                    title={language === "en" ? "View Blend Info" : "عرض معلومات هذا البن"}
                                  >
                                    <BookOpen className="h-2.5 w-2.5" />
                                    <span>{language === "en" ? "Blend Info" : "معلومات البن"}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <h4 className={`font-semibold text-[#0D2D3A] leading-tight ${blendLayout === "grid" ? "text-sm" : "text-xs"}`}>
                                {language === "en" ? blend.nameAr : blend.nameEn}
                              </h4>
                              <span className="text-[10px] text-[#0D2D3A]/50 font-normal">
                                {language === "en" ? blend.categoryAr : blend.category}
                              </span>
                            </div>
                          </div>

                          {/* Descriptions */}
                          {(blend.descriptionEn || blend.descriptionAr) && (
                            <div className="mt-3 text-[11px] leading-relaxed text-[#0D2D3A]/60 font-light space-y-1">
                              {language === "en" ? (
                                <>
                                  {blend.descriptionEn && <p className="line-clamp-2">{blend.descriptionEn}</p>}
                                  {blend.descriptionAr && (
                                    <p className="text-[10px] text-[#0D2D3A]/40 italic font-normal line-clamp-1 text-right">
                                      {blend.descriptionAr}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  {blend.descriptionAr && <p className="line-clamp-2">{blend.descriptionAr}</p>}
                                  {blend.descriptionEn && (
                                    <p className="text-[10px] text-[#0D2D3A]/40 italic font-normal line-clamp-1 text-left">
                                      {blend.descriptionEn}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3-Column weights pricing display */}
                        <div className={`mt-4 pt-3 border-t border-[#0D2D3A]/10 grid grid-cols-3 gap-2 text-center ${blendLayout === "list" ? "sm:mt-2" : ""}`}>
                          <div className="bg-[#FAF7EE] p-1.5 rounded-lg border border-[#0D2D3A]/5">
                            <span className="block text-[8px] opacity-60 text-[#0D2D3A] font-semibold">
                              {language === "en" ? "1 KILO" : "كيلو كامل"}
                            </span>
                            <span className="block text-[#0D2D3A] font-bold text-[11px] mt-0.5">
                              {blend.priceKilo ? `${blend.priceKilo} ${language === "en" ? "EGP" : "ج.م"}` : "-"}
                            </span>
                          </div>
                          <div className="bg-[#FAF7EE] p-1.5 rounded-lg border border-[#0D2D3A]/5">
                            <span className="block text-[8px] opacity-60 text-[#0D2D3A] font-semibold">
                              {language === "en" ? "1/4 KILO" : "ربع كيلو"}
                            </span>
                            <span className="block text-[#0D2D3A] font-bold text-[11px] mt-0.5">
                              {blend.priceQuarter ? `${blend.priceQuarter} ${language === "en" ? "EGP" : "ج.م"}` : "-"}
                            </span>
                          </div>
                          <div className="bg-[#FAF7EE] p-1.5 rounded-lg border border-[#0D2D3A]/5">
                            <span className="block text-[8px] opacity-60 text-[#0D2D3A] font-semibold">
                              {language === "en" ? "1/8 KILO" : "ثمن كيلو"}
                            </span>
                            <span className="block text-[#0D2D3A] font-bold text-[11px] mt-0.5">
                              {blend.priceEighth ? `${blend.priceEighth} ${language === "en" ? "EGP" : "ج.م"}` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center text-[#0D2D3A]/40 flex flex-col items-center justify-center">
                    <Coffee className="h-10 w-10 stroke-[1.2] mb-3 text-[#B88A58]" />
                    <p className="font-display font-medium text-lg text-[#0D2D3A]">
                      {language === "en" ? "No coffee bags & blends found" : "لم يتم العثور على حبوب بن أو خلطات"}
                    </p>
                    <p className="text-xs">
                      {language === "en" 
                        ? "Adjust search query or check the filters." 
                        : "يرجى تعديل كلمة البحث أو تصفية فئات البن."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GALLARY SECTION (Cream Theme with Grid Cards - New Section added from Admin Panel) */}
        {activeTab === "gallery" && (
          <div className="bg-[#FAF7EE] py-6 lg:py-12 transition-all duration-500">
            <div className="max-w-6xl mx-auto px-4">
              
              {/* Header block with PDF aesthetic */}
              <div className="text-center py-6 border-b border-[#0D2D3A]/10 space-y-4 mb-10 max-w-xl mx-auto flex flex-col items-center">
                <Logo size={100} />
                <div>
                  <h2 className="font-display text-4xl font-bold tracking-tight text-[#0D2D3A]">
                    {language === "en" ? "Socotra Gallery" : "معرض بن سقطرى"}
                  </h2>
                  <h3 className="text-[#B88A58] font-sans font-semibold text-lg tracking-widest leading-none mt-1">
                    {language === "en" ? "MOMENTS & BEANS GALLERY" : "معرض الصور والفيديوهات"}
                  </h3>
                </div>
                <p className="text-xs text-[#0D2D3A]/60 leading-relaxed font-light">
                  {language === "en"
                    ? "A visual tour across our physical Al Shorouk locations, fresh roasted blends, hand-pulled brewing lines, and our premium coffee bean bags."
                    : "جولة بصرية تفاعلية تستعرض جودة حبوب البن الفاخرة، لحظات التحضير المتقنة، وفروعنا المتميزة."}
                </p>
              </div>

              {/* Dynamic Photo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {(sortedGallery && sortedGallery.length > 0) ? (
                   sortedGallery.map((img, index) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxIndex(index)}
                      className="group bg-white p-3.5 rounded-2xl border border-[#0D2D3A]/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      {/* Image container */}
                      <div className="aspect-[4/3] w-full bg-[#FAF7EE] rounded-xl overflow-hidden border border-[#0D2D3A]/5 relative">
                        {img.imageUrl ? (
                          <img
                            src={img.imageUrl}
                            alt={img.titleEn}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D2D3A]/5 text-[#0D2D3A]/30">
                            <Play className="h-12 w-12 text-[#B88A58] mb-1.5 fill-[#B88A58]/10" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">{language === "en" ? "Play Video" : "تشغيل الفيديو"}</span>
                          </div>
                        )}

                        {/* If video/youtube type, show nice badges */}
                        {img.mediaType && img.mediaType !== "image" && (
                          <div className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-xs text-white z-10 flex items-center justify-center shadow-md">
                            {img.mediaType === "youtube" ? (
                              <Play className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                            ) : (
                              <Video className="h-3.5 w-3.5 text-sky-400" />
                            )}
                          </div>
                        )}

                        {/* Elegant Hover Overlay (Labels shown only on hover) */}
                        <div className="absolute inset-0 bg-[#0D2D3A]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                          <h4 className="font-display font-bold text-base text-[#FAF7EE] tracking-tight">
                            {language === "en" ? img.titleEn : img.titleAr}
                          </h4>
                          <p className="font-semibold text-xs text-[#B88A58] mt-1.5">
                            {language === "en" ? img.titleAr : img.titleEn}
                          </p>
                          <span className="text-[10px] text-white/85 bg-[#B88A58] px-3.5 py-1.5 rounded-full mt-4 flex items-center gap-1.5 font-sans font-extrabold tracking-wider uppercase shadow-xs">
                            {img.mediaType === "youtube" || img.mediaType === "video" ? (
                              <>
                                <Play className="h-3 w-3 fill-white" /> {language === "en" ? "Play Video" : "عرض الفيديو"}
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" /> {language === "en" ? "View Photo" : "رؤية الصورة"}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center text-[#0D2D3A]/40 flex flex-col items-center justify-center bg-white rounded-3xl p-8 border border-[#0D2D3A]/5">
                    <Sparkles className="h-10 w-10 stroke-[1.2] mb-3 text-[#B88A58]/80 animate-bounce" />
                    <p className="font-display font-medium text-lg text-[#0D2D3A]">No gallery photos uploaded yet</p>
                    <p className="text-xs">Staff can add physical store catalog photos from the admin panel.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* COFFEE BLEND STORIES & INTERACTIVE CARDS */}
        {activeTab === "blendInfos" && (
          <div className="bg-[#FAF7EE] py-6 lg:py-12 transition-all duration-500">
            <div className="max-w-6xl mx-auto px-4">
              
              {/* Header block with elegant display typography */}
              <div className="text-center py-6 border-b border-[#0D2D3A]/10 space-y-4 mb-10 max-w-2xl mx-auto flex flex-col items-center">
                <Logo size={100} />
                <div>
                  <h2 className="font-display text-4xl font-bold tracking-tight text-[#0D2D3A]">
                    {language === "en" ? "Coffee Blend Info" : "معلومات خلطات البن"}
                  </h2>
                  <h3 className="text-[#B88A58] font-sans font-semibold text-sm tracking-widest leading-none mt-2 uppercase">
                    {language === "en" ? "Interactive Story & Info" : "معلومات وقصص سلالات قهوة سقطرى"}
                  </h3>
                </div>
                <p className="text-xs text-[#0D2D3A]/60 leading-relaxed font-light">
                  {language === "en" 
                    ? "Explore the precise geography, growth altitudes, micro-climate processing, and tasting notes of our premium signature blends."
                    : "اكتشف الجغرافيا الدقيقة لزارعة البن، وارتفاعات النمو الشاهقة، وطرق المعالجة الفريدة والإيحاءات والنكهات لكل خلطة."}
                </p>
              </div>

              {/* Big boxes/cards layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedBlendInfos.length > 0 ? (
                  sortedBlendInfos.map((bi) => {
                    const matchedBlend = blends.find(b => b.id === bi.blendId);
                    return (
                      <div
                        key={bi.id}
                        id={`blend-info-card-${bi.blendId}`}
                        className="bg-white rounded-3xl overflow-hidden border border-[#0D2D3A]/10 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative scroll-mt-24"
                      >
                        {/* Compact hero header image */}
                        {bi.imageUrl ? (
                          <div className="h-32 w-full bg-[#FAF7EE] overflow-hidden relative border-b border-[#0D2D3A]/5">
                            <img
                              src={bi.imageUrl}
                              alt={bi.nameEn}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                            {/* Gradient overlay for text contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                            
                            {/* Floating brand title in image */}
                            <div className="absolute bottom-3 left-4 right-4 text-white" dir="ltr">
                              <span className="text-[8px] uppercase font-bold tracking-wider text-[#B88A58] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                                {matchedBlend ? matchedBlend.category : "SOCOTRA BLEND"}
                              </span>
                              <h3 className="font-display font-bold text-lg text-white mt-1 drop-shadow-md">
                                {language === "en" ? bi.nameEn : bi.nameAr}
                              </h3>
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 w-full bg-[#0D2D3A] text-[#FAF7EE] flex flex-col items-center justify-center p-4 relative">
                            <Coffee className="h-8 w-8 text-[#B88A58] mb-1.5 opacity-80" />
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#B88A58]">No Cover Uploaded</span>
                            <h3 className="font-display font-bold text-base text-white mt-1.5">
                              {language === "en" ? bi.nameEn : bi.nameAr}
                            </h3>
                          </div>
                        )}

                        {/* Interactive Metadata Grid */}
                        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            {/* Multi-language title description block */}
                            <div>
                              <div className={`flex items-center justify-between gap-3 flex-wrap pb-2 border-b border-[#0D2D3A]/5 ${language === "ar" ? "flex-row-reverse" : ""}`}>
                                <h4 className="font-display font-bold text-[#0D2D3A] text-sm">
                                  {language === "en" ? bi.nameEn : bi.nameAr}
                                </h4>
                                <span className="text-[10px] text-[#FAF7EE] bg-[#0D2D3A] px-2 py-0.5 rounded-full font-bold">
                                  {matchedBlend ? (language === "en" ? matchedBlend.nameAr : matchedBlend.nameEn) : ""}
                                </span>
                              </div>
                            </div>

                            {/* Bento metadata fields */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {bi.originEn && (
                                <div className="bg-[#FAF7EE] p-2 rounded-xl border border-[#0D2D3A]/5 flex gap-2">
                                  <Globe className="h-3.5 w-3.5 text-[#B88A58] flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="block font-bold text-[9px] text-[#0D2D3A]/50 uppercase tracking-wider">
                                      {language === "en" ? "Country / Origin" : "بلد المنشأ"}
                                    </span>
                                    <span className="font-semibold text-[#0D2D3A] text-[11px] mt-0.5 block leading-tight">
                                      {language === "en" ? bi.originEn : bi.originAr}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {bi.processEn && (
                                <div className="bg-[#FAF7EE] p-2 rounded-xl border border-[#0D2D3A]/5 flex gap-2">
                                  <Compass className="h-3.5 w-3.5 text-[#B88A58] flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="block font-bold text-[9px] text-[#0D2D3A]/50 uppercase tracking-wider">
                                      {language === "en" ? "Processing Style" : "نوع المعالجة"}
                                    </span>
                                    <span className="font-semibold text-[#0D2D3A] text-[11px] mt-0.5 block leading-tight">
                                      {language === "en" ? bi.processEn : bi.processAr}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {bi.roastLevelEn && (
                                <div className="bg-[#FAF7EE] p-2 rounded-xl border border-[#0D2D3A]/5 flex gap-2">
                                  <Award className="h-3.5 w-3.5 text-[#B88A58] flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="block font-bold text-[9px] text-[#0D2D3A]/50 uppercase tracking-wider">
                                      {language === "en" ? "Roasting Profile" : "درجة التحميص"}
                                    </span>
                                    <span className="font-semibold text-[#0D2D3A] text-[11px] mt-0.5 block leading-tight">
                                      {language === "en" ? bi.roastLevelEn : bi.roastLevelAr}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {bi.altitudeEn && (
                                <div className="bg-[#FAF7EE] p-2 rounded-xl border border-[#0D2D3A]/5 flex gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-[#B88A58] flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="block font-bold text-[9px] text-[#0D2D3A]/50 uppercase tracking-wider">
                                      {language === "en" ? "Growth Altitude" : "ارتفاع النمو"}
                                    </span>
                                    <span className="font-semibold text-[#0D2D3A] text-[11px] mt-0.5 block font-mono leading-tight">
                                      {language === "en" ? bi.altitudeEn : bi.altitudeAr}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tasting notes block */}
                            {bi.notesEn && (
                              <div className="bg-[#FAF7EE]/50 border border-amber-200/40 p-3 rounded-xl space-y-1">
                                <span className="text-[9px] font-bold text-[#B88A58] uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  {language === "en" ? "Tasting & Flavor Notes" : "نكهات وإيحاءات الفنجان"}
                                </span>
                                <p className="text-xs font-semibold text-[#0D2D3A]">
                                  {language === "en" ? bi.notesEn : bi.notesAr}
                                </p>
                              </div>
                            )}

                            {/* The core descriptive narrative story of this coffee blend */}
                            <div className="space-y-2 pt-2">
                              <span className="block font-bold text-[10px] text-[#0D2D3A]/55 uppercase tracking-wide">
                                {language === "en" ? "Our Master Roaster's Story" : "رواية وقصة خبير التحميص"}
                              </span>
                              <div className="relative">
                                <p className="text-xs leading-relaxed text-[#0D2D3A]/75 font-light italic line-clamp-3">
                                  "{language === "en" ? bi.descriptionEn : bi.descriptionAr}"
                                </p>
                                <button
                                  onClick={() => setSelectedBlendInfo(bi)}
                                  className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#B88A58] hover:text-[#0D2D3A] transition-colors uppercase tracking-widest group/btn"
                                >
                                  {language === "en" ? "More Info" : "المزيد من التفاصيل"}
                                  <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Matching public price reference */}
                          {matchedBlend && (
                            <div className="mt-6 pt-4 border-t border-[#0D2D3A]/5 flex items-center justify-between text-xs">
                              <span className="text-[#0D2D3A]/55 font-semibold">
                                {language === "en" ? "Starts from" : "تبدأ الأسعار من"}
                              </span>
                              <span className="font-bold text-[#B88A58] text-sm font-mono">
                                {matchedBlend.priceEighth || matchedBlend.priceQuarter || matchedBlend.priceKilo} {language === "en" ? "EGP" : "ج.م"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 text-center text-[#0D2D3A]/40 flex flex-col items-center justify-center bg-white rounded-3xl p-10 border border-[#0D2D3A]/5">
                    <BookOpen className="h-12 w-12 stroke-[1.2] mb-3 text-[#B88A58]/70 animate-bounce" />
                    <p className="font-display font-medium text-lg text-[#0D2D3A]">
                      {language === "en" ? "Coffee stories are currently roasting" : "قصص وحكايات البن قيد التحضير"}
                    </p>
                    <p className="text-xs max-w-sm mx-auto mt-1">
                      {language === "en" 
                        ? "We're compiling exquisite geographical details for our signature blends. Stay tuned!" 
                        : "نقوم بصياغة تفاصيل جغرافية وقصصية رائعة لخلطاتنا المميزة. ترقبونا قريباً!"}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SOCOTRA LOCATIONS & CUSTOM CHIC ABOUT PAGE (Page 8 Theme) */}
        {activeTab === "about" && (
          <div className="bg-[#FAF7EE] py-6 lg:py-16 text-[#0D2D3A]">
            <div className="max-w-4xl mx-auto px-4 text-center space-y-10">
              <div className="space-y-4">
                <Logo size={100} />
                <h2 className="font-display text-4xl font-bold tracking-tight text-[#0D2D3A]">
                  Socotra Locations
                </h2>
                <h3 className="text-[#B88A58] font-sans font-semibold text-lg tracking-widest leading-none mt-1">
                  فروع بن سقطرى
                </h3>
              </div>

              {/* Physical Locations Cards - Grid improves to 2 columns on medium+ to follow user request */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 justify-center items-stretch max-w-5xl mx-auto">
                {(settings?.locations && settings.locations.length > 0 ? settings.locations : [
                  { id: "l-1", nameEn: "Vivinz Mall", nameAr: "فيفينز مول - الدور الأول", addressEn: "Al Shorouk City, Cairo Governorate, Egypt", addressAr: "مدينة الشروق، محافظة القاهرة، مصر", isPrimary: true },
                  { id: "l-2", nameEn: "Valio Mall", nameAr: "فاليو مول - الدور الأرضي", addressEn: "Al Shorouk City, Cairo Governorate, Egypt", addressAr: "مدينة الشروق، محافظة القاهرة، مصر", isPrimary: false }
                ]).map((loc, idx, arr) => {
                  const name = language === "en" ? loc.nameEn : loc.nameAr;
                  const address = language === "en" ? loc.addressEn : loc.addressAr;
                  const isPrimary = idx === 0;
                  
                  // Label translation
                  const badgeLabel = isPrimary 
                    ? (language === "en" ? "Primary Location • Active Location" : "الموقع الرئيسي • مفتوح للجمهور")
                    : (language === "en" ? `Location ${idx + 1} • Active Location` : `الفرع ${idx + 1} • مفتوح للجمهور`);

                  return (
                    <div 
                      key={loc.id || idx} 
                      className={`bg-white p-8 rounded-[2.5rem] border border-[#0D2D3A]/10 space-y-6 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between group ${arr.length === 1 ? "md:col-span-2" : ""}`}
                    >
                      <div className="space-y-6">
                        <div className="w-16 h-16 bg-[#FAF7EE] rounded-3xl flex items-center justify-center mx-auto text-[#0D2D3A] group-hover:bg-[#0D2D3A] group-hover:text-white transition-colors duration-500">
                          <MapPin className="h-7 w-7" />
                        </div>
                        <div className="text-center">
                          <h4 className="font-display font-bold text-2xl text-[#0D2D3A] tracking-tight">
                            {language === "en" ? name.split(" - ")[0] : name}
                          </h4>
                          {name.includes(" - ") && language === "en" && (
                            <p className="text-sm font-semibold text-[#B88A58] mt-1 uppercase tracking-widest">
                              {name.split(" - ")[1]}
                            </p>
                          )}
                          <p className="text-sm text-[#0D2D3A]/60 mt-4 leading-relaxed max-w-[200px] mx-auto">{address}</p>
                        </div>
                      </div>
                      <span className="inline-block mt-6 text-[10px] font-black text-[#B88A58] uppercase tracking-[0.2em] bg-[#FAF7EE] px-5 py-2 rounded-full text-center border border-[#B88A58]/10 group-hover:bg-[#B88A58]/5 transition-colors">
                        {badgeLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Contact Details - Restructured into Two Columns with Primary/Support logic */}
              <div className="bg-[#0D2D3A] text-[#FAF7EE] p-10 md:p-14 rounded-[3rem] space-y-10 border border-[#B88A58]/20 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B88A58]/5 rounded-full -translate-y-32 translate-x-32" />
                
                <div className="relative z-10 text-center space-y-2">
                  <h4 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                    {language === "en" ? "Direct Operations Desk" : "مكتب العمليات المباشرة"}
                  </h4>
                  <div className="h-1 w-12 bg-[#B88A58] mx-auto rounded-full" />
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Column: Phones */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                      <Phone className="h-5 w-5 text-[#B88A58]" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">
                        {language === "en" ? "Primary number :" : "الرقم الأساسي :"}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Primary Phone */}
                      <a href={`tel:${displayPhones[0].replace(/\s+/g, "")}`} className="block text-2xl md:text-3xl font-black text-[#B88A58] hover:text-white transition-colors tracking-tight">
                        {displayPhones[0]}
                      </a>

                      {/* Support Phones */}
                      {displayPhones.length > 1 && (
                        <div className="pt-4 space-y-3">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            {language === "en" ? "Other Support Numbers" : "أرقام الدعم الأخرى"}
                          </span>
                          <div className="flex flex-col gap-2">
                            {displayPhones.slice(1).map((phone, idx) => (
                              <a key={idx} href={`tel:${phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-[#B88A58] transition-colors">
                                <Phone className="h-3.5 w-3.5" /> {phone}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Emails */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                      <Mail className="h-5 w-5 text-[#B88A58]" />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">
                        {language === "en" ? "Primary email :" : "البريد الأساسي :"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Primary Email */}
                      <a href={`mailto:${displayEmails[0]}`} className="block text-lg md:text-xl font-bold text-white hover:text-[#B88A58] transition-colors break-all">
                        {displayEmails[0]}
                      </a>

                      {/* Support Emails */}
                      {displayEmails.length > 1 && (
                        <div className="pt-4 space-y-3">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            {language === "en" ? "Support Mailbox" : "صندوق بريد الدعم"}
                          </span>
                          <div className="flex flex-col gap-2">
                            {displayEmails.slice(1).map((email, idx) => (
                              <a key={idx} href={`mailto:${email}`} className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-[#B88A58] transition-colors">
                                <Mail className="h-3.5 w-3.5" /> {email}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-8 border-t border-white/5 text-center">
                  <p className="text-xs text-[#FAF7EE]/40 max-w-sm mx-auto font-medium italic">
                    {noteText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic Lightbox Image Slider Modal */}
      {lightboxIndex !== null && sortedGallery && sortedGallery.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 selection:bg-[#B88A58]/30">
          
          {/* Top panel bar */}
          <div className="flex items-center justify-between text-white/80 max-w-7xl mx-auto w-full pt-4 px-4">
            <div className="flex items-center gap-3">
              <div className="scale-45 w-10 h-10 flex items-center justify-center">
                <Logo size={80} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs tracking-wider uppercase text-[#B88A58]">Socotra Gallery</h4>
                <p className="text-[10px] opacity-65">{lightboxIndex + 1} of {sortedGallery.length}</p>
              </div>
            </div>
            
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white hover:scale-105 cursor-pointer"
              title="Close Slider"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Core picture and arrows block */}
          <div className="flex-1 flex items-center justify-between gap-4 max-w-7xl mx-auto w-full px-2">
            
            {/* Left slider button */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null ? (prev - 1 + sortedGallery.length) % sortedGallery.length : null))}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white hover:scale-110 cursor-pointer flex-shrink-0"
              title="Previous Item"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Media Core slide */}
            <div className="relative flex-1 h-[65vh] w-full flex items-center justify-center overflow-hidden">
              {sortedGallery[lightboxIndex].mediaType === "youtube" ? (
                <iframe
                  key={sortedGallery[lightboxIndex].id}
                  src={getYouTubeEmbedUrl(sortedGallery[lightboxIndex].videoUrl)}
                  title={sortedGallery[lightboxIndex].titleEn}
                  className="w-full max-w-3xl aspect-video rounded-2xl border border-white/10 shadow-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : sortedGallery[lightboxIndex].mediaType === "video" ? (
                <video
                  key={sortedGallery[lightboxIndex].id}
                  src={sortedGallery[lightboxIndex].videoUrl}
                  poster={sortedGallery[lightboxIndex].imageUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[60vh] rounded-2xl shadow-2xl border border-white/10 bg-black"
                />
              ) : (
                <motion.img
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={sortedGallery[lightboxIndex].imageUrl}
                  alt={sortedGallery[lightboxIndex].titleEn}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/5"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Right slider button */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null ? (prev + 1) % sortedGallery.length : null))}
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white hover:scale-110 cursor-pointer flex-shrink-0"
              title="Next Item"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

          </div>

          {/* Bottom active titles display */}
          <div className="text-center pb-8 px-4 max-w-2xl mx-auto w-full">
            <h3 className="font-display font-bold text-lg text-white tracking-wide">
              {language === "en" ? sortedGallery[lightboxIndex].titleEn : sortedGallery[lightboxIndex].titleAr}
            </h3>
            <p className="font-semibold text-sm text-[#B88A58] mt-1">
              {language === "en" ? sortedGallery[lightboxIndex].titleAr : sortedGallery[lightboxIndex].titleEn}
            </p>
          </div>

        </div>
      )}

      {/* Detailed Blend Info Modal - NEW */}
      <AnimatePresence>
        {selectedBlendInfo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBlendInfo(null)}
              className="absolute inset-0 bg-[#0D2D3A]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#FAF7EE] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedBlendInfo(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/40 text-[#0D2D3A] rounded-full backdrop-blur-sm transition-all active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Image Section */}
              <div className="w-full md:w-5/12 h-48 md:h-auto relative bg-[#0D2D3A]">
                {selectedBlendInfo.imageUrl ? (
                  <img
                    src={selectedBlendInfo.imageUrl}
                    alt={selectedBlendInfo.nameEn}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-[#B88A58]/40">
                    <Coffee className="h-16 w-16 mb-4" />
                    <Logo size={80} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D3A] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#FAF7EE]/10" />
              </div>

              {/* Modal Content Section */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8">
                <div className="space-y-2">
                  <span className="inline-block text-[10px] font-bold text-[#B88A58] uppercase tracking-[0.2em] bg-[#B88A58]/10 px-3 py-1 rounded-full">
                    {language === "en" ? "Detailed Blend Profile" : "تفاصيل خلطة البن المميزة"}
                  </span>
                  <h2 className="font-display text-3xl font-bold text-[#0D2D3A] tracking-tight">
                    {language === "en" ? selectedBlendInfo.nameEn : selectedBlendInfo.nameAr}
                  </h2>
                  <p className="text-[#0D2D3A]/50 text-sm font-medium">
                    {language === "en" ? selectedBlendInfo.nameAr : selectedBlendInfo.nameEn}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Detailed Description */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-[#0D2D3A] uppercase tracking-wider">
                      <BookOpen className="h-4 w-4 text-[#B88A58]" />
                      {language === "en" ? "The Full Story" : "القصة الكاملة"}
                    </h4>
                    <p className="text-sm leading-relaxed text-[#0D2D3A]/80 font-light italic bg-white/50 p-4 rounded-2xl border border-[#0D2D3A]/5">
                      "{language === "en" ? selectedBlendInfo.descriptionEn : selectedBlendInfo.descriptionAr}"
                    </p>
                  </div>

                  {/* Metadata Bento Grid in Modal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-[#0D2D3A]/5 space-y-2">
                      <span className="flex items-center gap-2 text-[10px] font-bold text-[#B88A58] uppercase tracking-wider">
                        <Globe className="h-3.5 w-3.5" />
                        {language === "en" ? "Origin" : "المنشأ"}
                      </span>
                      <p className="text-sm font-semibold text-[#0D2D3A]">
                        {language === "en" ? selectedBlendInfo.originEn : selectedBlendInfo.originAr}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-[#0D2D3A]/5 space-y-2">
                      <span className="flex items-center gap-2 text-[10px] font-bold text-[#B88A58] uppercase tracking-wider">
                        <Compass className="h-3.5 w-3.5" />
                        {language === "en" ? "Processing" : "المعالجة"}
                      </span>
                      <p className="text-sm font-semibold text-[#0D2D3A]">
                        {language === "en" ? selectedBlendInfo.processEn : selectedBlendInfo.processAr}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-[#0D2D3A]/5 space-y-2">
                      <span className="flex items-center gap-2 text-[10px] font-bold text-[#B88A58] uppercase tracking-wider">
                        <Award className="h-3.5 w-3.5" />
                        {language === "en" ? "Roast" : "التحميص"}
                      </span>
                      <p className="text-sm font-semibold text-[#0D2D3A]">
                        {language === "en" ? selectedBlendInfo.roastLevelEn : selectedBlendInfo.roastLevelAr}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-[#0D2D3A]/5 space-y-2">
                      <span className="flex items-center gap-2 text-[10px] font-bold text-[#B88A58] uppercase tracking-wider">
                        <MapPin className="h-3.5 w-3.5" />
                        {language === "en" ? "Altitude" : "الارتفاع"}
                      </span>
                      <p className="text-sm font-semibold text-[#0D2D3A] font-mono">
                        {language === "en" ? selectedBlendInfo.altitudeEn : selectedBlendInfo.altitudeAr}
                      </p>
                    </div>
                  </div>

                  {/* Flavor Notes */}
                  {(selectedBlendInfo.notesEn || selectedBlendInfo.notesAr) && (
                    <div className="bg-[#B88A58]/10 p-5 rounded-2xl border border-[#B88A58]/20 space-y-3">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-[#B88A58] uppercase tracking-wider">
                        <Sparkles className="h-4 w-4" />
                        {language === "en" ? "Flavor Profile & Notes" : "نكهات وإيحاءات الفنجان"}
                      </h4>
                      <p className="text-base font-bold text-[#0D2D3A] leading-tight">
                        {language === "en" ? selectedBlendInfo.notesEn : selectedBlendInfo.notesAr}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[#0D2D3A]/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Logo size={40} />
                    <span className="text-[10px] font-bold text-[#0D2D3A]/40 uppercase tracking-widest">Socotra Signature</span>
                  </div>
                  <button
                    onClick={() => setSelectedBlendInfo(null)}
                    className="px-6 py-2 bg-[#0D2D3A] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#B88A58] transition-colors"
                  >
                    {language === "en" ? "Close Detail" : "إغلاق"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Aesthetic Footer */}
      <footer className="bg-[#0D2D3A] text-white text-xs border-t border-[#B88A58]/10 py-6 text-center space-y-2">
        <p className="text-[#FAF7EE]/40 font-mono">SOCOTRA COFFEE • © 2026 • بن سقطرى</p>

      </footer>
    </div>
  );
}
