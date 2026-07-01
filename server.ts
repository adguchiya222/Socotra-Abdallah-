import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Middleware to parse JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mutex to synchronize mutating write requests to the local JSON file database
let dbMutex = Promise.resolve();

app.use(async (req, res, next) => {
  if (req.method === "GET" || req.path === "/api/login") {
    return next();
  }

  let releaseLock: (() => void) | null = null;
  const nextPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  const previousPromise = dbMutex;
  dbMutex = nextPromise;

  try {
    await previousPromise;
  } catch (err) {
    console.error("Mutex chain error", err);
  }

  let released = false;
  const safeRelease = () => {
    if (!released) {
      released = true;
      if (releaseLock) releaseLock();
    }
  };

  res.on("finish", safeRelease);
  res.on("close", safeRelease);

  next();
});

const DEFAULT_MENU_CATEGORIES = [
  { id: "mc-1", key: "Turkish Bar", label: "Turkish Bar", labelAr: "الركن التركي" },
  { id: "mc-2", key: "Espresso Bar", label: "Espresso Specialty", labelAr: "قهوة إسبريسو" },
  { id: "mc-3", key: "Non Espresso Beverages", label: "Hot Non-Espresso", labelAr: "مشروبات ساخنة" },
  { id: "mc-4", key: "Iced Espresso Bar And Specialty Coffee Beverages", label: "Iced Specialty", labelAr: "مشروبات إسبريسو مثلجة" },
  { id: "mc-5", key: "Iced Matcha Drinks", label: "Iced Matcha", labelAr: "ايس ماتشا" },
  { id: "mc-6", key: "Frappe", label: "Frappé & Sweets", labelAr: "فرابيه وحلوى" },
  { id: "mc-7", key: "Refreshers", label: "Refreshers & Juices", labelAr: "مشروبات منعشة" },
  { id: "mc-8", key: "Baked Goods & Dessert", label: "Bakery", labelAr: "الكوكيز وحلويات" },
  { id: "mc-9", key: "Alternatives & Add-Ons", label: "Add-Ons", labelAr: "الإضافات" },
  { id: "mc-gen", key: "General", label: "General", labelAr: "عام" }
];

const DEFAULT_BLEND_CATEGORIES = [
  { id: "bc-1", key: "Plain Coffee", label: "Plain Coffee Bags", labelAr: "بن سادة" },
  { id: "bc-2", key: "Spiced Coffee", label: "Spiced Coffee Bags", labelAr: "بن محوج" },
  { id: "bc-3", key: "Espresso Beans", label: "Espresso Beans", labelAr: "حبوب الاسبريسو" },
  { id: "bc-4", key: "Single Origin Coffee", label: "Single Origin", labelAr: "بن منشأ واحد" },
  { id: "bc-5", key: "Coffee Supplements", label: "Supplements", labelAr: "مكملات القهوة" },
  { id: "bc-6", key: "Coffee Additives", label: "Additives", labelAr: "اضافات البن" },
  { id: "bc-gen", key: "General", label: "General", labelAr: "عام" }
];

const DEFAULT_SETTINGS = {
  contactPhones: ["010 1166 6167"],
  contactEmails: ["Socotra@admin.com"],
  locations: [
    {
      id: "l-1",
      nameEn: "Vivinz Mall",
      nameAr: "فيفينز مول - الدور الأول",
      addressEn: "Al Shorouk City, Cairo Governorate, Egypt",
      addressAr: "مدينة الشروق، محافظة القاهرة، مصر",
      isPrimary: true
    },
    {
      id: "l-2",
      nameEn: "Valio Mall",
      nameAr: "فاليو مول - الدور الأرضي",
      addressEn: "Al Shorouk City, Cairo Governorate, Egypt",
      addressAr: "مدينة الشروق، محافظة القاهرة، مصر",
      isPrimary: false
    }
  ],
  wholesaleNoteEn: "Call or message for wholesale orders or private bean reserves.",
  wholesaleNoteAr: "اتصل أو راسلنا لطلبات الجملة أو احتياطيات حبوب البن الخاصة."
};

