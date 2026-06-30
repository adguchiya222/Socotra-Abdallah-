import React, { useState, useMemo } from "react";
import { CoffeeBlend, MenuItem, MenuCategory, BlendCategory, GalleryItem, BlendInfo, StoreSettings, StoreLocation } from "../types";
import {
  LogOut,
  Coffee,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  Edit3,
  FileText,
  Search,
  Upload,
  Layers,
  Sparkles,
  Database,
  Eye,
  Image as ImageIcon,
  Info,
  BookOpen,
  Globe,
  Award,
  Compass,
  Video,
  Play,
  Settings,
  Phone,
  Mail,
  MapPin,
  X
} from "lucide-react";
import Logo from "./Logo";
import {
  DndContext,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  as?: any;
  key?: React.Key;
}

const SortableItemContext = React.createContext<{
  attributes: any;
  listeners: any;
} | null>(null);

const SortableItem = ({ id, children, className, as: Component = "div" }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 100 : undefined,
    position: 'relative' as const,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Component ref={setNodeRef} style={style} className={className}>
      <SortableItemContext.Provider value={{ attributes, listeners }}>
        {children}
      </SortableItemContext.Provider>
    </Component>
  );
};

interface AdminPanelProps {
  blends: CoffeeBlend[];
  menus: MenuItem[];
  menuCategories: MenuCategory[];
  blendCategories: BlendCategory[];
  gallery: GalleryItem[];
  blendInfos: BlendInfo[];
  settings?: StoreSettings;
  onAddBlend: (item: Omit<CoffeeBlend, "id">) => Promise<any>;
  onUpdateBlend: (id: string, item: Partial<CoffeeBlend>) => Promise<any>;
  onDeleteBlend: (id: string) => Promise<any>;
  onAddMenu: (item: Omit<MenuItem, "id">) => Promise<any>;
  onUpdateMenu: (id: string, item: Partial<MenuItem>) => Promise<any>;
  onDeleteMenu: (id: string) => Promise<any>;
  onAddBlendInfo: (item: Omit<BlendInfo, "id">) => Promise<any>;
  onUpdateBlendInfo: (id: string, item: Partial<BlendInfo>) => Promise<any>;
  onDeleteBlendInfo: (id: string) => Promise<any>;
  onUpdateSettings: (settings: StoreSettings) => Promise<any>;
  onBulkReorder: (type: "menus" | "blends" | "gallery" | "blendInfos", orders: { id: string, sortOrder: number }[]) => Promise<any>;
  onLogout: () => void;
  onRefreshData: () => Promise<any>;
  language: "en" | "ar";
  onToggleLanguage: () => void;
}

