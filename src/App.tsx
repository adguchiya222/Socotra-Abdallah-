import React, { useState, useEffect } from "react";
import { CoffeeBlend, MenuItem, MenuCategory, BlendCategory, GalleryItem, BlendInfo, StoreSettings } from "./types";
import Storefront from "./components/Storefront";
import AdminPanel from "./components/AdminPanel";
import { Coffee, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"storefront" | "login" | "admin">("storefront");
  
  // Data State
  const [blends, setBlends] = useState<CoffeeBlend[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [blendCategories, setBlendCategories] = useState<BlendCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [blendInfos, setBlendInfos] = useState<BlendInfo[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Language state (en = English, ar = Arabic)
  const [language, setLanguage] = useState<"en" | "ar">(() => {
    return (localStorage.getItem("socotra_language") as "en" | "ar") || "en";
  });

  const handleToggleLanguage = () => {
    const nextLang = language === "en" ? "ar" : "en";
    setLanguage(nextLang);
    localStorage.setItem("socotra_language", nextLang);
  };

  // Authentication credentials states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Check LocalStorage on boot to sustain session
  useEffect(() => {
    const adminSession = localStorage.getItem("socotra_admin_session");
    if (adminSession === "true") {
      setIsLoggedIn(true);
    }
    fetchData();
  }, []);

  // Fetch all products dynamically from Full-Stack Express Server API
  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [blendsRes, menusRes, menuCatsRes, blendCatsRes, galleryRes, blendInfosRes, settingsRes] = await Promise.all([
        fetch("/api/blends"),
        fetch("/api/menus"),
        fetch("/api/categories/menus"),
        fetch("/api/categories/blends"),
        fetch("/api/gallery"),
        fetch("/api/blend-infos"),
        fetch("/api/settings")
      ]);

      if (blendsRes && blendsRes.ok) {
        const blendsData = await blendsRes.json();
        const sorted = [...(blendsData || [])].map((x, idx) => ({
          ...x,
          sortOrder: typeof x.sortOrder === "number" ? x.sortOrder : idx
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        const sanitized = sorted.map((x, idx) => ({
          ...x,
          sortOrder: idx
        }));
        setBlends(sanitized);
      }
      if (menusRes && menusRes.ok) {
        const menusData = await menusRes.json();
        const sorted = [...(menusData || [])].map((x, idx) => ({
          ...x,
          sortOrder: typeof x.sortOrder === "number" ? x.sortOrder : idx
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        const sanitized = sorted.map((x, idx) => ({
          ...x,
          sortOrder: idx
        }));
        setMenus(sanitized);
      }
      if (menuCatsRes && menuCatsRes.ok) {
        const menuCatsData = await menuCatsRes.json();
        setMenuCategories(menuCatsData || []);
      }
      if (blendCatsRes && blendCatsRes.ok) {
        const blendCatsData = await blendCatsRes.json();
        setBlendCategories(blendCatsData || []);
      }
      if (galleryRes && galleryRes.ok) {
        const galleryData = await galleryRes.json();
        const sorted = [...(galleryData || [])].map((x, idx) => ({
          ...x,
          sortOrder: typeof x.sortOrder === "number" ? x.sortOrder : idx
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        const sanitized = sorted.map((x, idx) => ({
          ...x,
          sortOrder: idx
        }));
        setGallery(sanitized);
      }
      if (blendInfosRes && blendInfosRes.ok) {
        const blendInfosData = await blendInfosRes.json();
        const sorted = [...(blendInfosData || [])].map((x, idx) => ({
          ...x,
          sortOrder: typeof x.sortOrder === "number" ? x.sortOrder : idx
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        const sanitized = sorted.map((x, idx) => ({
          ...x,
          sortOrder: idx
        }));
        setBlendInfos(sanitized);
      }
      if (settingsRes && settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error("Failed to connect to express server context:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Admin Authorization
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("socotra_admin_session", "true");
        setIsLoggedIn(true);
        setView("admin");
        setEmail("");
        setPassword("");
      } else {
        setLoginError(data.message || "Authentication rejected.");
      }
    } catch (err) {
      setLoginError("Failed to authenticate. Server appears offline.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("socotra_admin_session");
    setIsLoggedIn(false);
    setView("storefront");
  };

  // Blends CRUD operations
  const handleAddBlend = async (item: Omit<CoffeeBlend, "id">) => {
    const response = await fetch("/api/blends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Add blend failed");
    }
  };

  const handleUpdateBlend = async (id: string, item: Partial<CoffeeBlend>) => {
    const response = await fetch(`/api/blends/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Update blend failed");
    }
  };

  const handleDeleteBlend = async (id: string) => {
    const response = await fetch(`/api/blends/${id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Delete blend failed");
    }
  };

  // Menus (Prepared item) CRUD operations
  const handleAddMenu = async (item: Omit<MenuItem, "id">) => {
    const response = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Add menu item failed");
    }
  };

  const handleUpdateMenu = async (id: string, item: Partial<MenuItem>) => {
    const response = await fetch(`/api/menus/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Update menu item failed");
    }
  };

  const handleDeleteMenu = async (id: string) => {
    const response = await fetch(`/api/menus/${id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Delete menu item failed");
    }
  };

  // BlendInfo CRUD operations
  const handleAddBlendInfo = async (info: Omit<BlendInfo, "id">) => {
    const response = await fetch("/api/blend-infos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Add blend info failed");
    }
  };

  const handleUpdateBlendInfo = async (id: string, info: Partial<BlendInfo>) => {
    const response = await fetch(`/api/blend-infos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Update blend info failed");
    }
  };

  const handleDeleteBlendInfo = async (id: string) => {
    const response = await fetch(`/api/blend-infos/${id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Delete blend info failed");
    }
  };

  const handleUpdateSettings = async (payload: StoreSettings) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      await fetchData(true);
    } else {
      throw new Error("Update settings failed");
    }
  };

  const handleBulkReorder = async (type: "menus" | "blends" | "gallery" | "blendInfos", orders: { id: string, sortOrder: number }[]) => {
    const orderMap = new Map(orders.map(o => [o.id, Number(o.sortOrder)]));
    if (type === "menus") {
      setMenus(prev => {
        const next = prev.map(item => orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id)! } : item);
        return [...next].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
    } else if (type === "blends") {
      setBlends(prev => {
        const next = prev.map(item => orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id)! } : item);
        return [...next].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
    } else if (type === "gallery") {
      setGallery(prev => {
        const next = prev.map(item => orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id)! } : item);
        return [...next].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
    } else if (type === "blendInfos") {
      setBlendInfos(prev => {
        const next = prev.map(item => orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id)! } : item);
        return [...next].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
    }

    try {
      const response = await fetch("/api/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orders })
      });
      if (!response.ok) {
        throw new Error("Bulk reorder failed");
      }
    } catch (err) {
      console.error(err);
      await fetchData(true);
    }
  };

  // Render Loader screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7EE] flex flex-col items-center justify-center p-4">
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border-4 border-[#0D2D3A]/25 border-t-[#0D2D3A] rounded-full animate-spin flex items-center justify-center">
            <Coffee className="h-6 w-6 text-[#0D2D3A] animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-medium text-lg text-[#0D2D3A] tracking-wider">SOCOTRA COFFEE</h3>
            <p className="text-xs text-[#0D2D3A]/60 font-medium">Booting digital storefront catalogue...</p>
          </div>
        </div>
      </div>
    );
  }

  // Active Screen Routing switch board
  switch (view) {
    case "admin":
      if (!isLoggedIn) {
        setView("login");
        return null;
      }
      return (
        <AdminPanel
          blends={blends}
          menus={menus}
          menuCategories={menuCategories}
          blendCategories={blendCategories}
          gallery={gallery}
          blendInfos={blendInfos}
          settings={settings || undefined}
          onAddBlend={handleAddBlend}
          onUpdateBlend={handleUpdateBlend}
          onDeleteBlend={handleDeleteBlend}
          onAddMenu={handleAddMenu}
          onUpdateMenu={handleUpdateMenu}
          onDeleteMenu={handleDeleteMenu}
          onAddBlendInfo={handleAddBlendInfo}
          onUpdateBlendInfo={handleUpdateBlendInfo}
          onDeleteBlendInfo={handleDeleteBlendInfo}
          onUpdateSettings={handleUpdateSettings}
          onBulkReorder={handleBulkReorder}
          onLogout={handleLogout}
          onRefreshData={() => fetchData(true)}
          language={language}
          onToggleLanguage={handleToggleLanguage}
        />
      );

    case "login":
      return (
        <div className="min-h-screen bg-[#FAF7EE] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#B88A58] selection:text-white">
          
          {/* Back trigger */}
          <button
            onClick={() => setView("storefront")}
            className="absolute top-6 left-6 text-xs font-semibold text-[#0D2D3A] hover:text-[#B88A58] bg-white border border-[#0D2D3A]/15 px-4 py-2 rounded-full transition-all shadow-sm"
          >
            ← View Digital Storefront
          </button>

          {/* Form wrapper */}
          <div className="max-w-md w-full bg-white border border-[#0D2D3A]/10 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#B88A58]/5 rounded-full blur-2xl" />
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#B88A58]/10 text-[#B88A58] border border-[#B88A58]/20 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="font-bold text-xl text-[#0D2D3A] uppercase tracking-wider">Staff Credentials</h2>
              <p className="text-xs text-[#0D2D3A]/60">Authenticate to manage Socotra coffee cards & listings</p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl font-medium leading-relaxed">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-medium text-[#0D2D3A]">
              <div>
                <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#0D2D3A]/50" />
                  <input
                    type="email"
                    required
                    placeholder="Socotra@admin.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-[#0D2D3A]/15 rounded-xl pl-10 pr-4 py-3 text-[#0D2D3A] placeholder-[#0D2D3A]/30 focus:outline-none focus:border-[#B88A58] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-[#0D2D3A]/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="coffeadmin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-[#0D2D3A]/15 rounded-xl pl-10 pr-10 py-3 text-[#0D2D3A] placeholder-[#0D2D3A]/30 focus:outline-none focus:border-[#B88A58] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-[#0D2D3A]/60 hover:text-[#0D2D3A]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Login Help Panel */}
              <div className="p-3 bg-[#FAF7EE] border border-[#0D2D3A]/5 rounded-xl text-[11px] text-[#0D2D3A]/80 leading-relaxed text-center">
                <span>Default secure handles:</span>
                <div className="font-mono text-[#B88A58] font-bold mt-1">
                  Email: Socotra@admin.com • Password: coffeadmin
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#0D2D3A] hover:bg-[#0D2D3A]/90 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider transition-colors shadow-md"
              >
                {loginLoading ? "Authorizing..." : "Login to Console"}
              </button>
            </form>
          </div>
        </div>
      );

    case "storefront":
    default:
      return (
        <Storefront
          blends={blends}
          menus={menus}
          menuCategories={menuCategories}
          blendCategories={blendCategories}
          gallery={gallery}
          blendInfos={blendInfos}
          settings={settings || undefined}
          onGoToLogin={() => {
            if (isLoggedIn) {
              setView("admin");
            } else {
              setView("login");
            }
          }}
          language={language}
          onToggleLanguage={handleToggleLanguage}
        />
      );
  }
}
