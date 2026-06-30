export interface CoffeeBlend {
  id: string;
  category: string; // e.g. "Plain Coffee" (بن سادة), "Spiced Coffee" (بن محوج)
  categoryAr: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  priceKilo?: number;     // e.g. 640
  priceQuarter?: number;  // e.g. 160
  priceEighth?: number;   // e.g. 80
  imageUrl?: string;      // URL or base64 data string
  sortOrder?: number;
}

export interface MenuItem {
  id: string;
  category: string; // e.g. "Turkish Bar", "Espresso Bar", "Frappe", "Refreshers"
  categoryAr: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  priceSingle?: number; // Price of smaller size / single shot (e.g. 35)
  priceDouble?: number; // Price of larger size / double shot (e.g. 50), optional
  imageUrl?: string;    // URL or base64 data string
  sortOrder?: number;
}

export interface DBState {
  blends: CoffeeBlend[];
  menus: MenuItem[];
  menuCategories?: MenuCategory[];
  blendCategories?: BlendCategory[];
  gallery?: GalleryItem[];
  blendInfos?: BlendInfo[];
  settings?: StoreSettings;
}

export interface StoreLocation {
  id: string;
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  isPrimary?: boolean;
}

export interface StoreSettings {
  contactPhones: string[];
  contactEmails: string[];
  locations?: StoreLocation[];
  wholesaleNoteEn: string;
  wholesaleNoteAr: string;
  // Menu Page Content
  menuMainHeadingEn?: string;
  menuMainHeadingAr?: string;
  menuSubHeadingEn?: string;
  menuSubHeadingAr?: string;
  menuDescriptionEn?: string;
  menuDescriptionAr?: string;
  // Blends Page Content
  blendMainHeadingEn?: string;
  blendMainHeadingAr?: string;
  blendSubHeadingEn?: string;
  blendSubHeadingAr?: string;
  blendDescriptionEn?: string;
  blendDescriptionAr?: string;
}

export interface MenuCategory {
  id: string;
  key: string;  // acts as the category identifier used in item.category
  label: string;
  labelAr: string;
}

export interface BlendCategory {
  id: string;
  key: string;  // acts as the category identifier used in item.category
  label: string;
  labelAr: string;
}

export interface GalleryItem {
  id: string;
  titleEn: string;
  titleAr: string;
  imageUrl: string; // can be empty/optional or serve as cover/thumbnail for videos
  mediaType?: "image" | "video" | "youtube";
  videoUrl?: string;
  sortOrder?: number;
}

export interface BlendInfo {
  id: string;
  blendId: string; // references CoffeeBlend.id
  nameEn: string;
  nameAr: string;
  imageUrl?: string;
  originEn?: string;
  originAr?: string;
  processEn?: string;
  processAr?: string;
  roastLevelEn?: string;
  roastLevelAr?: string;
  altitudeEn?: string;
  altitudeAr?: string;
  notesEn?: string;
  notesAr?: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder?: number;
}