// Helper to read database
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    let updated = false;
    
    if (!parsed.blends) { parsed.blends = []; updated = true; }
    if (!parsed.menus) { parsed.menus = []; updated = true; }
    if (!parsed.menuCategories || parsed.menuCategories.length === 0) {
      parsed.menuCategories = DEFAULT_MENU_CATEGORIES;
      updated = true;
    }
    if (!parsed.blendCategories || parsed.blendCategories.length === 0) {
      parsed.blendCategories = DEFAULT_BLEND_CATEGORIES;
      updated = true;
    }
    if (!parsed.gallery) { parsed.gallery = []; updated = true; }
    if (!parsed.blendInfos) { parsed.blendInfos = []; updated = true; }
    if (!parsed.settings) {
      parsed.settings = DEFAULT_SETTINGS;
      updated = true;
    } else {
      // Migrate phones to array if they are strings
      if (parsed.settings.contactPhone && typeof parsed.settings.contactPhone === "string") {
        parsed.settings.contactPhones = [parsed.settings.contactPhone];
        delete parsed.settings.contactPhone;
        updated = true;
      } else if (!parsed.settings.contactPhones) {
        parsed.settings.contactPhones = DEFAULT_SETTINGS.contactPhones;
        updated = true;
      }

      // Migrate emails to array if they are strings
      if (parsed.settings.contactEmail && typeof parsed.settings.contactEmail === "string") {
        parsed.settings.contactEmails = [parsed.settings.contactEmail];
        delete parsed.settings.contactEmail;
        updated = true;
      } else if (!parsed.settings.contactEmails) {
        parsed.settings.contactEmails = DEFAULT_SETTINGS.contactEmails;
        updated = true;
      }

      if (!parsed.settings.locations) {
      // Migrate from old location fields if they exist
      const l1Name = parsed.settings.location1NameEn || "Vivinz Mall";
      const l1NameAr = parsed.settings.location1NameAr || "فيفينز مول - الدور الأول";
      const l1Addr = parsed.settings.location1AddressEn || "Al Shorouk City, Cairo Governorate, Egypt";
      const l1AddrAr = parsed.settings.location1AddressAr || "مدينة الشروق، محافظة القاهرة، مصر";
      
      const l2Name = parsed.settings.location2NameEn || "Valio Mall";
      const l2NameAr = parsed.settings.location2NameAr || "فاليو مول - الدور الأرضي";
      const l2Addr = parsed.settings.location2AddressEn || "Al Shorouk City, Cairo Governorate, Egypt";
      const l2AddrAr = parsed.settings.location2AddressAr || "مدينة الشروق، محافظة القاهرة، مصر";

      parsed.settings.locations = [
        { id: "l-1", nameEn: l1Name, nameAr: l1NameAr, addressEn: l1Addr, addressAr: l1AddrAr, isPrimary: true },
        { id: "l-2", nameEn: l2Name, nameAr: l2NameAr, addressEn: l2Addr, addressAr: l2AddrAr, isPrimary: false }
      ];
      // Clean up old fields
      delete parsed.settings.location1NameEn;
      delete parsed.settings.location1NameAr;
      delete parsed.settings.location1AddressEn;
      delete parsed.settings.location1AddressAr;
      delete parsed.settings.location2NameEn;
      delete parsed.settings.location2NameAr;
      delete parsed.settings.location2AddressEn;
      delete parsed.settings.location2AddressAr;
      updated = true;
    }
  }

    if (updated) {
      await writeDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database file, returning default structure", err);
    return { 
      blends: [], 
      menus: [],
      menuCategories: DEFAULT_MENU_CATEGORIES,
      blendCategories: DEFAULT_BLEND_CATEGORIES,
      gallery: [],
      blendInfos: [],
      settings: DEFAULT_SETTINGS
    };
  }
}