export default function AdminPanel({
  blends,
  menus,
  menuCategories,
  blendCategories,
  gallery,
  blendInfos = [],
  settings,
  onAddBlend,
  onUpdateBlend,
  onDeleteBlend,
  onAddMenu,
  onUpdateMenu,
  onDeleteMenu,
  onAddBlendInfo,
  onUpdateBlendInfo,
  onDeleteBlendInfo,
  onUpdateSettings,
  onBulkReorder,
  onLogout,
  onRefreshData,
  language,
  onToggleLanguage,
}: AdminPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [adminTab, setAdminTab] = useState<"menus" | "blends" | "categories" | "gallery" | "blendInfos" | "settings">("menus");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Filters the core lists for tabular lists in panel
  const filterList = (items: any[] = []) => {
    const query = searchQuery.toLowerCase().trim();
    return (items || []).filter(item => {
      if (!item) return false;
      const nEn = (item.nameEn || "").toLowerCase();
      const nAr = (item.nameAr || "").toLowerCase();
      const dEn = (item.descriptionEn || "").toLowerCase();
      const dAr = (item.descriptionAr || "").toLowerCase();

      const matchesSearch = 
        !query || 
        nEn.includes(query) || 
        nAr.includes(query) || 
        dEn.includes(query) || 
        dAr.includes(query);

      if (categoryFilter === "all") return matchesSearch;
      return item.category === categoryFilter && matchesSearch;
    });
  };

  const processedMenus = useMemo(() => {
    return filterList(menus || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [menus, searchQuery, categoryFilter]);

  const processedBlends = useMemo(() => {
    return filterList(blends || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [blends, searchQuery, categoryFilter]);

  const sortedGallery = useMemo(() => {
    return [...(gallery || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [gallery]);

  const sortedBlendInfos = useMemo(() => {
    return [...(blendInfos || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [blendInfos]);


  const handleDragEndGeneric = async (
    event: DragEndEvent,
    items: any[],
    type: "menus" | "blends" | "gallery" | "blendInfos"
  ) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      
      const newVisibleItems = arrayMove(items, oldIndex, newIndex);
      
      // Slot-preserving reorder logic:
      // We collect the existing sort orders from the visible items and re-assign them to the new sequence.
      const sortOrderPool = items.map((item, idx) => item.sortOrder ?? idx).sort((a, b) => a - b);

      const ordersToUpdate = newVisibleItems.map((item, index) => {
        const assignedOrder = sortOrderPool[index];
        return { id: item.id, sortOrder: assignedOrder };
      });

      try {
        await onBulkReorder(type, ordersToUpdate);
      } catch (err) {
        console.error("Drag reorder failed", err);
        setErrorText(language === "en" ? "Failed to reorder items." : "فشل في إعادة ترتيب العناصر.");
      }
    }
  };

  const handleDragEndMenu = (event: DragEndEvent) => handleDragEndGeneric(event, processedMenus, "menus");
  const handleDragEndBlend = (event: DragEndEvent) => handleDragEndGeneric(event, processedBlends, "blends");
  const handleDragEndGallery = (event: DragEndEvent) => handleDragEndGeneric(event, sortedGallery, "gallery");
  const handleDragEndBlendInfo = (event: DragEndEvent) => handleDragEndGeneric(event, sortedBlendInfos, "blendInfos");

  // Editing / Adding Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Core Catalog Form State
  const [formNameEn, setFormNameEn] = useState("");
  const [formNameAr, setFormNameAr] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCategoryAr, setFormCategoryAr] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formDescAr, setFormDescAr] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");

  // Weight pricing states for Blends
  const [formPriceKilo, setFormPriceKilo] = useState("");
  const [formPriceQuarter, setFormPriceQuarter] = useState("");
  const [formPriceEighth, setFormPriceEighth] = useState("");
  
  // Single/Double cup pricing states for Menus
  const [formPriceSingle, setFormPriceSingle] = useState("");
  const [formPriceDouble, setFormPriceDouble] = useState("");

  // Store Settings Form State
  const [settingsPhones, setSettingsPhones] = useState<string[]>([]);
  const [settingsEmails, setSettingsEmails] = useState<string[]>([]);
  const [settingsLocations, setSettingsLocations] = useState<StoreLocation[]>([]);
  const [settingsWholesaleEn, setSettingsWholesaleEn] = useState("");
  const [settingsWholesaleAr, setSettingsWholesaleAr] = useState("");
  
  // Page Content States
  const [menuMainHeadingEn, setMenuMainHeadingEn] = useState("");
  const [menuMainHeadingAr, setMenuMainHeadingAr] = useState("");
  const [menuSubHeadingEn, setMenuSubHeadingEn] = useState("");
  const [menuSubHeadingAr, setMenuSubHeadingAr] = useState("");
  const [menuDescriptionEn, setMenuDescriptionEn] = useState("");
  const [menuDescriptionAr, setMenuDescriptionAr] = useState("");

  const [blendMainHeadingEn, setBlendMainHeadingEn] = useState("");
  const [blendMainHeadingAr, setBlendMainHeadingAr] = useState("");
  const [blendSubHeadingEn, setBlendSubHeadingEn] = useState("");
  const [blendSubHeadingAr, setBlendSubHeadingAr] = useState("");
  const [blendDescriptionEn, setBlendDescriptionEn] = useState("");
  const [blendDescriptionAr, setBlendDescriptionAr] = useState("");

  const [isMenuContentModalOpen, setIsMenuContentModalOpen] = useState(false);
  const [isBlendContentModalOpen, setIsBlendContentModalOpen] = useState(false);

  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");
  const [settingsSaveLoading, setSettingsSaveLoading] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setSettingsPhones(settings.contactPhones || []);
      setSettingsEmails(settings.contactEmails || []);
      setSettingsLocations(settings.locations || []);
      setSettingsWholesaleEn(settings.wholesaleNoteEn || "");
      setSettingsWholesaleAr(settings.wholesaleNoteAr || "");
      
      setMenuMainHeadingEn(settings.menuMainHeadingEn || "The Finest Hot & Cold Brews");
      setMenuMainHeadingAr(settings.menuMainHeadingAr || "أرقى أنواع المشروبات الساخنة والباردة");
      setMenuSubHeadingEn(settings.menuSubHeadingEn || "Elegantly Crafted Beverages");
      setMenuSubHeadingAr(settings.menuSubHeadingAr || "مشروبات مُعدة بأناقة");
      setMenuDescriptionEn(settings.menuDescriptionEn || "Every cup at Socotra is a celebration of origin. Hand-pulled espresso, traditional Turkish bars, rich frappés, and vibrant refreshers aligned with our original coffee shop tables.");
      setMenuDescriptionAr(settings.menuDescriptionAr || "كل كوب في سقطرى هو احتفال بالأصالة والمذاق المميز. إسبريسو مُعد يدويًا بكل حب، ركن القهوة التركية التقليدية العريقة، مشروبات الفرابيه الغنية، والمشروبات الباردة المنعشة.");

      setBlendMainHeadingEn(settings.blendMainHeadingEn || "Coffee Beans & Blends");
      setBlendMainHeadingAr(settings.blendMainHeadingAr || "حبوب البن والخلطات");
      setBlendSubHeadingEn(settings.blendSubHeadingEn || "Roasted Bean Reservoirs");
      setBlendSubHeadingAr(settings.blendSubHeadingAr || "مخزون البن المحمص");
      setBlendDescriptionEn(settings.blendDescriptionEn || "Our select roasted varieties, sorted into Plain, Spiced, Espresso, and Single Origins. Available in whole bean or custom ground to order, priced by Kilo (كيلو), Quarter (ربع - 250g), and Eighth (ثمن - 125g).");
      setBlendDescriptionAr(settings.blendDescriptionAr || "أجود أنواع البن المحمص بعناية، تشمل البن السادة والمحوّج وحبوب الإسبريسو والبن أحادي المصدر. متوفرة كحبوب كاملة أو مطحونة خصيصاً لتناسب طريقة تحضيركم المفضلة.");
    }
  }, [settings]);

  // Category Manager Form Fields & Modals
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatLabelAr, setNewCatLabelAr] = useState("");
  const [newCatType, setNewCatType] = useState<"menu" | "blend">("menu");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleOpenAddCategory = (type: "menu" | "blend" = "menu") => {
    setEditingCatId(null);
    setNewCatLabel("");
    setNewCatLabelAr("");
    setNewCatType(type);
    setIsCategoryModalOpen(true);
  };

  const handleStartEditCategory = (cat: any, type: "menu" | "blend") => {
    setEditingCatId(cat.id);
    setNewCatLabel(cat.label);
    setNewCatLabelAr(cat.labelAr);
    setNewCatType(type);
    setIsCategoryModalOpen(true);
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setNewCatLabel("");
    setNewCatLabelAr("");
    setIsCategoryModalOpen(false);
  };

  // Gallery Manager Form Fields & Modals
  const [newGalleryTitleEn, setNewGalleryTitleEn] = useState("");
  const [newGalleryTitleAr, setNewGalleryTitleAr] = useState("");
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState("");
  const [newGalleryMediaType, setNewGalleryMediaType] = useState<"image" | "video" | "youtube">("image");
  const [newGalleryVideoUrl, setNewGalleryVideoUrl] = useState("");
  const [newGallerySortOrder, setNewGallerySortOrder] = useState<number>(0);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const handleOpenAddGallery = () => {
    setEditingGalleryId(null);
    setNewGalleryTitleEn("");
    setNewGalleryTitleAr("");
    setNewGalleryImageUrl("");
    setNewGalleryMediaType("image");
    setNewGalleryVideoUrl("");
    setNewGallerySortOrder(0);
    setIsGalleryModalOpen(true);
  };

  const handleStartEditGallery = (item: any) => {
    setEditingGalleryId(item.id);
    setNewGalleryTitleEn(item.titleEn);
    setNewGalleryTitleAr(item.titleAr);
    setNewGalleryImageUrl(item.imageUrl || "");
    setNewGalleryMediaType(item.mediaType || "image");
    setNewGalleryVideoUrl(item.videoUrl || "");
    setNewGallerySortOrder(item.sortOrder || 0);
    setIsGalleryModalOpen(true);
  };

  const handleCancelEditGallery = () => {
    setEditingGalleryId(null);
    setNewGalleryTitleEn("");
    setNewGalleryTitleAr("");
    setNewGalleryImageUrl("");
    setNewGalleryMediaType("image");
    setNewGalleryVideoUrl("");
    setNewGallerySortOrder(0);
    setIsGalleryModalOpen(false);
  };

  // Blend Info Manager Form & Modal Fields
  const [showBiModal, setShowBiModal] = useState(false);
  const [biModalMode, setBiModalMode] = useState<"add" | "edit">("add");
  const [editingBiId, setEditingBiId] = useState<string | null>(null);

  const [biBlendId, setBiBlendId] = useState("");
  const [biNameEn, setBiNameEn] = useState("");
  const [biNameAr, setBiNameAr] = useState("");
  const [biImageUrl, setBiImageUrl] = useState("");
  const [biOriginEn, setBiOriginEn] = useState("");
  const [biOriginAr, setBiOriginAr] = useState("");
  const [biProcessEn, setBiProcessEn] = useState("");
  const [biProcessAr, setBiProcessAr] = useState("");
  const [biRoastLevelEn, setBiRoastLevelEn] = useState("");
  const [biRoastLevelAr, setBiRoastLevelAr] = useState("");
  const [biAltitudeEn, setBiAltitudeEn] = useState("");
  const [biAltitudeAr, setBiAltitudeAr] = useState("");
  const [biNotesEn, setBiNotesEn] = useState("");
  const [biNotesAr, setBiNotesAr] = useState("");
  const [biDescEn, setBiDescEn] = useState("");
  const [biDescAr, setBiDescAr] = useState("");

  // Status Indicators
  const [actionLoading, setActionLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const triggerDeleteConfirmation = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmDeleteModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Automatically dismiss status alerts after 3 seconds for success, 4 seconds for error
  React.useEffect(() => {
    if (successText) {
      const timer = setTimeout(() => {
        setSuccessText("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successText]);

  React.useEffect(() => {
    if (errorText) {
      const timer = setTimeout(() => {
        setErrorText("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorText]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccessMessage("");
    setSettingsSaveLoading(true);
    try {
      await onUpdateSettings({
        contactPhones: settingsPhones,
        contactEmails: settingsEmails,
        locations: settingsLocations,
        wholesaleNoteEn: settingsWholesaleEn,
        wholesaleNoteAr: settingsWholesaleAr,
        menuMainHeadingEn: menuMainHeadingEn,
        menuMainHeadingAr: menuMainHeadingAr,
        menuSubHeadingEn: menuSubHeadingEn,
        menuSubHeadingAr: menuSubHeadingAr,
        menuDescriptionEn: menuDescriptionEn,
        menuDescriptionAr: menuDescriptionAr,
        blendMainHeadingEn: blendMainHeadingEn,
        blendMainHeadingAr: blendMainHeadingAr,
        blendSubHeadingEn: blendSubHeadingEn,
        blendSubHeadingAr: blendSubHeadingAr,
        blendDescriptionEn: blendDescriptionEn,
        blendDescriptionAr: blendDescriptionAr
      });
      setSettingsSuccessMessage(language === "en" ? "Store and contact settings updated successfully!" : "تم تحديث إعدادات المتجر والتواصل بنجاح!");
      setTimeout(() => setSettingsSuccessMessage(""), 5000);
      setIsMenuContentModalOpen(false);
      setIsBlendContentModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorText(language === "en" ? "Failed to save settings" : "فشل حفظ الإعدادات");
    } finally {
      setSettingsSaveLoading(false);
    }
  };

  // Base64 Reader helper
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "product" | "gallery" | "blendInfo") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorText(
          language === "en"
            ? "File size is too large. Please select a graphic below 2MB."
            : "حجم الملف كبير جداً. يرجى اختيار صورة أقل من 2 ميجابايت."
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (target === "product") {
            setFormImageUrl(reader.result);
          } else if (target === "blendInfo") {
            setBiImageUrl(reader.result);
          } else {
            setGalleryFormImage(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const setGalleryFormImage = (base64: string) => {
    setNewGalleryImageUrl(base64);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        setErrorText(
          language === "en"
            ? "Video size is too large. Please select a clip below 30MB."
            : "حجم الفيديو كبير جداً. يرجى اختيار ملف أقل من 30 ميجابايت."
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewGalleryVideoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-populate Arabic category dynamic matches
  const handleCategorySelectionChange = (catName: string) => {
    setFormCategory(catName);
    if (adminTab === "menus") {
      const matched = menuCategories.find(c => c.key === catName);
      if (matched) setFormCategoryAr(matched.labelAr);
    } else {
      const matched = blendCategories.find(c => c.key === catName);
      if (matched) setFormCategoryAr(matched.labelAr);
    }
  };

  // Open modal for Adding
  const handleOpenAdd = () => {
    setModalMode("add");
    setEditingItemId(null);
    setErrorText("");
    setSuccessText("");
    
    // Clear all fields
    setFormNameEn("");
    setFormNameAr("");
    setFormCategory("");
    setFormCategoryAr("");
    setFormDescEn("");
    setFormDescAr("");
    setFormImageUrl("");
    
    // Clear prices
    setFormPriceKilo("");
    setFormPriceQuarter("");
    setFormPriceEighth("");
    setFormPriceSingle("");
    setFormPriceDouble("");
    
    setShowModal(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (item: any) => {
    setModalMode("edit");
    setEditingItemId(item.id);
    setErrorText("");
    setSuccessText("");

    setFormNameEn(item.nameEn);
    setFormNameAr(item.nameAr);
    setFormCategory(item.category);
    setFormCategoryAr(item.categoryAr || "");
    setFormDescEn(item.descriptionEn || "");
    setFormDescAr(item.descriptionAr || "");
    setFormImageUrl(item.imageUrl || "");

    if (adminTab === "blends") {
      setFormPriceKilo(item.priceKilo ? String(item.priceKilo) : "");
      setFormPriceQuarter(item.priceQuarter ? String(item.priceQuarter) : "");
      setFormPriceEighth(item.priceEighth ? String(item.priceEighth) : "");
      
      setFormPriceSingle("");
      setFormPriceDouble("");
    } else {
      setFormPriceSingle(item.priceSingle ? String(item.priceSingle) : "");
      setFormPriceDouble(item.priceDouble ? String(item.priceDouble) : "");
      
      setFormPriceKilo("");
      setFormPriceQuarter("");
      setFormPriceEighth("");
    }

    setShowModal(true);
  };

  // Create or Update form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      if (!formCategory) {
        throw new Error("Please select an item category.");
      }

      if (adminTab === "blends") {
        const blendPayload = {
          nameEn: formNameEn.trim(),
          nameAr: formNameAr.trim(),
          category: formCategory,
          categoryAr: formCategoryAr || "بن",
          descriptionEn: formDescEn.trim(),
          descriptionAr: formDescAr.trim(),
          imageUrl: formImageUrl,
          priceKilo: formPriceKilo ? Number(formPriceKilo) : undefined,
          priceQuarter: formPriceQuarter ? Number(formPriceQuarter) : undefined,
          priceEighth: formPriceEighth ? Number(formPriceEighth) : undefined,
        };

        if (modalMode === "add") {
          await onAddBlend(blendPayload);
          setSuccessText("Blend created successfully!");
        } else if (editingItemId) {
          await onUpdateBlend(editingItemId, blendPayload);
          setSuccessText("Blend updated successfully!");
        }
      } else {
        const menuPayload = {
          nameEn: formNameEn.trim(),
          nameAr: formNameAr.trim(),
          category: formCategory,
          categoryAr: formCategoryAr || "عام",
          descriptionEn: formDescEn.trim(),
          descriptionAr: formDescAr.trim(),
          imageUrl: formImageUrl,
          priceSingle: formPriceSingle ? Number(formPriceSingle) : undefined,
          priceDouble: formPriceDouble ? Number(formPriceDouble) : undefined,
        };

        if (modalMode === "add") {
          await onAddMenu(menuPayload);
          setSuccessText("Menu drink added successfully!");
        } else if (editingItemId) {
          await onUpdateMenu(editingItemId, menuPayload);
          setSuccessText("Menu drink updated successfully!");
        }
      }

      setTimeout(() => {
        setShowModal(false);
        onRefreshData();
      }, 1000);

    } catch (err: any) {
      setErrorText(err.message || "An error occurred compiling form parameters.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Item Deletions
  const handleDeleteItem = (id: string, name: string) => {
    triggerDeleteConfirmation(
      language === "en" ? "Confirm Product Deletion" : "تأكيد حذف المنتج",
      language === "en"
        ? `Are you sure you want to permanently delete '${name}'? This action is irreversible and will remove the item from the storefront.`
        : `هل أنت متأكد من رغبتك في حذف المنتج '${name}' نهائياً؟ هذا الإجراء غير قابل للتراجع وسيتم إزالة المنتج من معروض المتجر.`,
      async () => {
        setActionLoading(true);
        setErrorText("");
        setSuccessText("");

        try {
          if (adminTab === "blends") {
            await onDeleteBlend(id);
            setSuccessText(
              language === "en" ? "Coffee blend deleted successfully!" : "تم حذف خلطة البن بنجاح!"
            );
          } else {
            await onDeleteMenu(id);
            setSuccessText(
              language === "en" ? "Menu drink deleted successfully!" : "تم حذف المشروب بنجاح!"
            );
          }
          await onRefreshData();
        } catch (err: any) {
          setErrorText(
            language === "en"
              ? "Failed to safely delete product coordinates."
              : "فشل حذف المنتج من قاعدة البيانات."
          );
        } finally {
          setActionLoading(false);
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    );
  };

  // Add/Edit Category Handler
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel || !newCatLabelAr) {
      setErrorText("Category labels in English and Arabic are both required.");
      return;
    }

    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      if (editingCatId) {
        const endpoint = newCatType === "menu" 
          ? `/api/categories/menus/${editingCatId}` 
          : `/api/categories/blends/${editingCatId}`;
        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newCatLabel, labelAr: newCatLabelAr })
        });

        const resJson = await response.json();
        if (!response.ok) {
          throw new Error(resJson.message || "Endpoint error updating category.");
        }

        setSuccessText(`Category updated to '${newCatLabel}' successfully!`);
        handleCancelEditCategory();
        await onRefreshData();
      } else {
        const endpoint = newCatType === "menu" ? "/api/categories/menus" : "/api/categories/blends";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: newCatLabel, labelAr: newCatLabelAr })
        });

        const resJson = await response.json();
        if (!response.ok) {
          throw new Error(resJson.message || "Endpoint error registering new catalog category.");
        }

        setSuccessText(`Category '${newCatLabel}' registered successfully!`);
        setNewCatLabel("");
        setNewCatLabelAr("");
        setIsCategoryModalOpen(false);
        await onRefreshData();
      }
    } catch (err: any) {
      setErrorText(err.message || "Failed to finalize category changes.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = (key: string, type: "menu" | "blend") => {
    if (key === "General") {
      setErrorText(
        language === "en"
          ? "Default 'General' category cannot be deleted."
          : "لا يمكن حذف الفئة الافتراضية 'العامة'."
      );
      return;
    }

    triggerDeleteConfirmation(
      language === "en" ? "Confirm Category Deletion" : "تأكيد حذف الفئة",
      language === "en"
        ? `Are you sure you want to delete category '${key}'? Any active products currently assigned to this category will automatically be safetied and moved to the default 'General' tag.`
        : `هل أنت متأكد من رغبتك في حذف فئة '${key}'؟ أي منتجات نشطة مخصصة حالياً لهذه الفئة سيتم نقلها تلقائياً وبأمان إلى فئة 'العامة' الافتراضية.`,
      async () => {
        setActionLoading(true);
        setErrorText("");
        setSuccessText("");

        try {
          const endpoint = type === "menu" ? `/api/categories/menus/${key}` : `/api/categories/blends/${key}`;
          const response = await fetch(endpoint, {
            method: "DELETE"
          });

          const resJson = await response.json();
          if (!response.ok) {
            throw new Error(resJson.message || "Failed to remove category safely.");
          }

          setSuccessText(
            language === "en"
              ? (resJson.message || `Category deleted. Associated products reassigned to 'General'.`)
              : "تم حذف الفئة بنجاح، وإعادة تخصيص المنتجات المرتبطة بها للفئة 'العامة'."
          );
          await onRefreshData();
        } catch (err: any) {
          setErrorText(
            language === "en"
              ? (err.message || "Category deletion rejected.")
              : "فشل في عملية حذف الفئة."
          );
        } finally {
          setActionLoading(false);
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    );
  };

  // Add/Edit Gallery Handler
  const handleAddGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isImage = newGalleryMediaType === "image";
    if (isImage && !newGalleryImageUrl) {
      setErrorText(
        language === "en"
          ? "An image file upload or cover image is required for photo entries."
          : "يرجى تحميل صورة أو رفع ملف غلاف أولاً للمدخلات الصورية."
      );
      return;
    }
    if (!isImage && !newGalleryVideoUrl) {
      setErrorText(
        language === "en"
          ? "A video link or YouTube embed link is required."
          : "يرجى تزويدنا برابط الفيديو أو رابط اليوتيوب المباشر."
      );
      return;
    }

    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const url = editingGalleryId ? `/api/gallery/${editingGalleryId}` : "/api/gallery";
      const method = editingGalleryId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn: newGalleryTitleEn || (isImage ? "Gallery Photo" : "Gallery Video"),
          titleAr: newGalleryTitleAr || (isImage ? "صورة لمعرض الصور" : "فيديو لمعرض الصور"),
          imageUrl: newGalleryImageUrl,
          mediaType: newGalleryMediaType,
          videoUrl: newGalleryVideoUrl,
          sortOrder: Number(newGallerySortOrder) || 0
        })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || "Could not publish gallery node.");
      }

      setSuccessText(
        editingGalleryId
          ? (language === "en" ? "Gallery item successfully updated!" : "تم تحديث عنصر المعرض بنجاح!")
          : (language === "en" ? "Gallery item successfully published!" : "تم نشر عنصر المعرض بنجاح!")
      );
      
      // Reset form fields
      setNewGalleryTitleEn("");
      setNewGalleryTitleAr("");
      setNewGalleryImageUrl("");
      setNewGalleryMediaType("image");
      setNewGalleryVideoUrl("");
      setNewGallerySortOrder(0);
      setEditingGalleryId(null);
      setIsGalleryModalOpen(false);
      await onRefreshData();
    } catch (err: any) {
      setErrorText(
        language === "en" ? (err.message || "Could not save gallery node.") : "فشل في حفظ ونشر عنصر المعرض."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Gallery Item Handler
  const handleDeleteGalleryItem = (id: string) => {
    triggerDeleteConfirmation(
      language === "en" ? "Remove Gallery Photo" : "إزالة صورة المعرض",
      language === "en"
        ? "Are you sure you want to delete this photo from the customer-facing storefront gallery? Visitors will no longer see it."
        : "هل أنت متأكد من رغبتك في حذف هذه الصورة من معرض المتجر العام؟ لن يتمكن الزوار من رؤيتها بعد الآن.",
      async () => {
        setActionLoading(true);
        setErrorText("");
        setSuccessText("");

        try {
          const response = await fetch(`/api/gallery/${id}`, {
            method: "DELETE"
          });

          if (!response.ok) {
            throw new Error("Failed deleting photo from database.");
          }

          setSuccessText(
            language === "en" ? "Gallery image removed successfully." : "تم حذف وإزالة صورة المعرض بنجاح."
          );
          await onRefreshData();
        } catch (err: any) {
          setErrorText(
            language === "en"
              ? (err.message || "Could not complete image removal.")
              : "فشل إزالة وحذف صورة المعرض."
          );
        } finally {
          setActionLoading(false);
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    );
  };

  // Blend Info Manager Handlers
  const handleSelectBiBlendId = (blendId: string) => {
    setBiBlendId(blendId);
    const selectedBlend = blends.find(b => b.id === blendId);
    if (selectedBlend) {
      setBiNameEn(selectedBlend.nameEn);
      setBiNameAr(selectedBlend.nameAr);
      setBiImageUrl(selectedBlend.imageUrl || "");
      setBiDescEn(selectedBlend.descriptionEn || "");
      setBiDescAr(selectedBlend.descriptionAr || "");
    }
  };

  const handleOpenAddBi = () => {
    setBiModalMode("add");
    setEditingBiId(null);
    setErrorText("");
    setSuccessText("");

    setBiBlendId("");
    setBiNameEn("");
    setBiNameAr("");
    setBiImageUrl("");
    setBiOriginEn("");
    setBiOriginAr("");
    setBiProcessEn("");
    setBiProcessAr("");
    setBiRoastLevelEn("");
    setBiRoastLevelAr("");
    setBiAltitudeEn("");
    setBiAltitudeAr("");
    setBiNotesEn("");
    setBiNotesAr("");
    setBiDescEn("");
    setBiDescAr("");

    setShowBiModal(true);
  };

  const handleOpenEditBi = (bi: BlendInfo) => {
    setBiModalMode("edit");
    setEditingBiId(bi.id);
    setErrorText("");
    setSuccessText("");

    setBiBlendId(bi.blendId);
    setBiNameEn(bi.nameEn);
    setBiNameAr(bi.nameAr);
    setBiImageUrl(bi.imageUrl || "");
    setBiOriginEn(bi.originEn || "");
    setBiOriginAr(bi.originAr || "");
    setBiProcessEn(bi.processEn || "");
    setBiProcessAr(bi.processAr || "");
    setBiRoastLevelEn(bi.roastLevelEn || "");
    setBiRoastLevelAr(bi.roastLevelAr || "");
    setBiAltitudeEn(bi.altitudeEn || "");
    setBiAltitudeAr(bi.altitudeAr || "");
    setBiNotesEn(bi.notesEn || "");
    setBiNotesAr(bi.notesAr || "");
    setBiDescEn(bi.descriptionEn || "");
    setBiDescAr(bi.descriptionAr || "");

    setShowBiModal(true);
  };

  const handleBiFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biBlendId) {
      setErrorText(language === "en" ? "Please select a coffee blend." : "يرجى اختيار خلطة بن.");
      return;
    }
    if (!biDescEn || !biDescAr) {
      setErrorText(language === "en" ? "Description is required in both English and Arabic." : "الوصف مطلوب باللغتين العربية والإنجليزية.");
      return;
    }

    setActionLoading(true);
    setErrorText("");
    setSuccessText("");

    const payload = {
      blendId: biBlendId,
      nameEn: biNameEn.trim(),
      nameAr: biNameAr.trim(),
      imageUrl: biImageUrl,
      originEn: biOriginEn.trim(),
      originAr: biOriginAr.trim(),
      processEn: biProcessEn.trim(),
      processAr: biProcessAr.trim(),
      roastLevelEn: biRoastLevelEn.trim(),
      roastLevelAr: biRoastLevelAr.trim(),
      altitudeEn: biAltitudeEn.trim(),
      altitudeAr: biAltitudeAr.trim(),
      notesEn: biNotesEn.trim(),
      notesAr: biNotesAr.trim(),
      descriptionEn: biDescEn.trim(),
      descriptionAr: biDescAr.trim(),
    };

    try {
      if (biModalMode === "add") {
        await onAddBlendInfo(payload);
        setSuccessText(language === "en" ? "Blend info created successfully!" : "تم إنشاء معلومات البن بنجاح!");
      } else if (editingBiId) {
        await onUpdateBlendInfo(editingBiId, payload);
        setSuccessText(language === "en" ? "Blend info updated successfully!" : "تم تحديث معلومات البن بنجاح!");
      }

      setTimeout(() => {
        setShowBiModal(false);
        onRefreshData();
      }, 1000);
    } catch (err: any) {
      setErrorText(err.message || "Failed to save blend info.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBiItem = (id: string, name: string) => {
    triggerDeleteConfirmation(
      language === "en" ? "Confirm Deletion of Blend Info" : "تأكيد حذف معلومات البن",
      language === "en"
        ? `Are you sure you want to permanently delete the detailed blend info for '${name}'?`
        : `هل أنت متأكد من رغبتك في حذف معلومات البن التفصيلية لـ '${name}' نهائياً؟`,
      async () => {
        setActionLoading(true);
        setErrorText("");
        setSuccessText("");

        try {
          await onDeleteBlendInfo(id);
          setSuccessText(
            language === "en" ? "Blend info deleted successfully!" : "تم حذف معلومات البن بنجاح!"
          );
          await onRefreshData();
        } catch (err: any) {
          setErrorText(
            language === "en" ? "Failed to delete blend info." : "فشل حذف معلومات البن."
          );
        } finally {
          setActionLoading(false);
          setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    );
  };

  // Generic reorder logic
  const handleMoveItem = async (
    items: any[],
    index: number,
    direction: "up" | "down",
    type: "menus" | "blends" | "gallery" | "blendInfos"
  ) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const currentItem = items[index];
    const adjacentItem = items[newIndex];

    // Swap sort orders
    // If sortOrder doesn't exist, we use index as baseline
    const currentOrder = currentItem.sortOrder ?? index;
    const adjacentOrder = adjacentItem.sortOrder ?? newIndex;

    // If they are the same, we need to distinguish them
    let finalCurrentOrder = adjacentOrder;
    let finalAdjacentOrder = currentOrder;
    
    if (finalCurrentOrder === finalAdjacentOrder) {
      finalCurrentOrder = direction === "up" ? finalAdjacentOrder - 1 : finalAdjacentOrder + 1;
    }

    try {
      await onBulkReorder(type, [
        { id: currentItem.id, sortOrder: finalCurrentOrder },
        { id: adjacentItem.id, sortOrder: finalAdjacentOrder }
      ]);
    } catch (err) {
      console.error("Reorder failed", err);
      setErrorText(language === "en" ? "Failed to reorder items." : "فشل في إعادة ترتيب العناصر.");
    }
  };

  const handleMoveMenu = (index: number, direction: "up" | "down") => handleMoveItem(processedMenus, index, direction, "menus");
  const handleMoveBlend = (index: number, direction: "up" | "down") => handleMoveItem(processedBlends, index, direction, "blends");
  const handleMoveGallery = (index: number, direction: "up" | "down") => handleMoveItem(sortedGallery, index, direction, "gallery");
  const handleMoveBlendInfo = (index: number, direction: "up" | "down") => handleMoveItem(sortedBlendInfos, index, direction, "blendInfos");

  return (
    <div className="min-h-screen bg-[#FAF7EE] flex flex-col font-sans text-[#0D2D3A] selection:bg-[#B88A58] selection:text-white" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-[#0D2D3A]/10 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="scale-50 origin-center bg-[#0D2D3A] rounded-2xl p-2 w-16 h-16 flex items-center justify-center flex-shrink-0">
              <Logo size={100} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-xl tracking-wide uppercase text-[#0D2D3A]">
                  {language === "en" ? "SOCOTRA CONTROL CENTER" : "مركز تحكم سقطرى"}
                </h1>
                <span className="bg-[#B88A58]/20 text-[#B88A58] text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-[#B88A58]/35">
                  {language === "en" ? "ADMIN" : "المدير"}
                </span>
              </div>
              <p className="text-xs text-[#0D2D3A]/60">
                {language === "en" 
                  ? "Manage catalog categories, prepared menus, blends and image galleries" 
                  : "إدارة فئات الكتالوج، المنيو الجاهز، حبوب البن ومعرض الصور"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch Pill */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-bold bg-[#B88A58]/10 text-[#0D2D3A] border border-[#B88A58]/30 hover:bg-[#B88A58]/20 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              title={language === "en" ? "Switch to Arabic" : "التغيير للإنجليزية"}
            >
              {language === "en" ? (
                <>
                  <span className="text-[13px]">🇪🇬</span>
                  <span>العربية</span>
                </>
              ) : (
                <>
                  <span className="text-[13px]">🇬🇧</span>
                  <span>English</span>
                </>
              )}
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-[#0D2D3A] text-white hover:bg-[#0D2D3A]/90 transition-all rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> {language === "en" ? "Logout Console" : "تسجيل الخروج"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area workspace */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-8">
        
        {/* Dynamic global status banner notifications */}
        {errorText && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-5 py-4 rounded-xl font-medium leading-relaxed shadow-sm flex items-center justify-between">
            <span>❌ {errorText}</span>
            <button
              onClick={() => setErrorText("")}
              className="ml-3 p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer font-bold text-xs"
              title={language === "en" ? "Close Notification" : "إغلاق التنبيه"}
            >
              ✕
            </button>
          </div>
        )}
        {successText && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-5 py-4 rounded-xl font-semibold leading-relaxed shadow-sm flex items-center justify-between">
            <span>✓ {successText}</span>
            <button
              onClick={() => setSuccessText("")}
              className="ml-3 p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer font-bold text-xs"
              title={language === "en" ? "Close Notification" : "إغلاق التنبيه"}
            >
              ✕
            </button>
          </div>
        )}

        {/* Administration Navigation Tabs Bar */}
        <div className="flex items-center gap-2 bg-[#0D2D3A]/5 p-1 rounded-2xl text-xs font-bold self-start border border-[#0D2D3A]/10 shadow-inner">
          <button
            onClick={() => { setAdminTab("menus"); setSearchQuery(""); setCategoryFilter("all"); }}
            className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
              adminTab === "menus" ? "bg-[#0D2D3A] text-white shadow-md" : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
            }`}
          >
            {language === "en" ? "Prepared Menus" : "المنيو الجاهز"} ({menus.length})
          </button>
          <button
            onClick={() => { setAdminTab("blends"); setSearchQuery(""); setCategoryFilter("all"); }}
            className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
              adminTab === "blends" ? "bg-[#0D2D3A] text-white shadow-md" : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
            }`}
          >
            {language === "en" ? "Coffee Bags & Blends" : "حبوب البن والخلطات"} ({blends.length})
          </button>
          <button
            onClick={() => { setAdminTab("categories"); }}
            className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
              adminTab === "categories" ? "bg-[#0D2D3A] text-white shadow-md" : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
            }`}
          >
            {language === "en" ? "Category Manager" : "إدارة الفئات"}
          </button>
          <button
            onClick={() => { setAdminTab("gallery"); }}
            className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
              adminTab === "gallery" ? "bg-[#0D2D3A] text-white shadow-md" : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
            }`}
          >
            {language === "en" ? "Gallery Manager" : "إدارة معرض الصور"}
          </button>
          <button
            onClick={() => { setAdminTab("blendInfos"); setSearchQuery(""); }}
            className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
              adminTab === "blendInfos" ? "bg-[#0D2D3A] text-white shadow-md" : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
            }`}
          >
            {language === "en" ? "Blend Info" : "معلومات البن"} ({blendInfos.length})
          </button>
          <button
            onClick={() => { setAdminTab("settings"); }}
            className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              adminTab === "settings" ? "bg-[#0D2D3A] text-white shadow-md" : "text-[#0D2D3A]/70 hover:bg-[#0D2D3A]/5"
            }`}
          >
            <Settings className="h-4 w-4" />
            {language === "en" ? "Store Contact Settings" : "إعدادات تواصل المتجر"}
          </button>
        </div>

        {/* WORKSPACE SWITCH */}
        {adminTab === "categories" ? (
          /* SECTION 1: CATEGORY CRUD MANAGER (New Feature!) */
          <div className="space-y-6 animate-fadeIn" dir={language === "ar" ? "rtl" : "ltr"}>
            
            {/* Header action panel */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0D2D3A]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#0D2D3A] flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#B88A58]" /> {language === "en" ? "Manage Catalog Categories" : "إدارة فئات الكتالوجات"}
                </h3>
                <p className="text-xs text-[#0D2D3A]/60">
                  {language === "en" ? "Organize menu drinks and coffee beans into dynamic categorized visual tabs." : "تنظيم مشروبات القائمة وحبوب البن في تبويبات مرئية مصنفة تفاعلياً."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddCategory("menu")}
                className="px-5 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white hover:text-white transition-all rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Plus className="h-4 w-4 text-[#B88A58] stroke-[3]" />
                {language === "en" ? "Create Category" : "إنشاء فئة جديدة"}
              </button>
            </div>

            {/* Full-width listings of loaded categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Menu categories list box */}
              <div className="bg-white rounded-3xl p-6 border border-[#0D2D3A]/10 shadow-sm">
                <h3 className="font-bold text-base text-[#0D2D3A] mb-4 pb-2 border-b border-[#0D2D3A]/5 flex items-center justify-between">
                  <span>{language === "en" ? "Prepared Menus Categories" : "فئات قائمة المشروبات"}</span>
                  <span className="text-xs bg-[#0D2D3A]/5 px-3 py-1 rounded-full">{menuCategories.length} {language === "en" ? "Categories" : "فئات"}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-[#FAF7EE] p-4 rounded-2xl border border-[#0D2D3A]/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0D2D3A] truncate">{cat.label}</p>
                        <p className="text-xs text-[#0D2D3A]/60 font-semibold truncate leading-none mt-1">{cat.labelAr}</p>
                        <p className="text-[10px] font-mono opacity-40 mt-1 italic">{language === "en" ? "Key" : "مفتاح الربط"}: {cat.key}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEditCategory(cat, "menu")}
                          className="p-2 text-[#B88A58] hover:bg-[#B88A58]/10 rounded-xl transition-colors cursor-pointer"
                          title={language === "en" ? "Edit Category Name" : "تعديل اسم الفئة"}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {cat.key !== "General" && (
                          <button
                            onClick={() => handleDeleteCategory(cat.key, "menu")}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title={language === "en" ? "Delete Category" : "حذف الفئة"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blend categories list box */}
              <div className="bg-white rounded-3xl p-6 border border-[#0D2D3A]/10 shadow-sm">
                <h3 className="font-bold text-base text-[#0D2D3A] mb-4 pb-2 border-b border-[#0D2D3A]/5 flex items-center justify-between">
                  <span>{language === "en" ? "Coffee Bag & Beans Categories" : "فئات حبوب البن والخلطات"}</span>
                  <span className="text-xs bg-[#0D2D3A]/5 px-3 py-1 rounded-full">{blendCategories.length} {language === "en" ? "Categories" : "فئات"}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blendCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-[#FAF7EE] p-4 rounded-2xl border border-[#0D2D3A]/5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#0D2D3A] truncate">{cat.label}</p>
                        <p className="text-xs text-[#0D2D3A]/60 font-semibold truncate leading-none mt-1">{cat.labelAr}</p>
                        <p className="text-[10px] font-mono opacity-40 mt-1 italic">{language === "en" ? "Key" : "مفتاح الربط"}: {cat.key}</p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEditCategory(cat, "blend")}
                          className="p-2 text-[#B88A58] hover:bg-[#B88A58]/10 rounded-xl transition-colors cursor-pointer"
                          title={language === "en" ? "Edit Category Name" : "تعديل اسم الفئة"}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {cat.key !== "General" && (
                          <button
                            onClick={() => handleDeleteCategory(cat.key, "blend")}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title={language === "en" ? "Delete Category" : "حذف الفئة"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : adminTab === "gallery" ? (
          /* SECTION 2: GALLERY CRUD MANAGER */
          <div className="space-y-6 animate-fadeIn" dir={language === "ar" ? "rtl" : "ltr"}>
            {/* Gallery manager header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0D2D3A]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#0D2D3A] flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#B88A58]" /> 
                  {language === "en" ? "Manage Storefront Media" : "إدارة وسائط المتجر ومعرض الصور"}
                </h3>
                <p className="text-xs text-[#0D2D3A]/60">
                  {language === "en"
                    ? "Upload storefront images, direct video clips, or embed YouTube video features."
                    : "ارفع صور المتجر، أو مقاطع فيديو مباشرة، أو اعرض فيديوهات اليوتيوب لتصميم واجهة ملهمة."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddGallery}
                className="px-5 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white hover:text-white font-bold rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer text-xs active:scale-95 self-start sm:self-auto"
              >
                <Plus className="h-4 w-4 text-[#B88A58] stroke-[3]" />
                {language === "en" ? "Add Media" : "إضافة وسائط جديدة"}
              </button>
            </div>

            {/* Gallery node listings */}
            <div className="bg-white rounded-3xl p-6 border border-[#0D2D3A]/10 shadow-sm">
              <h3 className="font-bold text-base text-[#0D2D3A] mb-6 pb-2 border-b border-[#0D2D3A]/5 flex items-center justify-between">
                <span>{language === "en" ? "Active Storefront Gallery" : "معرض المتجر النشط"} ({gallery.length} {language === "en" ? "Items" : "عناصر"})</span>
              </h3>

              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners} 
                onDragStart={handleDragStart}
                onDragEnd={handleDragEndGallery}
                onDragCancel={() => setActiveId(null)}
              >
                <SortableContext 
                  items={sortedGallery.map(i => i.id)} 
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {sortedGallery.length > 0 ? (
                      sortedGallery.map((img, idx) => (
                        <SortableItem
                          key={img.id}
                          id={img.id}
                          className="bg-[#FAF7EE] p-3.5 rounded-2xl border border-[#0D2D3A]/5 flex flex-col gap-3 group relative overflow-hidden"
                        >
                          <div className="aspect-[4/3] w-full bg-[#FAF7EE] rounded-xl overflow-hidden border border-[#0D2D3A]/5 relative">
                            {img.imageUrl ? (
                              <img src={img.imageUrl} alt={img.titleEn} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D2D3A]/5 text-[#0D2D3A]/40">
                                <Video className="h-8 w-8 text-[#B88A58] mb-1 fill-[#B88A58]/20" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Video Clip</span>
                              </div>
                            )}
                            
                            {/* Drag Handle Overlay */}
                            <SortableItemContext.Consumer>
                              {(context) => (
                                <div 
                                  {...(context?.attributes || {})} 
                                  {...(context?.listeners || {})}
                                  className="drag-handle absolute top-2 left-2 p-1.5 bg-white/95 rounded-lg border border-[#0D2D3A]/15 text-[#0D2D3A]/60 hover:text-[#B88A58] opacity-75 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm z-20"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </SortableItemContext.Consumer>

                            {/* Media Type Overlay Tag */}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wider font-extrabold bg-black/75 text-white flex items-center gap-1 z-10">
                              {img.mediaType === "youtube" ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                  <span>YouTube</span>
                                </>
                              ) : img.mediaType === "video" ? (
                                <>
                                  <Video className="h-2 w-2" />
                                  <span>Video</span>
                                </>
                              ) : (
                                <span>Image</span>
                              )}
                            </div>
                          </div>

                          <div className="px-1 min-w-0">
                            <p className="font-bold text-xs text-[#0D2D3A] truncate">{img.titleEn}</p>
                            <p className="text-[11px] font-semibold text-[#B88A58] truncate">{img.titleAr}</p>
                          </div>

                          {/* Floating Action Triggers */}
                          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => handleStartEditGallery(img)}
                              className="p-1.5 bg-white/95 hover:bg-[#B88A58] hover:text-white text-[#0D2D3A] rounded-lg shadow-md transition-colors cursor-pointer"
                              title={language === "en" ? "Edit item" : "تعديل العنصر"}
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteGalleryItem(img.id)}
                              className="p-1.5 bg-white/95 hover:bg-rose-50 text-rose-600 rounded-lg shadow-md transition-colors cursor-pointer"
                              title={language === "en" ? "Delete item" : "حذف العنصر"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </SortableItem>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center text-[#0D2D3A]/40 flex flex-col items-center justify-center bg-[#FAF7EE]/50 rounded-2xl w-full">
                        <ImageIcon className="h-8 w-8 text-[#B88A58]/55 mb-2" />
                        <p className="text-sm font-semibold">{language === "en" ? "Empty Gallery Directory" : "دليل معرض الصور فارغ"}</p>
                        <p className="text-xs">{language === "en" ? "Physical storefront moments appear here once published." : "ستظهر صور ولحظات فرعنا هنا بمجرد نشرها."}</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeId ? (
                    <div className="bg-white border-2 border-[#B88A58] shadow-2xl rounded-2xl p-4 opacity-90 flex items-center gap-4 min-w-[200px] z-50">
                      <ImageIcon className="h-5 w-5 text-[#B88A58]" />
                      <span className="font-bold text-[#0D2D3A] text-sm">
                        {sortedGallery.find(g => g.id === activeId)?.titleEn || "Moving Media..."}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        ) : adminTab === "blendInfos" ? (
          /* SECTION 2.5: BLEND INFOS MANAGER (New Feature!) */
          <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
            {/* Header / Add trigger */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0D2D3A]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#0D2D3A] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#B88A58]" /> {language === "en" ? "Manage Coffee Blend Info" : "إدارة معلومات البن"}
                </h3>
                <p className="text-xs text-[#0D2D3A]/60">
                  {language === "en" ? "Create interactive stories and details for each of your coffee bean blends" : "أنشئ قصص وتفاصيل تفاعلية لكل خلطة من خلطات حبوب البن"}
                </p>
              </div>
              <button
                onClick={handleOpenAddBi}
                className="px-5 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2 self-start sm:self-auto active:scale-95"
              >
                <Plus className="h-4 w-4" /> {language === "en" ? "Add Blend Info" : "إضافة معلومات البن"}
              </button>
            </div>

            {/* List / Cards displaying active blendInfos */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0D2D3A]/10 shadow-sm">
              <h3 className="font-bold text-base text-[#0D2D3A] mb-6 pb-2 border-b border-[#0D2D3A]/5 flex items-center justify-between">
                <span>{language === "en" ? "Active Blend Info" : "معلومات البن النشطة"} ({blendInfos.length})</span>
              </h3>

              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners} 
                onDragStart={handleDragStart}
                onDragEnd={handleDragEndBlendInfo}
                onDragCancel={() => setActiveId(null)}
              >
                <SortableContext 
                  items={sortedBlendInfos.map(i => i.id)} 
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedBlendInfos.length > 0 ? (
                      sortedBlendInfos.map((bi, idx) => {
                        const matchedBlend = blends.find(b => b.id === bi.blendId);
                        return (
                            <SortableItem
                              key={bi.id}
                              id={bi.id}
                              className="bg-[#FAF7EE] p-5 rounded-2xl border border-[#0D2D3A]/5 flex flex-col justify-between gap-4 shadow-sm group"
                            >
                            <div className="space-y-3">
                              {bi.imageUrl && (
                                <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#0D2D3A]/5 bg-white relative">
                                  <img src={bi.imageUrl} alt={bi.nameEn} className="w-full h-full object-cover animate-fade-in" />
                                  
                                  {/* Drag Handle Overlay */}
                                  <SortableItemContext.Consumer>
                                    {(context) => (
                                      <div 
                                        {...(context?.attributes || {})} 
                                        {...(context?.listeners || {})}
                                        className="drag-handle absolute top-2 left-2 p-1.5 bg-white/95 rounded-lg border border-[#0D2D3A]/15 text-[#0D2D3A]/60 hover:text-[#B88A58] opacity-75 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm z-10"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </div>
                                    )}
                                  </SortableItemContext.Consumer>
                                </div>
                              )}
                              {!bi.imageUrl && (
                                <SortableItemContext.Consumer>
                                  {(context) => (
                                    <div 
                                      {...(context?.attributes || {})} 
                                      {...(context?.listeners || {})}
                                      className="drag-handle absolute top-2 left-2 p-1.5 bg-white/95 rounded-lg border border-[#0D2D3A]/15 text-[#0D2D3A]/60 hover:text-[#B88A58] opacity-75 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm z-10"
                                      title="Drag to reorder"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                  )}
                                </SortableItemContext.Consumer>
                              )}
                              <div>
                                <span className="text-[10px] font-mono uppercase bg-[#B88A58]/10 text-[#B88A58] px-2 py-0.5 rounded-full border border-[#B88A58]/20 font-bold">
                                  {matchedBlend ? (language === "en" ? "Linked Blend" : "بن مربوط") : (language === "en" ? "Orphan Card" : "غير مربوط")}
                                </span>
                                <h4 className="font-bold text-sm text-[#0D2D3A] mt-1">{language === "en" ? bi.nameEn : bi.nameAr}</h4>
                                {bi.originEn && (
                                  <p className="text-xs text-[#0D2D3A]/60 flex items-center gap-1 mt-1">
                                    <Globe className="h-3 w-3 text-[#B88A58]" />
                                    <span className="font-semibold">{language === "en" ? "Origin" : "المنشأ"}:</span> {language === "en" ? bi.originEn : bi.originAr}
                                  </p>
                                )}
                                <p className="text-xs text-[#0D2D3A]/70 line-clamp-3 mt-2 italic">
                                  "{language === "en" ? bi.descriptionEn : bi.descriptionAr}"
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0D2D3A]/5">
                              <button
                                onClick={() => handleOpenEditBi(bi)}
                                className="p-2 bg-white text-[#B88A58] border border-[#B88A58]/25 hover:bg-[#B88A58]/10 rounded-xl transition-all shadow-sm cursor-pointer"
                                title={language === "en" ? "Edit details" : "تعديل التفاصيل"}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBiItem(bi.id, language === "en" ? bi.nameEn : bi.nameAr)}
                                className="p-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl transition-all shadow-sm cursor-pointer"
                                title={language === "en" ? "Delete Card" : "حذف البطاقة"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </SortableItem>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-12 text-center text-[#0D2D3A]/40 flex flex-col items-center justify-center bg-[#FAF7EE]/50 rounded-2xl border border-dashed border-[#0D2D3A]/10 w-full">
                        <BookOpen className="h-8 w-8 text-[#B88A58]/55 mb-2 animate-bounce" />
                        <p className="text-sm font-semibold">{language === "en" ? "No Blend Info Created" : "لا توجد معلومات بن حالياً"}</p>
                        <p className="text-xs">{language === "en" ? "Click 'Add Blend Info' to create your first informative coffee story." : "انقر على 'إضافة معلومات البن' لإنشاء أول قصة وتفاصيل مميزة لخلطات قهوة سقطرى."}</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeId ? (
                    <div className="bg-white border-2 border-[#B88A58] shadow-2xl rounded-2xl p-4 opacity-90 flex items-center gap-4 min-w-[200px] z-50">
                      <BookOpen className="h-5 w-5 text-[#B88A58]" />
                      <span className="font-bold text-[#0D2D3A] text-sm">
                        {sortedBlendInfos.find(bi => bi.id === activeId)?.nameEn || "Moving Info..."}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        ) : adminTab === "settings" ? (
          /* SECTION 2.7: STORE & CONTACT SETTINGS */
          <div className="space-y-8 animate-fadeIn" dir={language === "ar" ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0D2D3A]/10 shadow-sm">
              <h3 className="font-bold text-lg text-[#0D2D3A] flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#B88A58]" /> {language === "en" ? "Manage Store Contacts & Locations" : "إدارة بيانات المتجر والاتصال"}
              </h3>
              <p className="text-xs text-[#0D2D3A]/60">
                {language === "en" ? "Customize public-facing physical store addresses, contact phones, emails, and wholesales operational details." : "تخصيص عناوين الفروع الفعلية وأرقام هواتف التواصل والبريد الإلكتروني وتفاصيل طلبات الجملة."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 md:p-8 border border-[#0D2D3A]/10 shadow-sm space-y-8">
              {settingsSuccessMessage && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  {settingsSuccessMessage}
                </div>
              )}

              {/* SECTION 1: CORE CONTACT DECK */}
              <div className="space-y-6">
                <h4 className="font-bold text-sm text-[#0D2D3A] border-b border-[#0D2D3A]/5 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-[#B88A58]" />
                  {language === "en" ? "1. General Contacts" : "١. الاتصال العام"}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Phone Numbers Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "Operational Phone Numbers" : "أرقام هاتف العمليات المباشرة"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettingsPhones([...settingsPhones, ""])}
                        className="text-[9px] font-bold text-[#B88A58] uppercase hover:underline"
                      >
                        + {language === "en" ? "Add Phone" : "إضافة هاتف"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {settingsPhones.map((phone, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => {
                              const updated = [...settingsPhones];
                              updated[idx] = e.target.value;
                              setSettingsPhones(updated);
                            }}
                            placeholder="e.g. 010 1166 6167"
                            className="flex-1 bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-2.5 text-[#0D2D3A] text-xs focus:outline-none focus:border-[#B88A58]"
                          />
                          {settingsPhones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSettingsPhones(settingsPhones.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Addresses Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "Official Store Emails" : "عناوين البريد الإلكتروني الرسمي"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettingsEmails([...settingsEmails, ""])}
                        className="text-[9px] font-bold text-[#B88A58] uppercase hover:underline"
                      >
                        + {language === "en" ? "Add Email" : "إضافة بريد"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {settingsEmails.map((email, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              const updated = [...settingsEmails];
                              updated[idx] = e.target.value;
                              setSettingsEmails(updated);
                            }}
                            placeholder="e.g. Socotra@admin.com"
                            className="flex-1 bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-2.5 text-[#0D2D3A] text-xs focus:outline-none focus:border-[#B88A58]"
                          />
                          {settingsEmails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSettingsEmails(settingsEmails.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2 & 3: DYNAMIC PHYSICAL LOCATIONS */}
              <div className="space-y-6 pt-4 border-t border-[#0D2D3A]/5">
                <div className="flex items-center justify-between border-b border-[#0D2D3A]/5 pb-2">
                  <h4 className="font-bold text-sm text-[#0D2D3A] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#B88A58]" />
                    {language === "en" ? "2. Physical Store Locations" : "٢. مواقع الفروع الفعلية"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsLocations([
                        ...settingsLocations,
                        {
                          id: "loc-" + Date.now() + Math.random().toString(36).substring(2, 5),
                          nameEn: "",
                          nameAr: "",
                          addressEn: "",
                          addressAr: ""
                        }
                      ]);
                    }}
                    className="px-4 py-2 bg-[#FAF7EE] border border-[#0D2D3A]/20 hover:border-[#B88A58] text-[#0D2D3A] text-xs font-bold rounded-xl transition-all hover:bg-[#FAF7EE]/80 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-[#B88A58] stroke-[3]" />
                    {language === "en" ? "Add Location" : "إضافة فرع جديد"}
                  </button>
                </div>

                <div className="space-y-6">
                  {settingsLocations.map((loc, idx) => {
                    const isPrimary = idx === 0;
                    return (
                      <div key={loc.id || idx} className="p-6 bg-[#FAF7EE]/50 rounded-2xl border border-[#0D2D3A]/10 space-y-4 relative animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#0D2D3A] text-[#FAF7EE] flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <h5 className="font-bold text-sm text-[#0D2D3A] flex items-center gap-2">
                              {isPrimary 
                                ? (language === "en" ? "Primary Location" : "الموقع الرئيسي") 
                                : (language === "en" ? `Location ${idx + 1}` : `الفرع ${idx + 1}`)}
                              {isPrimary && (
                                <span className="text-[9px] bg-[#B88A58]/10 text-[#B88A58] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                                  Default
                                </span>
                              )}
                            </h5>
                          </div>
                          {settingsLocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSettingsLocations(settingsLocations.filter((_, i) => i !== idx));
                              }}
                              className="text-red-600 hover:text-red-800 text-[10px] font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl cursor-pointer transition-colors"
                            >
                              {language === "en" ? "Remove Location" : "حذف الفرع"}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                              {language === "en" ? `Location Name (English)` : "اسم الفرع (بالإنجليزي)"}
                            </label>
                            <input
                              type="text"
                              value={loc.nameEn}
                              onChange={(e) => {
                                const updated = [...settingsLocations];
                                updated[idx].nameEn = e.target.value;
                                setSettingsLocations(updated);
                              }}
                              required
                              placeholder={language === "en" ? "e.g. Vivinz Mall" : "مثال: فيفينز مول"}
                              className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                              {language === "en" ? `Location Name (Arabic)` : "اسم الفرع (بالعربي)"}
                            </label>
                            <input
                              type="text"
                              value={loc.nameAr}
                              onChange={(e) => {
                                const updated = [...settingsLocations];
                                updated[idx].nameAr = e.target.value;
                                setSettingsLocations(updated);
                              }}
                              required
                              placeholder={language === "en" ? "e.g. فيفينز مول - الدور الأول" : "مثال: فيفينز مول - الدور الأول"}
                              className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right"
                            />
                          </div>
                          <div>
                            <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                              {language === "en" ? `Physical Address (English)` : "عنوان الفرع (بالإنجليزي)"}
                            </label>
                            <input
                              type="text"
                              value={loc.addressEn}
                              onChange={(e) => {
                                const updated = [...settingsLocations];
                                updated[idx].addressEn = e.target.value;
                                setSettingsLocations(updated);
                              }}
                              required
                              placeholder={language === "en" ? "e.g. Al Shorouk City, Cairo" : "العنوان بالتفصيل بالإنجليزية"}
                              className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                              {language === "en" ? `Physical Address (Arabic)` : "عنوان الفرع (بالعربي)"}
                            </label>
                            <input
                              type="text"
                              value={loc.addressAr}
                              onChange={(e) => {
                                const updated = [...settingsLocations];
                                updated[idx].addressAr = e.target.value;
                                setSettingsLocations(updated);
                              }}
                              required
                              placeholder={language === "en" ? "مثال: مدينة الشروق، القاهرة" : "العنوان بالتفصيل بالعربية"}
                              className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: WHOLESALES NOTES */}
              <div className="space-y-4 pt-4 border-t border-[#0D2D3A]/5">
                <h4 className="font-bold text-sm text-[#0D2D3A] border-b border-[#0D2D3A]/5 pb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-[#B88A58]" />
                  {language === "en" ? "4. Wholesale Operations Note" : "٤. رسالة طلبات الجملة"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                  <div>
                    <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Note Message (English)" : "نص الرسالة (بالإنجليزي)"}
                    </label>
                    <textarea
                      value={settingsWholesaleEn}
                      onChange={(e) => setSettingsWholesaleEn(e.target.value)}
                      required
                      rows={3}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Note Message (Arabic)" : "نص الرسالة (بالعربي)"}
                    </label>
                    <textarea
                      value={settingsWholesaleAr}
                      onChange={(e) => setSettingsWholesaleAr(e.target.value)}
                      required
                      rows={3}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: PAGE CONTENT NOTES - MOVED TO MODALS ON INDIVIDUAL TABS */}

              {/* FORM TRIGGER ACTIONS */}
              <div className="pt-6 border-t border-[#0D2D3A]/5 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={settingsSaveLoading}
                  className="px-6 py-3.5 bg-[#0D2D3A] hover:bg-[#B88A58] disabled:bg-[#0D2D3A]/40 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  {settingsSaveLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      {language === "en" ? "Saving settings..." : "جاري حفظ الإعدادات..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-[#B88A58]" />
                      {language === "en" ? "Save Storefront Settings" : "حفظ إعدادات المتجر"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SECTION 3: CORE CATALOGS (Menus or Blends Lists) */
          <>
            {/* Filter controls panel */}
            <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#0D2D3A]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" dir={language === "ar" ? "rtl" : "ltr"}>
              {/* Left Search input */}
              <div className="relative flex-1 max-w-md text-xs font-semibold text-[#0D2D3A]">
                <Search className={`absolute ${language === "ar" ? "right-3.5" : "left-3.5"} top-3.5 h-4 w-4 text-[#0D2D3A]/50`} />
                <input
                  type="text"
                  placeholder={
                    adminTab === "menus" 
                      ? (language === "en" ? "Search prepared drinks, desserts..." : "ابحث في المشروبات الجاهزة والحلويات...") 
                      : (language === "en" ? "Search bagged coffee blends..." : "ابحث في خلطات وأكياس البن...")
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${language === "ar" ? "pr-10 pl-4 text-right" : "pl-10 pr-4"} py-3 bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl text-xs placeholder-[#0D2D3A]/30 focus:outline-none focus:border-[#B88A58] transition-all`}
                />
              </div>

              {/* Middle dynamic Category filtering dropdown */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#FAF7EE] border border-[#0D2D3A]/15 text-[#0D2D3A] px-4 py-3 rounded-xl text-xs font-bold focus:outline-none focus:border-[#B88A58] cursor-pointer"
                >
                  <option value="all">{language === "en" ? "All Dynamic Categories (الكل)" : "جميع الفئات (الكل)"}</option>
                  {(adminTab === "menus" ? menuCategories : blendCategories).map((c) => (
                    <option key={c.id} value={c.key}>
                      {c.label} • {c.labelAr}
                    </option>
                  ))}
                </select>

                {/* Addition trigger button */}
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-3 bg-[#0D2D3A] text-white hover:bg-[#0D2D3A]/90 transition-all rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-[#B88A58] stroke-[3]" /> {adminTab === "menus" ? (language === "en" ? "Add Prepared Item" : "إضافة مشروب جديد") : (language === "en" ? "Add Blend / Bag" : "إضافة بن / خلطة")}
                </button>

                {/* Edit Page Content button */}
                <button
                  onClick={() => adminTab === "menus" ? setIsMenuContentModalOpen(true) : setIsBlendContentModalOpen(true)}
                  className="px-5 py-3 bg-[#B88A58] text-white hover:bg-[#B88A58]/90 transition-all rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-white" /> {language === "en" ? "Edit Page Content" : "تعديل محتوى الصفحة"}
                </button>
              </div>
            </div>

            {/* List Table Board */}
            <div className="bg-white rounded-3xl border border-[#0D2D3A]/10 overflow-hidden shadow-sm" dir={language === "ar" ? "rtl" : "ltr"}>
              <div className="overflow-x-auto">
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCorners} 
                  modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                  onDragStart={handleDragStart}
                  onDragEnd={adminTab === "menus" ? handleDragEndMenu : handleDragEndBlend}
                  onDragCancel={() => setActiveId(null)}
                >
                  <div className="w-full text-left text-xs min-w-[1000px]">
                    <div className="grid grid-cols-[60px_80px_2.2fr_1.5fr_3fr_1.8fr_120px] gap-4 bg-[#0D2D3A] text-white uppercase tracking-wider text-[10px] font-bold p-4 border-b border-[#0D2D3A]/20">
                      <div className="flex items-center justify-center">{language === "en" ? "Drag" : "سحب"}</div>
                      <div className="flex items-center">{language === "en" ? "Image" : "الصورة"}</div>
                      <div className="flex items-center">{language === "en" ? "Display Name" : "الاسم المعروض"}</div>
                      <div className="flex items-center">{language === "en" ? "Category Tag" : "وسم الفئة"}</div>
                      <div className="flex items-center">{language === "en" ? "Product Descriptions" : "وصف المنتج"}</div>
                      <div className="flex items-center">
                        {adminTab === "menus" ? (language === "en" ? "Cup Pricing" : "سعر الكوب") : (language === "en" ? "Bean Weights" : "سعر وزن حبوب البن")}
                      </div>
                      <div className="flex items-center justify-center">{language === "en" ? "Actions" : "إجراءات"}</div>
                    </div>
                    
                    <div className={`divide-y divide-[#0D2D3A]/5 font-medium ${language === "ar" ? "text-right" : "text-left"}`}>
                      <SortableContext 
                        items={(adminTab === "menus" ? processedMenus : processedBlends).map(i => i.id)} 
                        strategy={verticalListSortingStrategy}
                      >
                        {(adminTab === "menus" ? processedMenus : processedBlends).length > 0 ? (
                          (adminTab === "menus" ? processedMenus : processedBlends).map((item, idx) => (
                            <SortableItem key={item.id} id={item.id} className="grid grid-cols-[60px_80px_2.2fr_1.5fr_3fr_1.8fr_120px] gap-4 items-center p-4 hover:bg-[#FAF7EE]/40 bg-white">
                              <div className="flex items-center justify-center">
                                <SortableItemContext.Consumer>
                                  {(context) => (
                                    <div 
                                      {...(context?.attributes || {})} 
                                      {...(context?.listeners || {})}
                                      className="drag-handle p-2 text-[#0D2D3A]/40 hover:text-[#B88A58] transition-colors cursor-grab active:cursor-grabbing" 
                                      title="Drag to reorder"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>
                                  )}
                                </SortableItemContext.Consumer>
                              </div>

                              <div className="flex items-center">
                                <div className="w-14 h-14 bg-[#FAF7EE] rounded-xl overflow-hidden border border-[#0D2D3A]/5 flex items-center justify-center relative">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.nameEn} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span className="text-[7px] text-[#0D2D3A]/30 uppercase font-mono">{language === "en" ? "No image" : "بدون صورة"}</span>
                                  )}
                                </div>
                              </div>

                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-sm text-[#0D2D3A] truncate">{item.nameEn}</div>
                                <div className="text-[#B88A58] font-bold mt-0.5 truncate">{item.nameAr}</div>
                                <span className="text-[9px] font-mono opacity-40">id: {item.id}</span>
                              </div>

                              <div>
                                <div className="bg-[#FAF7EE] border border-[#0D2D3A]/5 text-[#0D2D3A] px-3 py-1.5 rounded-lg inline-block">
                                  <span className="block text-[10px] font-bold">{item.category}</span>
                                  <span className="block text-[8px] text-[#0D2D3A]/60 font-semibold">{item.categoryAr}</span>
                                </div>
                              </div>

                              <div className="pr-2">
                                <p className="line-clamp-2 text-[#0D2D3A]/70 leading-relaxed font-light">{item.descriptionEn || "-"}</p>
                                <p className="line-clamp-1 italic text-right text-[10.5px] text-[#0D2D3A]/50 mt-1">{item.descriptionAr || "-"}</p>
                              </div>

                              <div>
                                {adminTab === "menus" ? (
                                  <div className="space-y-1">
                                    {item.priceSingle !== undefined && (
                                      <div><span className="text-[9px] opacity-60 text-[#0D2D3A]">{language === "en" ? "Single Cup:" : "كوب فردي (سنجل):"}</span> <span className="font-bold">{item.priceSingle} {language === "en" ? "EGP" : "ج.م"}</span></div>
                                    )}
                                    {item.priceDouble !== undefined && (
                                      <div><span className="text-[9px] opacity-60 text-[#0D2D3A]">{language === "en" ? "Double Cup:" : "كوب مزدوج (دبل):"}</span> <span className="font-bold text-[#B88A58]">{item.priceDouble} {language === "en" ? "EGP" : "ج.م"}</span></div>
                                    )}
                                    {item.priceSingle === undefined && item.priceDouble === undefined && <span>-</span>}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {item.priceKilo !== undefined && (
                                      <div><span className="text-[9px] opacity-60 text-[#0D2D3A]">{language === "en" ? "1 KILO:" : "كيلو كامل:"}</span> <span className="font-bold">{item.priceKilo} {language === "en" ? "EGP" : "ج.م"}</span></div>
                                    )}
                                    {item.priceQuarter !== undefined && (
                                      <div><span className="text-[9px] opacity-60 text-[#0D2D3A]">{language === "en" ? "1/4 KILO:" : "ربع كيلو (٢٥٠ج):"}</span> <span className="font-bold">{item.priceQuarter} {language === "en" ? "EGP" : "ج.م"}</span></div>
                                    )}
                                    {item.priceEighth !== undefined && (
                                      <div><span className="text-[9px] opacity-60 text-[#0D2D3A]">{language === "en" ? "1/8 KILO:" : "ثمن كيلو (١٢٥ج):"}</span> <span className="font-bold text-[#B88A58]">{item.priceEighth} {language === "en" ? "EGP" : "ج.م"}</span></div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-center">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenEdit(item)}
                                    className="p-2 text-[#B88A58] hover:bg-[#B88A58]/5 rounded-xl transition-colors cursor-pointer"
                                    title={language === "en" ? "Edit Listing Parameters" : "تعديل بيانات المنتج"}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id, item.nameEn)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                    title={language === "en" ? "Trash Product Listing" : "حذف وإزالة المنتج"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </SortableItem>
                          ))
                        ) : (
                          <div className="py-16 text-center text-[#0D2D3A]/40">
                            <Database className="h-8 w-8 text-[#B88A58]/55 inline-block mb-2" />
                            <p className="text-sm font-bold">{language === "en" ? "No products found in this category" : "لم يتم العثور على منتجات في هذه الفئة"}</p>
                            <div className="flex items-center justify-center gap-3 mt-2">
                              <button 
                                onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                                className="text-[10px] font-bold text-[#B88A58] hover:underline uppercase tracking-widest cursor-pointer"
                              >
                                {language === "en" ? "Reset Filters" : "إعادة ضبط الفلاتر"}
                              </button>
                              <span className="text-[#0D2D3A]/20 text-[10px]">•</span>
                              <button 
                                onClick={() => onRefreshData()}
                                className="text-[10px] font-bold text-[#0D2D3A]/60 hover:underline uppercase tracking-widest cursor-pointer"
                              >
                                {language === "en" ? "Refresh Data" : "تحديث البيانات"}
                              </button>
                            </div>
                          </div>
                        )}
                      </SortableContext>
                    </div>
                  </div>
              <DragOverlay dropAnimation={null}>
                {activeId ? (
                  <div className="bg-white border-2 border-[#B88A58] shadow-2xl rounded-2xl p-4 opacity-90 flex items-center gap-4 min-w-[300px] z-50">
                    <GripVertical className="h-5 w-5 text-[#B88A58]" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[#0D2D3A] text-sm">
                        {processedMenus.find(m => m.id === activeId)?.nameEn || 
                         processedBlends.find(b => b.id === activeId)?.nameEn || 
                         "Moving product row..."}
                      </span>
                      <span className="text-[9px] text-[#0D2D3A]/50 uppercase font-bold tracking-widest">
                        {language === "en" ? "Sorting Product List" : "ترتيب قائمة المنتجات"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </>
    )}

      </main>

      {/* MODAL SYSTEM (Add / Edit Product Dialog) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl border border-[#0D2D3A]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir={language === "ar" ? "rtl" : "ltr"}>
            
            {/* Modal Header */}
            <div className="bg-[#0D2D3A] text-white px-6 py-5 flex items-center justify-between border-b border-[#0D2D3A]/15">
              <div className="flex items-center gap-3">
                <Coffee className="h-5 w-5 text-[#B88A58]" />
                <div>
                  <h3 className="font-display font-black text-base tracking-wide uppercase">
                    {modalMode === "add" 
                      ? (adminTab === "menus" 
                          ? (language === "en" ? "Register New Prepared Drink" : "تسجيل مشروب جديد") 
                          : (language === "en" ? "Register New Coffee Bag Blend" : "تسجيل كيس/خلطة بن جديدة")) 
                      : (language === "en" ? `Adjust Listing: ${formNameEn}` : `تعديل بيانات المنتج: ${formNameAr || formNameEn}`)}
                  </h3>
                  <p className="text-[10px] text-[#FAF7EE]/60 tracking-wider">
                    {language === "en" ? "Dynamic storefront metadata modification pipeline" : "نافذة تعديل وتحديث بيانات واجهة المتجر بنظام فوري وسريع"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1 bg-transparent border-0 rounded-lg cursor-pointer"
              >
                {language === "en" ? "Close (✕)" : "إغلاق (✕)"}
              </button>
            </div>

            {/* Modal Content Form wrapper */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-xs text-[#0D2D3A] font-semibold">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Name (English)" : "الاسم (بالإنجليزي)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "en" ? "e.g. Classic Turkish Coffee" : "مثال: Classic Turkish Coffee"}
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                  />
                </div>

                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Name (Arabic)" : "الاسم (بالعربي)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "en" ? "e.g. قهوة تركي كلاسيك" : "مثال: قهوة تركية كلاسيكية"}
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Category Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Select Category Tag" : "اختر وسم الفئة"}
                  </label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => handleCategorySelectionChange(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] cursor-pointer"
                  >
                    <option value="">{language === "en" ? "-- Choose Category --" : "-- اختر الفئة المناسبة --"}</option>
                    {(adminTab === "menus" ? menuCategories : blendCategories).map((c) => (
                      <option key={c.id} value={c.key}>
                        {c.label} • {c.labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Arabic Equivalent Category Tag" : "الاسم العربي المقابل للفئة المحددة"}
                  </label>
                  <input
                    type="text"
                    required
                    disabled
                    placeholder={language === "en" ? "Auto-matched dynamic Arabic label" : "يتم تحديده تلقائياً من الفئة"}
                    value={formCategoryAr}
                    className="w-full bg-[#FAF7EE]/50 border border-[#0D2D3A]/10 rounded-xl px-4 py-3 text-[#0D2D3A]/60 focus:outline-none text-right font-medium"
                  />
                </div>
              </div>

              {/* Product graphic uploader */}
              <div className="p-4 bg-[#FAF7EE] border border-[#0D2D3A]/10 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 flex flex-col gap-1 w-full">
                  <label className="block text-[#0D2D3A]/70 mb-1 cursor-pointer uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Graphic Cover Image" : "صورة غلاف المنتج المعبرة"}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        id="product-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, "product")}
                        className="hidden"
                      />
                      <label
                        htmlFor="product-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0D2D3A] hover:bg-[#0D2D3A]/90 text-white border-transparent hover:border-[#B88A58]/50 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#B88A58]" />
                        {language === "en" ? "Choose Product Image" : "اختر صورة المنتج"}
                      </label>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#0D2D3A]/45 font-normal select-none">
                    {language === "en" ? "*Leaves whitespace on storefront if empty." : "*سيتم ترك مساحة الصورة فارغة بواجهة المتجر إن لم تختر صورة."}
                  </span>
                </div>
                
                {formImageUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#0D2D3A]/10 bg-white shadow-sm flex-shrink-0">
                      <img src={formImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImageUrl("")}
                      className="text-[9px] bg-white border border-rose-200 text-rose-600 px-2 py-0.5 rounded-md hover:bg-rose-50 font-bold"
                    >
                      {language === "en" ? "Clear Cover Image" : "مسح الصورة"}
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-[#0D2D3A]/20 flex items-center justify-center opacity-35 text-[9px] select-none font-mono text-[#0D2D3A]">
                    {language === "en" ? "NO IMG" : "لا يوجد صورة"}
                  </div>
                )}
              </div>

              {/* Dynamic Prices Block */}
              <div className="bg-[#FAF7EE]/40 border border-[#0D2D3A]/10 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm tracking-wide text-[#0D2D3A] border-b border-[#0D2D3A]/5 pb-1">
                  {language === "en" ? "Price Configuration (EGP)" : "إعداد وضبط أسعار البيع (بالجنيه المصري)"}
                </h4>
                
                {adminTab === "menus" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "Single Cup Cost" : "سعر الكوب السنجل (الفردي)"}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={formPriceSingle}
                        onChange={(e) => setFormPriceSingle(e.target.value)}
                        className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "Double Cup Cost (Optional)" : "سعر الكوب الدبل (المزدوج) - اختياري"}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 80"
                        value={formPriceDouble}
                        onChange={(e) => setFormPriceDouble(e.target.value)}
                        className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "1 Kilo Price" : "سعر الكيلو الكامل"}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 400"
                        value={formPriceKilo}
                        onChange={(e) => setFormPriceKilo(e.target.value)}
                        className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-3 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "1/4 Kilo (250g)" : "سعر ربع الكيلو (٢٥٠ج)"}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={formPriceQuarter}
                        onChange={(e) => setFormPriceQuarter(e.target.value)}
                        className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-3 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                        {language === "en" ? "1/8 Kilo (125g)" : "سعر ثمن الكيلو (١٢٥ج)"}
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={formPriceEighth}
                        onChange={(e) => setFormPriceEighth(e.target.value)}
                        className="w-full bg-white border border-[#0D2D3A]/15 rounded-xl px-3 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Description (English)" : "الوصف (باللغة الإنجليزية)"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about coffee beans, origin notes, milk alternatives..."
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                  />
                </div>

                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Description (Arabic)" : "الوصف (باللغة العربية)"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="تفاصيل وإضافات حول حبوب البن، درجات وملاحظات التحميص والخلط..."
                    value={formDescAr}
                    onChange={(e) => setFormDescAr(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#0D2D3A]/5 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all font-bold rounded-full uppercase tracking-wider cursor-pointer text-xs"
                >
                  {language === "en" ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-8 py-3 bg-[#0D2D3A] hover:bg-[#0D2D3A]/90 text-white transition-all font-bold rounded-full uppercase tracking-wider shadow-md cursor-pointer text-xs"
                >
                  {actionLoading 
                    ? (language === "en" ? "Saving Listing..." : "جاري حفظ التعديلات...") 
                    : (language === "en" ? "Save Product Details" : "حفظ تفاصيل المنتج")}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DELETE DIALOG / MODAL (Solves blocked iframe window.confirm) */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white rounded-3xl border border-[#0D2D3A]/25 shadow-2xl p-6 md:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-250" dir={language === "ar" ? "rtl" : "ltr"}>
            
            {/* Warning visual symbol */}
            <div className="mx-auto w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center shadow-inner">
              <Trash2 className="h-6 w-6" />
            </div>

            {/* Description titles */}
            <div className="space-y-2">
              <h3 className="font-display font-black text-lg text-[#0D2D3A] uppercase tracking-wide">
                {confirmDeleteModal.title}
              </h3>
              <p className="text-xs text-[#0D2D3A]/70 leading-relaxed font-semibold">
                {confirmDeleteModal.message}
              </p>
            </div>

            {/* Interactive Decision triggers */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all font-bold rounded-xl uppercase tracking-wider cursor-pointer text-xs"
              >
                {language === "en" ? "No, Keep it" : "لا، تراجع عن الحذف"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteModal.onConfirm}
                disabled={actionLoading}
                className="flex-1 px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white transition-all font-bold rounded-xl uppercase tracking-wider shadow-md cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (language === "en" ? "Processing..." : "جاري الحذف...") : (language === "en" ? "Yes, Delete" : "نعم، احذف الآن")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BLEND INFO MANAGER MODAL DIALOG */}
      {showBiModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-[#FAF7EE] rounded-3xl border border-[#0D2D3A]/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]" dir={language === "ar" ? "rtl" : "ltr"}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-[#0D2D3A]/5">
              <div className="space-y-1">
                <h3 className="font-display font-black text-xl text-[#0D2D3A] uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#B88A58]" />
                  {biModalMode === "add"
                    ? (language === "en" ? "Create Coffee Blend Info" : "إنشاء معلومات البن")
                    : (language === "en" ? "Edit Coffee Blend Info" : "تعديل معلومات البن")}
                </h3>
                <p className="text-xs text-[#0D2D3A]/60 font-medium">
                  {language === "en"
                    ? "Formulate exquisite details, sensory notes, origin facts, and narratives."
                    : "صِغ التفاصيل الرائعة، الإيحاءات الحسية، معلومات المنشأ، وقصة السلالة."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBiModal(false)}
                className="w-9 h-9 rounded-full bg-[#FAF7EE] hover:bg-rose-50 hover:text-rose-600 text-[#0D2D3A]/70 transition-colors flex items-center justify-center text-sm font-bold cursor-pointer border border-[#0D2D3A]/5 active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleBiFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold text-[#0D2D3A] bg-white/50">
              
              {/* SECTION A: IDENTITY & COVER MEDIA */}
              <div className="bg-white rounded-2xl p-5 border border-[#0D2D3A]/5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#0D2D3A]/5 text-[#B88A58]">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-bold text-[11px] uppercase tracking-widest">
                    {language === "en" ? "1. Identity & Cover Media" : "١. الهوية وصورة الغلاف"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Select coffee blend */}
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/75 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Linked Coffee Blend" : "خلطة البن المرتبطة"} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={biBlendId}
                      onChange={(e) => handleSelectBiBlendId(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] font-bold focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200"
                    >
                      <option value="">{language === "en" ? "-- Choose a Blend --" : "-- اختر خلطة بن --"}</option>
                      {blends.map((b) => (
                        <option key={b.id} value={b.id}>{language === "en" ? b.nameEn : b.nameAr}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#0D2D3A]/45 italic font-medium">
                      {language === "en" ? "Binds this info section directly to a product in the catalog." : "يربط هذه المعلومات مباشرة بمنتج في الكتالوج."}
                    </p>
                  </div>

                  {/* Premium image upload dropzone */}
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/75 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Cover Image" : "صورة الغلاف"}
                    </label>
                    <div className="flex items-center gap-3">
                      {biImageUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#0D2D3A]/10 flex-shrink-0 bg-[#FAF7EE] group">
                          <img src={biImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBiImageUrl("")}
                            className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] cursor-pointer"
                            title={language === "en" ? "Remove Cover" : "إزالة الغلاف"}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-[#0D2D3A]/15 bg-[#FAF7EE] flex items-center justify-center flex-shrink-0 text-[#0D2D3A]/30">
                          <ImageIcon className="h-6 w-6 stroke-[1.5]" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, "blendInfo")}
                          className="hidden"
                          id="bi-upload-field-enhanced"
                        />
                        <label
                          htmlFor="bi-upload-field-enhanced"
                          className="flex items-center justify-center gap-2 bg-[#0D2D3A] hover:bg-[#0D2D3A]/90 text-white border-transparent hover:border-[#B88A58]/50 rounded-xl px-4 py-3 font-bold cursor-pointer transition-all duration-200 text-center text-[11px] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-98"
                        >
                          <Upload className="h-3.5 w-3.5 text-[#B88A58]" />
                          <span>{language === "en" ? "Upload Cover Image" : "رفع صورة الغلاف"}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Story Card Title (English)" : "عنوان قصة البن (بالإنجليزي)"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Socotra Wild Ruby Reserve"
                      value={biNameEn}
                      onChange={(e) => setBiNameEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Story Card Title (Arabic)" : "عنوان قصة البن (بالعربي)"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محمية ياقوت سقطرى البري"
                      value={biNameAr}
                      onChange={(e) => setBiNameAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-bold"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: GEOGRAPHY & PROCESSING METHOD */}
              <div className="bg-white rounded-2xl p-5 border border-[#0D2D3A]/5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#0D2D3A]/5 text-[#B88A58]">
                  <Globe className="h-4 w-4" />
                  <span className="font-bold text-[11px] uppercase tracking-widest">
                    {language === "en" ? "2. Geography & Processing" : "٢. الجغرافيا والمعالجة"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Country */}
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Country / Origin (English)" : "موطن ومنشأ البن (بالإنجليزي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Yemen, Socotra Highlands"
                      value={biOriginEn}
                      onChange={(e) => setBiOriginEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Country / Origin (Arabic)" : "موطن ومنشأ البن (بالعربي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: اليمن، مرتفعات سقطرى"
                      value={biOriginAr}
                      onChange={(e) => setBiOriginAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-semibold"
                      dir="rtl"
                    />
                  </div>

                  {/* Growth Altitude */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Growth Altitude (English)" : "ارتفاع مزارع النمو (بالإنجليزي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1,900m - 2,200m"
                      value={biAltitudeEn}
                      onChange={(e) => setBiAltitudeEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Growth Altitude (Arabic)" : "ارتفاع مزارع النمو (بالعربي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: ۱,۹۰۰م - ۲,۲۰۰م"
                      value={biAltitudeAr}
                      onChange={(e) => setBiAltitudeAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-medium"
                      dir="rtl"
                    />
                  </div>

                  {/* Processing Method */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Processing Style (English)" : "أسلوب المعالجة (بالإنجليزي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Natural Anaerobic Maceration"
                      value={biProcessEn}
                      onChange={(e) => setBiProcessEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Processing Style (Arabic)" : "أسلوب المعالجة (بالعربي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تنقيع هوائي، معالجة مجففة"
                      value={biProcessAr}
                      onChange={(e) => setBiProcessAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-semibold"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: SENSORY & ROAST PROFILE */}
              <div className="bg-white rounded-2xl p-5 border border-[#0D2D3A]/5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#0D2D3A]/5 text-[#B88A58]">
                  <Award className="h-4 w-4" />
                  <span className="font-bold text-[11px] uppercase tracking-widest">
                    {language === "en" ? "3. Sensory & Roasting Profile" : "٣. التحميص والملف الحسي"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Roast Profile */}
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Roasting Profile (English)" : "مستوى ودرجة التحميص (بالإنجليزي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Medium Light Artisan Roast"
                      value={biRoastLevelEn}
                      onChange={(e) => setBiRoastLevelEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Roasting Profile (Arabic)" : "مستوى ودرجة التحميص (بالعربي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: حمصة متوسطة خفيفة حرفية"
                      value={biRoastLevelAr}
                      onChange={(e) => setBiRoastLevelAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-semibold"
                      dir="rtl"
                    />
                  </div>

                  {/* Flavor / Tasting Notes */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Tasting & Flavor Notes (English)" : "النكهات والإيحاءات الحسية (بالإنجليزي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Red Grapes, Cardamom, Honeycomb"
                      value={biNotesEn}
                      onChange={(e) => setBiNotesEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Tasting & Flavor Notes (Arabic)" : "النكهات والإيحاءات الحسية (بالعربي)"}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: عنب أحمر، هال، قرص عسل"
                      value={biNotesAr}
                      onChange={(e) => setBiNotesAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-semibold"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: NARRATIVE & MASTER STORY */}
              <div className="bg-white rounded-2xl p-5 border border-[#0D2D3A]/5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#0D2D3A]/5 text-[#B88A58]">
                  <Compass className="h-4 w-4" />
                  <span className="font-bold text-[11px] uppercase tracking-widest">
                    {language === "en" ? "4. Master Roaster's Story" : "٤. قصة ورواية البن الحرفية"}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Full Narrative Story (English)" : "القصة والوصف الكامل (باللغة الإنجليزية)"} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Recount the exquisite geographical journey, micro-lot details, or master artisan's comments regarding this coffee blend..."
                      value={biDescEn}
                      onChange={(e) => setBiDescEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 font-medium text-xs leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Full Narrative Story (Arabic)" : "القصة والوصف الكامل (باللغة العربية)"} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="اكتب فصول الحكاية الجغرافية، تفاصيل مزارع جبال سقطرى، أو انطباعات وملاحظات خبير التحميص الفنية لهذا الفنجان الفريد..."
                      value={biDescAr}
                      onChange={(e) => setBiDescAr(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:ring-2 focus:ring-[#B88A58]/15 focus:outline-none transition-all duration-200 text-right font-medium text-xs leading-relaxed"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 pb-2 border-t border-[#0D2D3A]/5">
                <button
                  type="button"
                  onClick={() => setShowBiModal(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer transition-colors active:scale-95"
                >
                  {language === "en" ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-8 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white font-bold rounded-xl uppercase tracking-wider shadow-md text-[10px] cursor-pointer transition-all duration-200 flex items-center gap-2 active:scale-95"
                >
                  {actionLoading ? (
                    <span>{language === "en" ? "Saving..." : "جاري الحفظ..."}</span>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      <span>{language === "en" ? "Publish Blend Info" : "نشر معلومات البن"}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* NEW MODAL 1: CREATE/EDIT CATEGORY POPUP */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-white rounded-3xl border border-[#0D2D3A]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir={language === "ar" ? "rtl" : "ltr"}>
            
            {/* Header */}
            <div className="bg-[#0D2D3A] text-white px-6 py-5 flex items-center justify-between border-b border-[#0D2D3A]/15">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-[#B88A58]" />
                <div>
                  <h3 className="font-display font-black text-base tracking-wide uppercase">
                    {editingCatId 
                      ? (language === "en" ? "Edit Category" : "تعديل الفئة") 
                      : (language === "en" ? "Create Dynamic Category" : "إنشاء فئة جديدة")}
                  </h3>
                  <p className="text-[10px] text-[#FAF7EE]/60 tracking-wider">
                    {language === "en" ? "Register or modify categorized visual workspace filters" : "تسجيل أو تعديل تبويبات التصفية والفئات التفاعلية"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditCategory}
                className="text-white/70 hover:text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1 bg-transparent border-0 rounded-lg cursor-pointer transition-all"
              >
                {language === "en" ? "Close (✕)" : "إغلاق (✕)"}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCategorySubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-xs text-[#0D2D3A] font-semibold">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Registry Channel" : "قناة تسجيل الفئة"}
                  </label>
                  <select
                    disabled={editingCatId !== null}
                    value={newCatType}
                    onChange={(e: any) => setNewCatType(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] disabled:opacity-50 font-bold"
                  >
                    <option value="menu">{language === "en" ? "Prepared Menus Category" : "فئة قائمة المشروبات"}</option>
                    <option value="blend">{language === "en" ? "Coffee Bags / Blends Category" : "فئة حبوب البن والخلطات"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Name (English)" : "الاسم (بالإنجليزي)"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "en" ? "e.g. Specialty Matcha" : "مثال: Specialty Matcha"}
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                  />
                </div>

                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Name (Arabic)" : "الاسم (بالعربي)"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "en" ? "e.g. ركن الماتشا المتخصص" : "مثال: ماتشا مميزة"}
                    value={newCatLabelAr}
                    onChange={(e) => setNewCatLabelAr(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0D2D3A]/5">
                <button
                  type="button"
                  onClick={handleCancelEditCategory}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer transition-colors active:scale-95"
                >
                  {language === "en" ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-8 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white font-bold rounded-xl uppercase tracking-wider shadow-md text-[10px] cursor-pointer transition-all duration-200 flex items-center gap-2 active:scale-95"
                >
                  {actionLoading ? (
                    <span>{language === "en" ? "Processing..." : "جاري الحفظ..."}</span>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 text-[#B88A58]" />
                      <span>{editingCatId ? (language === "en" ? "Save Changes" : "حفظ التغييرات") : (language === "en" ? "Create Category" : "إنشاء الفئة")}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* NEW MODAL 2: PUBLISH/EDIT STOREFRONT MEDIA POPUP */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl border border-[#0D2D3A]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir={language === "ar" ? "rtl" : "ltr"}>
            
            {/* Header */}
            <div className="bg-[#0D2D3A] text-white px-6 py-5 flex items-center justify-between border-b border-[#0D2D3A]/15">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-[#B88A58]" />
                <div>
                  <h3 className="font-display font-black text-base tracking-wide uppercase">
                    {editingGalleryId 
                      ? (language === "en" ? "Edit Gallery Item" : "تعديل عنصر المعرض") 
                      : (language === "en" ? "Publish Storefront Media" : "نشر عنصر جديد لمعرض المتجر")}
                  </h3>
                  <p className="text-[10px] text-[#FAF7EE]/60 tracking-wider">
                    {language === "en" ? "Add images, upload direct video clips, or link YouTube videos" : "إضافة صور، أو تحميل مقاطع فيديو مباشرة، أو ربط فيديوهات يوتيوب"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditGallery}
                className="text-white/70 hover:text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1 bg-transparent border-0 rounded-lg cursor-pointer transition-all"
              >
                {language === "en" ? "Close (✕)" : "إغلاق (✕)"}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddGallerySubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 text-xs text-[#0D2D3A] font-semibold">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Media Type Selection */}
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Media Type" : "نوع الوسائط"}
                  </label>
                  <select
                    value={newGalleryMediaType}
                    onChange={(e) => {
                      setNewGalleryMediaType(e.target.value as any);
                      setNewGalleryVideoUrl(""); // clear to avoid conflicts
                    }}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                  >
                    <option value="image">{language === "en" ? "📷 Image / Photo" : "📷 صورة فوتوغرافية"}</option>
                    <option value="video">{language === "en" ? "🎥 System Video Upload" : "🎥 تحميل فيديو من الجهاز"}</option>
                    <option value="youtube">{language === "en" ? "🔴 YouTube Video Link" : "🔴 فيديو يوتيوب"}</option>
                  </select>
                </div>

                {/* Display Sort Order */}
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Display Order Index" : "ترتيب العرض (الرقم الأصغر أولاً)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newGallerySortOrder}
                    onChange={(e) => setNewGallerySortOrder(Number(e.target.value))}
                    placeholder="e.g. 0, 1, 2"
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                  />
                </div>

                {/* Title (English) */}
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                    {language === "en" ? "Label (English)" : "العنوان (بالإنجليزية)"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "en" ? "e.g. Socotra Mountain Farm" : "مثال: مزارع جبال سقطرى"}
                    value={newGalleryTitleEn}
                    onChange={(e) => setNewGalleryTitleEn(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58]"
                  />
                </div>
              </div>

              {/* Title (Arabic) */}
              <div>
                <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px]">
                  {language === "en" ? "Label (Arabic)" : "العنوان (بالعربية)"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === "en" ? "e.g. مزارع جبال سقطرى" : "مثال: قطاف حبات الكرز الحمراء"}
                  value={newGalleryTitleAr}
                  onChange={(e) => setNewGalleryTitleAr(e.target.value)}
                  className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] text-right font-medium"
                />
              </div>

              {/* Conditional Video upload / YouTube Link Input */}
              {newGalleryMediaType === "youtube" && (
                <div>
                  <label className="block text-[#0D2D3A]/70 mb-1.5 uppercase font-bold tracking-wider text-[10px] text-[#B88A58]">
                    {language === "en" ? "YouTube Link / URL" : "رابط فيديو اليوتيوب المباشر"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newGalleryVideoUrl}
                    onChange={(e) => setNewGalleryVideoUrl(e.target.value)}
                    className="w-full bg-[#FAF7EE] border border-[#B88A58]/30 rounded-xl px-4 py-3 text-[#0D2D3A] focus:outline-none focus:border-[#B88A58] font-mono text-[11px]"
                  />
                </div>
              )}

              {newGalleryMediaType === "video" && (
                <div className="bg-[#FAF7EE]/50 p-4 rounded-2xl border border-dashed border-[#B88A58]/30 space-y-3">
                  <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px] text-[#B88A58]">
                    {language === "en" ? "Upload Video File from System" : "تحميل ملف فيديو من جهازك"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="video-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0D2D3A] hover:bg-[#0D2D3A]/90 text-white border-transparent hover:border-[#B88A58]/50 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#B88A58]" />
                        {language === "en" ? "Select Video File" : "اختر ملف الفيديو"}
                      </label>
                    </div>
                  </div>
                  {newGalleryVideoUrl ? (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        ✓ {language === "en" ? "Video uploaded & optimized locally!" : "تم رفع الفيديو ومعالجته محلياً بنجاح!"}
                      </span>
                      <video 
                        src={newGalleryVideoUrl} 
                        controls 
                        className="max-h-36 rounded-xl border border-[#0D2D3A]/10 bg-black/5 object-contain" 
                      />
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#0D2D3A]/50 font-normal italic">
                      {language === "en" ? "*Upload an .mp4 or .webm clip below 30MB." : "*يرجى رفع فيديو بصيغة mp4 أو webm لا يتعدى 30 ميجابايت."}
                    </p>
                  )}
                </div>
              )}

              {/* Graphic Cover/Thumbnail Uploader Section */}
              <div className="bg-[#FAF7EE]/40 p-4 rounded-2xl border border-dashed border-[#0D2D3A]/10 space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[#0D2D3A]/70 mb-1 uppercase font-bold tracking-wider text-[10px]">
                    {newGalleryMediaType === "image"
                      ? (language === "en" ? "Select Image File" : "اختر ملف الصورة")
                      : (language === "en" ? "Select Video Cover / Thumbnail (Optional)" : "اختر غلاف الصورة للفيديو (اختياري)")}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        id="gallery-img-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, "gallery")}
                        className="hidden"
                      />
                      <label
                        htmlFor="gallery-img-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0D2D3A] hover:bg-[#0D2D3A]/90 text-white border-transparent hover:border-[#B88A58]/50 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#B88A58]" />
                        {newGalleryMediaType === "image"
                          ? (language === "en" ? "Select Image File" : "اختر ملف الصورة")
                          : (language === "en" ? "Select Thumbnail" : "اختر صورة الغلاف")}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  {newGalleryImageUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-11 rounded-lg overflow-hidden border border-[#0D2D3A]/10 bg-white">
                        <img src={newGalleryImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-[#B88A58] font-bold">
                        {language === "en" ? "Image optimized successfully!" : "تم معالجة الصورة بنجاح!"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#0D2D3A]/50 font-normal italic">
                      {newGalleryMediaType === "image"
                        ? (language === "en" ? "*Upload a high-quality storefront photo." : "*يرجى رفع صورة للمتجر عالية الدقة.")
                        : (language === "en" ? "*Uploading a custom cover is recommended for visual consistency." : "*يوصى برفع صورة غلاف مخصصة لتناسق المظهر المرئي للمشغل.")}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0D2D3A]/5">
                <button
                  type="button"
                  onClick={handleCancelEditGallery}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer transition-colors active:scale-95"
                >
                  {language === "en" ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-8 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white font-bold rounded-xl uppercase tracking-wider shadow-md text-[10px] cursor-pointer transition-all duration-200 flex items-center gap-2 active:scale-95"
                >
                  {actionLoading ? (
                    <span>{language === "en" ? "Processing..." : "جاري المعالجة..."}</span>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>{editingGalleryId ? (language === "en" ? "Update Item" : "تحديث العنصر") : (language === "en" ? "Publish Item" : "نشر العنصر")}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* NEW MODAL 2: MENU PAGE CONTENT POPUP */}
      {isMenuContentModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-[2rem] border border-[#0D2D3A]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir={language === "ar" ? "rtl" : "ltr"}>
            <div className="bg-[#0D2D3A] text-white px-8 py-6 flex items-center justify-between border-b border-[#0D2D3A]/15">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#B88A58]" />
                <div>
                  <h3 className="font-display font-black text-lg tracking-wide uppercase">
                    {language === "en" ? "Menu Page Content" : "محتوى صفحة المنيو"}
                  </h3>
                  <p className="text-[10px] text-[#FAF7EE]/60 tracking-wider">
                    {language === "en" ? "Edit the headings and descriptions for the prepared drinks section" : "تعديل العناوين والأوصاف لقسم المشروبات الجاهزة"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuContentModalOpen(false)}
                className="text-white/70 hover:text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 text-xs font-semibold">
                  {/* Main Heading */}
                  <div className="space-y-2">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Main Heading" : "العنوان الرئيسي"}
                    </label>
                    <input
                      type="text"
                      value={menuMainHeadingEn}
                      onChange={(e) => setMenuMainHeadingEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:outline-none transition-all font-bold"
                    />
                  </div>

                  {/* Secondary Heading */}
                  <div className="space-y-2">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Secondary Heading" : "العنوان الفرعي"}
                    </label>
                    <input
                      type="text"
                      value={menuSubHeadingEn}
                      onChange={(e) => setMenuSubHeadingEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Page Description" : "وصف الصفحة"}
                    </label>
                    <textarea
                      rows={4}
                      value={menuDescriptionEn}
                      onChange={(e) => setMenuDescriptionEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:outline-none transition-all text-xs leading-relaxed"
                    />
                  </div>
                </div>
            </div>

            <div className="p-8 bg-[#FAF7EE]/50 border-t border-[#0D2D3A]/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMenuContentModalOpen(false)}
                className="px-6 py-3 text-[#0D2D3A]/60 hover:text-[#0D2D3A] font-bold text-xs uppercase tracking-widest transition-all"
              >
                {language === "en" ? "Close" : "إغلاق"}
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-8 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-[#B88A58]" />
                {language === "en" ? "Apply & Update" : "تطبيق وتحديث"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW MODAL 3: BLEND PAGE CONTENT POPUP */}
      {isBlendContentModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-[2rem] border border-[#0D2D3A]/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir={language === "ar" ? "rtl" : "ltr"}>
            <div className="bg-[#0D2D3A] text-white px-8 py-6 flex items-center justify-between border-b border-[#0D2D3A]/15">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#B88A58]" />
                <div>
                  <h3 className="font-display font-black text-lg tracking-wide uppercase">
                    {language === "en" ? "Blends Page Content" : "محتوى صفحة الخلطات"}
                  </h3>
                  <p className="text-[10px] text-[#FAF7EE]/60 tracking-wider">
                    {language === "en" ? "Edit the headings and descriptions for the coffee blends section" : "تعديل العناوين والأوصاف لقسم خلطات البن"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBlendContentModalOpen(false)}
                className="text-white/70 hover:text-white font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 text-xs font-semibold">
                  {/* Main Heading */}
                  <div className="space-y-2">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Main Heading" : "العنوان الرئيسي"}
                    </label>
                    <input
                      type="text"
                      value={blendMainHeadingEn}
                      onChange={(e) => setBlendMainHeadingEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:outline-none transition-all font-bold"
                    />
                  </div>

                  {/* Secondary Heading */}
                  <div className="space-y-2">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Secondary Heading" : "العنوان الفرعي"}
                    </label>
                    <input
                      type="text"
                      value={blendSubHeadingEn}
                      onChange={(e) => setBlendSubHeadingEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-[#0D2D3A]/70 uppercase font-bold tracking-wider text-[10px]">
                      {language === "en" ? "Page Description" : "وصف الصفحة"}
                    </label>
                    <textarea
                      rows={4}
                      value={blendDescriptionEn}
                      onChange={(e) => setBlendDescriptionEn(e.target.value)}
                      className="w-full bg-[#FAF7EE] border border-[#0D2D3A]/15 rounded-xl px-4 py-3 text-[#0D2D3A] focus:border-[#B88A58] focus:outline-none transition-all text-xs leading-relaxed"
                    />
                  </div>
                </div>
            </div>

            <div className="p-8 bg-[#FAF7EE]/50 border-t border-[#0D2D3A]/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBlendContentModalOpen(false)}
                className="px-6 py-3 text-[#0D2D3A]/60 hover:text-[#0D2D3A] font-bold text-xs uppercase tracking-widest transition-all"
              >
                {language === "en" ? "Close" : "إغلاق"}
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-8 py-3 bg-[#0D2D3A] hover:bg-[#B88A58] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-[#B88A58]" />
                {language === "en" ? "Apply & Update" : "تطبيق وتحديث"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