// Helper to write database (Atomic Write-then-Rename pattern)
async function writeDB(data: any) {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const tempPath = DB_PATH + ".tmp";
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempPath, DB_PATH);
  } catch (err) {
    console.error("Error writing to database file", err);
    throw err;
  }
}

// Ensure database file exists on boot
async function ensureDB() {
  try {
    await fs.access(DB_PATH);
    // Trigger readDB to inject default arrays if missing
    await readDB();
  } catch {
    console.log("Database file does not exist, initializing empty structure");
    await writeDB({ 
      blends: [], 
      menus: [],
      menuCategories: DEFAULT_MENU_CATEGORIES,
      blendCategories: DEFAULT_BLEND_CATEGORIES,
      gallery: [],
      blendInfos: [],
      settings: DEFAULT_SETTINGS
    });
  }
}

// Start API Routes

// Authentication Endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  
  if (email === "Socotra@admin.com" && password === "coffeadmin") {
    return res.json({ 
      success: true, 
      token: "secret-admin-session-token-socotra",
      user: { email: "Socotra@admin.com", role: "admin" }
    });
  }
  
  return res.status(401).json({ 
    success: false, 
    message: "Invalid email or password. Please use Socotra@admin.com & coffeadmin." 
  });
});

// Bulk Reorder API Endpoint
app.put("/api/reorder", async (req, res) => {
  const { type, orders } = req.body;
  if (!type || !Array.isArray(orders)) {
    return res.status(400).json({ error: "Missing type or orders array" });
  }

  const db = await readDB();
  let listToUpdate: any[] = [];
  if (type === "menus") {
    listToUpdate = db.menus = db.menus || [];
  } else if (type === "blends") {
    listToUpdate = db.blends = db.blends || [];
  } else if (type === "gallery") {
    listToUpdate = db.gallery = db.gallery || [];
  } else if (type === "blendInfos") {
    listToUpdate = db.blendInfos = db.blendInfos || [];
  } else {
    return res.status(400).json({ error: "Invalid type for reordering" });
  }

  const orderMap = new Map<string, number>(
    orders.map((o: any) => [o.id, Number(o.sortOrder)])
  );

  listToUpdate.forEach((item: any) => {
    if (orderMap.has(item.id)) {
      item.sortOrder = orderMap.get(item.id);
    }
  });

  await writeDB(db);
  res.json({ success: true });
});

// Blends API Endpoints (CRUD)
app.get("/api/blends", async (req, res) => {
  const db = await readDB();
  res.json(db.blends || []);
});

app.post("/api/blends", async (req, res) => {
  const db = await readDB();
  const newItem = {
    id: "b-" + Date.now(),
    ...req.body
  };
  db.blends = db.blends || [];
  db.blends.push(newItem);
  await writeDB(db);
  res.status(201).json(newItem);
});

app.put("/api/blends/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.blends = db.blends || [];
  const idx = db.blends.findIndex((x: any) => x.id === id);
  if (idx !== -1) {
    db.blends[idx] = { ...db.blends[idx], ...req.body, id }; // retain id
    await writeDB(db);
    res.json(db.blends[idx]);
  } else {
    res.status(404).json({ message: "Blend item not found" });
  }
});

app.delete("/api/blends/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.blends = db.blends || [];
  const initialLen = db.blends.length;
  db.blends = db.blends.filter((x: any) => x.id !== id);
  
  if (db.blends.length < initialLen) {
    await writeDB(db);
    res.json({ success: true, message: "Blend successfully deleted" });
  } else {
    res.status(404).json({ message: "Blend item not found" });
  }
});

// Menus API Endpoints (CRUD)
app.get("/api/menus", async (req, res) => {
  const db = await readDB();
  res.json(db.menus || []);
});

app.post("/api/menus", async (req, res) => {
  const db = await readDB();
  const newItem = {
    id: "m-" + Date.now(),
    ...req.body
  };
  db.menus = db.menus || [];
  db.menus.push(newItem);
  await writeDB(db);
  res.status(201).json(newItem);
});

app.put("/api/menus/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.menus = db.menus || [];
  const idx = db.menus.findIndex((x: any) => x.id === id);
  if (idx !== -1) {
    db.menus[idx] = { ...db.menus[idx], ...req.body, id }; // retain id
    await writeDB(db);
    res.json(db.menus[idx]);
  } else {
    res.status(404).json({ message: "Menu item not found" });
  }
});

app.delete("/api/menus/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.menus = db.menus || [];
  const initialLen = db.menus.length;
  db.menus = db.menus.filter((x: any) => x.id !== id);
  
  if (db.menus.length < initialLen) {
    await writeDB(db);
    res.json({ success: true, message: "Menu successfully deleted" });
  } else {
    res.status(404).json({ message: "Menu item not found" });
  }
});

// Menu Categories API Endpoints
app.get("/api/categories/menus", async (req, res) => {
  const db = await readDB();
  res.json(db.menuCategories || []);
});

app.post("/api/categories/menus", async (req, res) => {
  const { label, labelAr } = req.body;
  if (!label || !labelAr) {
    return res.status(400).json({ message: "Label (EN) and Label (AR) are required." });
  }
  
  const db = await readDB();
  db.menuCategories = db.menuCategories || [];
  
  const key = label.trim();
  // Check if category already exists
  if (db.menuCategories.some((c: any) => c.key.toLowerCase() === key.toLowerCase())) {
    return res.status(400).json({ message: "A category with this name already exists." });
  }

  const newCat = {
    id: "mc-" + Date.now(),
    key,
    label: label.trim(),
    labelAr: labelAr.trim()
  };

  db.menuCategories.push(newCat);
  await writeDB(db);
  res.status(201).json(newCat);
});

app.put("/api/categories/menus/:id", async (req, res) => {
  const { id } = req.params;
  const { label, labelAr } = req.body;
  if (!label || !labelAr) {
    return res.status(400).json({ message: "Label (EN) and Label (AR) are required." });
  }

  const db = await readDB();
  db.menuCategories = db.menuCategories || [];
  const idx = db.menuCategories.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    const oldKey = db.menuCategories[idx].key;
    const newKey = label.trim();

    if (db.menuCategories.some((c: any) => c.id !== id && c.key.toLowerCase() === newKey.toLowerCase())) {
      return res.status(400).json({ message: "Another category with this name already exists." });
    }

    db.menuCategories[idx] = {
      ...db.menuCategories[idx],
      key: newKey,
      label: label.trim(),
      labelAr: labelAr.trim()
    };

    // Update associated menu items
    db.menus = db.menus || [];
    db.menus = db.menus.map((item: any) => {
      if (item.category === oldKey) {
        return {
          ...item,
          category: newKey,
          categoryAr: labelAr.trim()
        };
      }
      return item;
    });

    await writeDB(db);
    res.json(db.menuCategories[idx]);
  } else {
    res.status(404).json({ message: "Category not found." });
  }
});

app.delete("/api/categories/menus/:key", async (req, res) => {
  const { key } = req.params;
  if (key === "General") {
    return res.status(400).json({ message: "The default category 'General' cannot be deleted." });
  }

  const db = await readDB();
  db.menuCategories = db.menuCategories || [];
  const initialLen = db.menuCategories.length;
  db.menuCategories = db.menuCategories.filter((c: any) => c.key !== key);

  if (db.menuCategories.length < initialLen) {
    // Re-assign used categories to "General"
    db.menus = db.menus || [];
    db.menus = db.menus.map((item: any) => {
      if (item.category === key) {
        return {
          ...item,
          category: "General",
          categoryAr: "عام"
        };
      }
      return item;
    });

    await writeDB(db);
    res.json({ success: true, message: `Category '${key}' successfully deleted and associated products assigned to All Menus (General).` });
  } else {
    res.status(404).json({ message: "Category not found." });
  }
});

// Blend Categories API Endpoints
app.get("/api/categories/blends", async (req, res) => {
  const db = await readDB();
  res.json(db.blendCategories || []);
});

app.post("/api/categories/blends", async (req, res) => {
  const { label, labelAr } = req.body;
  if (!label || !labelAr) {
    return res.status(400).json({ message: "Label (EN) and Label (AR) are required." });
  }

  const db = await readDB();
  db.blendCategories = db.blendCategories || [];

  const key = label.trim();
  if (db.blendCategories.some((c: any) => c.key.toLowerCase() === key.toLowerCase())) {
    return res.status(400).json({ message: "A category with this name already exists." });
  }

  const newCat = {
    id: "bc-" + Date.now(),
    key,
    label: label.trim(),
    labelAr: labelAr.trim()
  };

  db.blendCategories.push(newCat);
  await writeDB(db);
  res.status(201).json(newCat);
});

app.put("/api/categories/blends/:id", async (req, res) => {
  const { id } = req.params;
  const { label, labelAr } = req.body;
  if (!label || !labelAr) {
    return res.status(400).json({ message: "Label (EN) and Label (AR) are required." });
  }

  const db = await readDB();
  db.blendCategories = db.blendCategories || [];
  const idx = db.blendCategories.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    const oldKey = db.blendCategories[idx].key;
    const newKey = label.trim();

    if (db.blendCategories.some((c: any) => c.id !== id && c.key.toLowerCase() === newKey.toLowerCase())) {
      return res.status(400).json({ message: "Another category with this name already exists." });
    }

    db.blendCategories[idx] = {
      ...db.blendCategories[idx],
      key: newKey,
      label: label.trim(),
      labelAr: labelAr.trim()
    };

    // Update associated blend items
    db.blends = db.blends || [];
    db.blends = db.blends.map((item: any) => {
      if (item.category === oldKey) {
        return {
          ...item,
          category: newKey,
          categoryAr: labelAr.trim()
        };
      }
      return item;
    });

    await writeDB(db);
    res.json(db.blendCategories[idx]);
  } else {
    res.status(404).json({ message: "Category not found." });
  }
});

app.delete("/api/categories/blends/:key", async (req, res) => {
  const { key } = req.params;
  if (key === "General") {
    return res.status(400).json({ message: "The default category 'General' cannot be deleted." });
  }

  const db = await readDB();
  db.blendCategories = db.blendCategories || [];
  const initialLen = db.blendCategories.length;
  db.blendCategories = db.blendCategories.filter((c: any) => c.key !== key);

  if (db.blendCategories.length < initialLen) {
    // Re-assign used categories to "General"
    db.blends = db.blends || [];
    db.blends = db.blends.map((item: any) => {
      if (item.category === key) {
        return {
          ...item,
          category: "General",
          categoryAr: "عام"
        };
      }
      return item;
    });

    await writeDB(db);
    res.json({ success: true, message: `Category '${key}' successfully deleted and associated products assigned to All Blends (General).` });
  } else {
    res.status(404).json({ message: "Category not found." });
  }
});

// Gallery Items API Endpoints (CRUD)
app.get("/api/gallery", async (req, res) => {
  const db = await readDB();
  res.json(db.gallery || []);
});

app.post("/api/gallery", async (req, res) => {
  const { titleEn, titleAr, imageUrl, mediaType, videoUrl, sortOrder } = req.body;
  const isImage = !mediaType || mediaType === "image";
  if (isImage && !imageUrl) {
    return res.status(400).json({ message: "Image is required." });
  }
  if (!isImage && !videoUrl) {
    return res.status(400).json({ message: "Video source or link is required." });
  }

  const db = await readDB();
  db.gallery = db.gallery || [];

  const newItem = {
    id: "g-" + Date.now(),
    titleEn: titleEn ? titleEn.trim() : (isImage ? "Gallery Photo" : "Gallery Video"),
    titleAr: titleAr ? titleAr.trim() : (isImage ? "صورة لمعرض الصور" : "فيديو لمعرض الصور"),
    imageUrl: imageUrl || "",
    mediaType: mediaType || "image",
    videoUrl: videoUrl || "",
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0
  };

  db.gallery.push(newItem);
  await writeDB(db);
  res.status(201).json(newItem);
});

app.put("/api/gallery/:id", async (req, res) => {
  const { id } = req.params;
  const { titleEn, titleAr, imageUrl, mediaType, videoUrl, sortOrder } = req.body;
  
  const db = await readDB();
  db.gallery = db.gallery || [];
  const idx = db.gallery.findIndex((x: any) => x.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Gallery item not found" });
  }

  const isImage = !mediaType || mediaType === "image";
  if (isImage && !imageUrl) {
    return res.status(400).json({ message: "Image is required." });
  }
  if (!isImage && !videoUrl) {
    return res.status(400).json({ message: "Video source or link is required." });
  }

  db.gallery[idx] = {
    ...db.gallery[idx],
    titleEn: titleEn ? titleEn.trim() : db.gallery[idx].titleEn,
    titleAr: titleAr ? titleAr.trim() : db.gallery[idx].titleAr,
    imageUrl: imageUrl || "",
    mediaType: mediaType || "image",
    videoUrl: videoUrl || "",
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0
  };

  await writeDB(db);
  res.json(db.gallery[idx]);
});

app.delete("/api/gallery/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.gallery = db.gallery || [];
  const initialLen = db.gallery.length;
  db.gallery = db.gallery.filter((x: any) => x.id !== id);

  if (db.gallery.length < initialLen) {
    await writeDB(db);
    res.json({ success: true, message: "Gallery image successfully deleted" });
  } else {
    res.status(404).json({ message: "Gallery item not found" });
  }
});

// Blend Infos API Endpoints (CRUD)
app.get("/api/blend-infos", async (req, res) => {
  const db = await readDB();
  res.json(db.blendInfos || []);
});

app.post("/api/blend-infos", async (req, res) => {
  const db = await readDB();
  const newItem = {
    id: "bi-" + Date.now(),
    ...req.body
  };
  db.blendInfos = db.blendInfos || [];
  db.blendInfos.push(newItem);
  await writeDB(db);
  res.status(201).json(newItem);
});

app.put("/api/blend-infos/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.blendInfos = db.blendInfos || [];
  const idx = db.blendInfos.findIndex((x: any) => x.id === id);
  if (idx !== -1) {
    db.blendInfos[idx] = { ...db.blendInfos[idx], ...req.body, id }; // retain id
    await writeDB(db);
    res.json(db.blendInfos[idx]);
  } else {
    res.status(404).json({ message: "Blend info not found" });
  }
});

app.delete("/api/blend-infos/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.blendInfos = db.blendInfos || [];
  const initialLen = db.blendInfos.length;
  db.blendInfos = db.blendInfos.filter((x: any) => x.id !== id);
  
  if (db.blendInfos.length < initialLen) {
    await writeDB(db);
    res.json({ success: true, message: "Blend info successfully deleted" });
  } else {
    res.status(404).json({ message: "Blend info not found" });
  }
});

// Store Settings APIs
app.get("/api/settings", async (req, res) => {
  const db = await readDB();
  res.json(db.settings || DEFAULT_SETTINGS);
});

app.put("/api/settings", async (req, res) => {
  const db = await readDB();
  db.settings = {
    ...(db.settings || DEFAULT_SETTINGS),
    ...req.body
  };
  await writeDB(db);
  res.json(db.settings);
});

// Configure Vite or Static Files
async function setupServer() {
  await ensureDB();

  if (process.env.NODE_ENV !== "production") {
    // In development, Vite runs as a separate process (handles frontend + proxies API).
    // This server only provides the API endpoints.
    console.log("Starting API server in development mode (Vite runs separately)...");
  } else {
    console.log("Serving static files for production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
