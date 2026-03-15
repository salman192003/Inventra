/**
 * Seed script — "Bean & Bloom" Online Coffee & Bakery Shop
 *
 * An e-commerce store that ships freshly roasted beans, pastry gift boxes,
 * brewing equipment, branded merch, and subscription bundles nationwide.
 *
 * Run with:  cd backend && npx tsx src/db/seeds/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────

function d(dateStr: string) {
  return new Date(dateStr);
}

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding Bean & Bloom online coffee & bakery …");

  // ── 0. Cleanup existing data ────────────────────────────────────────────

  console.log("  🧹 Cleaning up existing data...");
  
  await prisma.$transaction([
    prisma.notification.deleteMany({}),
    prisma.recommendation.deleteMany({}),
    prisma.forecast.deleteMany({}),
    prisma.expense.deleteMany({}),
    prisma.cashflowEvent.deleteMany({}),
    prisma.saleItem.deleteMany({}),
    prisma.sale.deleteMany({}),
    prisma.inventoryMovement.deleteMany({}),
    prisma.customer.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.supplier.deleteMany({}),
    prisma.category.deleteMany({}),
    prisma.settings.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.branch.deleteMany({}),
    prisma.business.deleteMany({}),
  ]);

  console.log("  ✅ Database cleaned");

  // ── 1. Business ──────────────────────────────────────────────────────────

  const business = await prisma.business.create({
    data: {
      name: "Bean & Bloom",
      slug: "bean-and-bloom",
      email: "hello@beanandbloom.co",
      phone: "+1-555-BREW-123",
      address: "1200 Roastery Lane, Portland, OR 97201",
      country: "United States",
      currency: "USD",
      timezone: "America/Los_Angeles",
      isActive: true,
    },
  });

  const biz = business.id;
  console.log("  ✅ Business created:", business.name);

  // ── 2. Owner user ────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const owner = await prisma.user.create({
    data: {
      businessId: biz,
      email: "admin@beanandbloom.co",
      passwordHash,
      fullName: "Maya Chen",
      isOwner: true,
      isActive: true,
    },
  });

  console.log("  ✅ Owner user created:", owner.email);

  // ── 3. Branches (online fulfillment model) ──────────────────────────────

  const [warehouse, pickup] = await Promise.all([
    prisma.branch.create({
      data: {
        businessId: biz,
        name: "Fulfillment Warehouse",
        address: "1200 Roastery Lane, Bldg B, Portland, OR 97201",
        phone: "+1-555-BREW-100",
        isActive: true,
      },
    }),
    prisma.branch.create({
      data: {
        businessId: biz,
        name: "Local Pickup Point",
        address: "88 NW 23rd Ave, Portland, OR 97210",
        phone: "+1-555-BREW-200",
        isActive: true,
      },
    }),
  ]);

  console.log("  ✅ 2 branches created");

  // ── 4. Categories & subcategories ────────────────────────────────────────

  type CatDef = { name: string; desc: string; subs?: { name: string; desc: string }[] };

  const catDefs: CatDef[] = [
    {
      name: "Coffee Beans",
      desc: "Freshly roasted whole-bean and ground coffee",
      subs: [
        { name: "Single Origin", desc: "Beans from a single farm/region" },
        { name: "House Blends", desc: "Our signature multi-origin blends" },
        { name: "Decaf", desc: "Swiss Water Process decaf options" },
      ],
    },
    {
      name: "Bakery",
      desc: "Artisan pastries and baked goods",
      subs: [
        { name: "Cookies & Biscotti", desc: "Crunchy and chewy treats" },
        { name: "Cakes & Tarts", desc: "Whole cakes and tarts for delivery" },
        { name: "Bread & Rolls", desc: "Sourdough and specialty breads" },
        { name: "Gift Boxes", desc: "Curated pastry assortment boxes" },
      ],
    },
    {
      name: "Brewing Equipment",
      desc: "Pour-over, espresso, and filter gear",
      subs: [
        { name: "Pour Over", desc: "V60, Chemex, Kalita accessories" },
        { name: "Espresso", desc: "Portafilters, tampers, and machines" },
        { name: "Grinders", desc: "Hand and electric grinders" },
      ],
    },
    {
      name: "Merchandise",
      desc: "Branded mugs, tumblers, and apparel",
      subs: [
        { name: "Drinkware", desc: "Mugs and tumblers" },
        { name: "Apparel", desc: "Tees, caps, and aprons" },
      ],
    },
    {
      name: "Subscriptions",
      desc: "Recurring bean and treat bundles",
    },
    {
      name: "Tea & Alternatives",
      desc: "Loose-leaf teas, matcha, and cacao",
    },
  ];

  const categoryMap: Record<string, string> = {}; // name → id

  for (const cat of catDefs) {
    const parent = await prisma.category.create({
      data: { businessId: biz, name: cat.name, description: cat.desc },
    });
    categoryMap[cat.name] = parent.id;

    if (cat.subs) {
      for (const sub of cat.subs) {
        const child = await prisma.category.create({
          data: {
            businessId: biz,
            parentId: parent.id,
            name: sub.name,
            description: sub.desc,
          },
        });
        categoryMap[sub.name] = child.id;
      }
    }
  }

  console.log(`  ✅ ${Object.keys(categoryMap).length} categories created`);

  // ── 5. Suppliers ─────────────────────────────────────────────────────────

  const supplierDefs = [
    { name: "Finca El Paraíso", contactName: "Carlos Méndez", email: "carlos@fincaelparaiso.co", phone: "+57-311-555-0101", address: "Cauca, Colombia", notes: "Single-origin Colombian lots, washed & honey" },
    { name: "Yirgacheffe Direct", contactName: "Aster Bekele", email: "aster@yirgacheffedirect.et", phone: "+251-91-555-0202", address: "Gedeo Zone, Ethiopia", notes: "Natural & washed Ethiopian lots" },
    { name: "Sumatra Heritage Co.", contactName: "Dewi Kartika", email: "dewi@sumatraheritage.id", phone: "+62-821-555-0303", address: "Aceh, Indonesia", notes: "Wet-hulled Mandheling & Gayo" },
    { name: "Portland Flour Mill", contactName: "Jake Torres", email: "jake@pdxflourmill.com", phone: "+1-503-555-0404", address: "2100 SE Industrial Way, Portland, OR", notes: "Organic stone-milled flours" },
    { name: "Sweet Valley Dairy", contactName: "Emily Park", email: "emily@sweetvalleydairy.com", phone: "+1-503-555-0505", address: "Tillamook, OR", notes: "Butter, cream, eggs" },
    { name: "Hario USA", contactName: "Ken Yamamoto", email: "ken@hariousa.com", phone: "+1-310-555-0606", address: "Los Angeles, CA", notes: "V60 drippers, scales, kettles" },
    { name: "Mazzer America", contactName: "Gina Rossi", email: "gina@mazzer.us", phone: "+1-206-555-0707", address: "Seattle, WA", notes: "Commercial & home grinders" },
    { name: "PrintFresh Apparel", contactName: "Zoe Kim", email: "zoe@printfresh.co", phone: "+1-971-555-0808", address: "Portland, OR", notes: "Custom branded merch printing" },
  ];

  const suppliers: { id: string; name: string }[] = [];
  for (const s of supplierDefs) {
    const created = await prisma.supplier.create({
      data: { businessId: biz, ...s },
    });
    suppliers.push({ id: created.id, name: created.name });
  }

  const sup = (name: string) => suppliers.find((s) => s.name === name)!.id;
  console.log(`  ✅ ${suppliers.length} suppliers created`);

  // ── 6. Products (50 SKUs) ───────────────────────────────────────────────

  interface ProdDef {
    name: string; sku: string; category: string; supplier: string;
    cost: number; price: number; unit?: string; reorder: number; reorderQty: number;
    barcode?: string; desc?: string;
  }

  const productDefs: ProdDef[] = [
    // ── Coffee Beans — Single Origin
    { name: "Colombia El Paraíso – Washed", sku: "CB-COL-W-250", category: "Single Origin", supplier: "Finca El Paraíso", cost: 7.50, price: 18.00, unit: "bag", reorder: 40, reorderQty: 100, desc: "250g bag. Bright citrus, caramel body." },
    { name: "Colombia El Paraíso – Honey", sku: "CB-COL-H-250", category: "Single Origin", supplier: "Finca El Paraíso", cost: 8.00, price: 19.50, unit: "bag", reorder: 30, reorderQty: 80, desc: "250g bag. Tropical fruit, syrupy sweetness." },
    { name: "Ethiopia Yirgacheffe – Natural", sku: "CB-ETH-N-250", category: "Single Origin", supplier: "Yirgacheffe Direct", cost: 8.50, price: 20.00, unit: "bag", reorder: 35, reorderQty: 90, desc: "250g bag. Blueberry, jasmine, wine-like." },
    { name: "Ethiopia Yirgacheffe – Washed", sku: "CB-ETH-W-250", category: "Single Origin", supplier: "Yirgacheffe Direct", cost: 8.00, price: 19.00, unit: "bag", reorder: 30, reorderQty: 80, desc: "250g bag. Lemon, bergamot, tea-like." },
    { name: "Sumatra Mandheling – Dark", sku: "CB-SUM-D-250", category: "Single Origin", supplier: "Sumatra Heritage Co.", cost: 6.50, price: 16.50, unit: "bag", reorder: 25, reorderQty: 60, desc: "250g bag. Earthy, cedar, chocolate." },
    { name: "Sumatra Gayo – Medium", sku: "CB-SUM-M-250", category: "Single Origin", supplier: "Sumatra Heritage Co.", cost: 7.00, price: 17.50, unit: "bag", reorder: 25, reorderQty: 60, desc: "250g bag. Herbal, tobacco, brown sugar." },
    { name: "Colombia 1 kg Bulk – Washed", sku: "CB-COL-W-1KG", category: "Single Origin", supplier: "Finca El Paraíso", cost: 22.00, price: 52.00, unit: "bag", reorder: 15, reorderQty: 40, desc: "1 kg bag for serious home brewers." },
    { name: "Ethiopia 1 kg Bulk – Natural", sku: "CB-ETH-N-1KG", category: "Single Origin", supplier: "Yirgacheffe Direct", cost: 25.00, price: 58.00, unit: "bag", reorder: 10, reorderQty: 30, desc: "1 kg bag, fruit bomb." },

    // ── Coffee Beans — House Blends
    { name: "Morning Bloom Blend", sku: "CB-BLD-MORN", category: "House Blends", supplier: "Finca El Paraíso", cost: 6.00, price: 15.00, unit: "bag", reorder: 50, reorderQty: 120, desc: "250g. Our flagship — nutty, chocolate, balanced." },
    { name: "Midnight Roast Blend", sku: "CB-BLD-MIDN", category: "House Blends", supplier: "Sumatra Heritage Co.", cost: 5.80, price: 14.50, unit: "bag", reorder: 40, reorderQty: 100, desc: "250g. Bold, smoky, bittersweet." },
    { name: "Espresso Crema Blend", sku: "CB-BLD-ESPR", category: "House Blends", supplier: "Finca El Paraíso", cost: 6.50, price: 16.00, unit: "bag", reorder: 45, reorderQty: 100, desc: "250g. Thick crema, dark chocolate, hazelnut." },

    // ── Coffee Beans — Decaf
    { name: "Swiss Water Decaf – Colombia", sku: "CB-DEC-COL", category: "Decaf", supplier: "Finca El Paraíso", cost: 8.00, price: 19.00, unit: "bag", reorder: 20, reorderQty: 50, desc: "250g. All the flavor, none of the buzz." },
    { name: "Swiss Water Decaf – Ethiopia", sku: "CB-DEC-ETH", category: "Decaf", supplier: "Yirgacheffe Direct", cost: 8.50, price: 20.00, unit: "bag", reorder: 15, reorderQty: 40, desc: "250g. Floral decaf." },

    // ── Bakery — Cookies & Biscotti
    { name: "Classic Chocolate Chip Cookies (6-pack)", sku: "BK-CCC-6", category: "Cookies & Biscotti", supplier: "Portland Flour Mill", cost: 3.00, price: 8.50, unit: "box", reorder: 30, reorderQty: 60, desc: "Six thick, chewy cookies." },
    { name: "Almond Biscotti (8-pack)", sku: "BK-BIS-ALM", category: "Cookies & Biscotti", supplier: "Portland Flour Mill", cost: 3.50, price: 9.00, unit: "box", reorder: 25, reorderQty: 50, desc: "Crunchy twice-baked, perfect with espresso." },
    { name: "Espresso Shortbread Tin", sku: "BK-SHB-ESP", category: "Cookies & Biscotti", supplier: "Portland Flour Mill", cost: 4.00, price: 12.00, unit: "tin", reorder: 20, reorderQty: 40, desc: "12 espresso-infused butter shortbreads in a keepsake tin." },

    // ── Bakery — Cakes & Tarts
    { name: "Tiramisu Cake (8-inch)", sku: "BK-TMC-8", category: "Cakes & Tarts", supplier: "Sweet Valley Dairy", cost: 12.00, price: 38.00, unit: "pcs", reorder: 8, reorderQty: 15, desc: "Mascarpone, espresso ladyfingers, cocoa." },
    { name: "Lemon Tart (6-inch)", sku: "BK-LMT-6", category: "Cakes & Tarts", supplier: "Sweet Valley Dairy", cost: 6.00, price: 18.00, unit: "pcs", reorder: 10, reorderQty: 20, desc: "Buttery crust, tangy curd, torched meringue." },
    { name: "Carrot Cake Loaf", sku: "BK-CRT-LOAF", category: "Cakes & Tarts", supplier: "Portland Flour Mill", cost: 5.50, price: 16.00, unit: "pcs", reorder: 12, reorderQty: 25, desc: "Moist spiced loaf with cream cheese frosting." },

    // ── Bakery — Bread & Rolls
    { name: "Sourdough Boule", sku: "BK-SD-BOULE", category: "Bread & Rolls", supplier: "Portland Flour Mill", cost: 2.50, price: 7.50, unit: "pcs", reorder: 20, reorderQty: 40, desc: "Crusty, tangy, 48-hr ferment." },
    { name: "Cinnamon Raisin Rolls (4-pack)", sku: "BK-CRR-4", category: "Bread & Rolls", supplier: "Portland Flour Mill", cost: 3.00, price: 9.50, unit: "box", reorder: 15, reorderQty: 30, desc: "Soft, swirled rolls." },

    // ── Bakery — Gift Boxes
    { name: "Coffee Lover's Pastry Box", sku: "BK-GFT-CLB", category: "Gift Boxes", supplier: "Portland Flour Mill", cost: 10.00, price: 32.00, unit: "box", reorder: 10, reorderQty: 25, desc: "Biscotti, shortbread, chocolate cookies + 250g beans." },
    { name: "Weekend Brunch Box", sku: "BK-GFT-BRN", category: "Gift Boxes", supplier: "Sweet Valley Dairy", cost: 14.00, price: 42.00, unit: "box", reorder: 8, reorderQty: 15, desc: "Sourdough, cinnamon rolls, butter, jam, and coffee." },
    { name: "Birthday Celebration Box", sku: "BK-GFT-BDAY", category: "Gift Boxes", supplier: "Sweet Valley Dairy", cost: 16.00, price: 48.00, unit: "box", reorder: 6, reorderQty: 12, desc: "Cake, cookies, candles, and a 250g bag of beans." },

    // ── Brewing Equipment — Pour Over
    { name: "Hario V60 Dripper (Ceramic)", sku: "EQ-V60-CER", category: "Pour Over", supplier: "Hario USA", cost: 14.00, price: 28.00, unit: "pcs", reorder: 10, reorderQty: 25, desc: "Size 02 ceramic V60." },
    { name: "Hario V60 Paper Filters (100-ct)", sku: "EQ-V60-FLT", category: "Pour Over", supplier: "Hario USA", cost: 4.00, price: 9.00, unit: "box", reorder: 30, reorderQty: 60, desc: "Tabbed bleached filters." },
    { name: "Chemex 6-Cup Classic", sku: "EQ-CHE-6C", category: "Pour Over", supplier: "Hario USA", cost: 24.00, price: 48.00, unit: "pcs", reorder: 8, reorderQty: 15, desc: "Iconic hourglass brewer." },
    { name: "Gooseneck Kettle (1L)", sku: "EQ-KTL-GSN", category: "Pour Over", supplier: "Hario USA", cost: 32.00, price: 65.00, unit: "pcs", reorder: 5, reorderQty: 10, desc: "Variable-temp stainless steel kettle." },

    // ── Brewing Equipment — Espresso
    { name: "Bottomless Portafilter 58mm", sku: "EQ-PF-58", category: "Espresso", supplier: "Mazzer America", cost: 18.00, price: 38.00, unit: "pcs", reorder: 5, reorderQty: 10, desc: "Walnut handle, 58mm basket." },
    { name: "Precision Tamper 58mm", sku: "EQ-TMP-58", category: "Espresso", supplier: "Mazzer America", cost: 22.00, price: 45.00, unit: "pcs", reorder: 5, reorderQty: 10, desc: "Calibrated spring, flat base." },
    { name: "WDT Distribution Tool", sku: "EQ-WDT-01", category: "Espresso", supplier: "Mazzer America", cost: 8.00, price: 18.00, unit: "pcs", reorder: 10, reorderQty: 20, desc: "0.3mm needles, ergonomic grip." },

    // ── Brewing Equipment — Grinders
    { name: "Mazzer Mini Electronic A", sku: "EQ-GRD-MINI", category: "Grinders", supplier: "Mazzer America", cost: 320.00, price: 580.00, unit: "pcs", reorder: 2, reorderQty: 5, desc: "Flat burr home espresso grinder." },
    { name: "Hand Grinder – Ceramic Burr", sku: "EQ-GRD-HND", category: "Grinders", supplier: "Hario USA", cost: 22.00, price: 45.00, unit: "pcs", reorder: 8, reorderQty: 15, desc: "Hario Skerton Plus manual grinder." },

    // ── Merchandise — Drinkware
    { name: "Bean & Bloom Ceramic Mug (12oz)", sku: "MR-MUG-12", category: "Drinkware", supplier: "PrintFresh Apparel", cost: 4.50, price: 14.00, unit: "pcs", reorder: 25, reorderQty: 60, desc: "Hand-thrown look, B&B logo." },
    { name: "Bean & Bloom Tumbler (16oz)", sku: "MR-TMB-16", category: "Drinkware", supplier: "PrintFresh Apparel", cost: 8.00, price: 24.00, unit: "pcs", reorder: 15, reorderQty: 30, desc: "Double-wall vacuum insulated." },
    { name: "Espresso Cup Set (2-pack)", sku: "MR-ESP-2PK", category: "Drinkware", supplier: "PrintFresh Apparel", cost: 6.00, price: 18.00, unit: "set", reorder: 12, reorderQty: 25, desc: "3oz double-wall glass cups." },

    // ── Merchandise — Apparel
    { name: "Bean & Bloom Classic Tee (Unisex)", sku: "MR-TEE-UNI", category: "Apparel", supplier: "PrintFresh Apparel", cost: 8.00, price: 28.00, unit: "pcs", reorder: 20, reorderQty: 50, desc: "Organic cotton, screen-printed." },
    { name: "Barista Apron – Canvas", sku: "MR-APR-CVS", category: "Apparel", supplier: "PrintFresh Apparel", cost: 12.00, price: 35.00, unit: "pcs", reorder: 10, reorderQty: 20, desc: "Waxed canvas with leather straps." },
    { name: "Embroidered Dad Cap", sku: "MR-CAP-DAD", category: "Apparel", supplier: "PrintFresh Apparel", cost: 6.00, price: 22.00, unit: "pcs", reorder: 15, reorderQty: 30, desc: "Relaxed fit, embroidered logo." },

    // ── Subscriptions
    { name: "Monthly Bean Box – Explorer", sku: "SUB-BEAN-EXP", category: "Subscriptions", supplier: "Finca El Paraíso", cost: 14.00, price: 36.00, unit: "box", reorder: 20, reorderQty: 50, desc: "2x 250g rotating single origins." },
    { name: "Monthly Bean Box – Connoisseur", sku: "SUB-BEAN-CON", category: "Subscriptions", supplier: "Yirgacheffe Direct", cost: 20.00, price: 52.00, unit: "box", reorder: 15, reorderQty: 30, desc: "3x 250g premium lots + tasting notes." },
    { name: "Monthly Bakery Box", sku: "SUB-BAKE-MO", category: "Subscriptions", supplier: "Portland Flour Mill", cost: 12.00, price: 34.00, unit: "box", reorder: 12, reorderQty: 25, desc: "Rotating selection of 8 pastry items." },

    // ── Tea & Alternatives
    { name: "Ceremonial Grade Matcha (30g)", sku: "TA-MAT-30", category: "Tea & Alternatives", supplier: "Hario USA", cost: 12.00, price: 28.00, unit: "tin", reorder: 15, reorderQty: 30, desc: "Stone-ground Uji matcha." },
    { name: "Organic Chai Blend (100g)", sku: "TA-CHI-100", category: "Tea & Alternatives", supplier: "Sumatra Heritage Co.", cost: 4.00, price: 12.00, unit: "bag", reorder: 20, reorderQty: 40, desc: "Assam base, cardamom, cinnamon, ginger." },
    { name: "Raw Cacao Nibs (200g)", sku: "TA-CAC-200", category: "Tea & Alternatives", supplier: "Sumatra Heritage Co.", cost: 5.00, price: 14.00, unit: "bag", reorder: 15, reorderQty: 30, desc: "Fermented & dried, brewing or snacking." },
    { name: "Jasmine Pearl Green Tea (50g)", sku: "TA-JSM-50", category: "Tea & Alternatives", supplier: "Hario USA", cost: 6.00, price: 16.00, unit: "tin", reorder: 12, reorderQty: 25, desc: "Hand-rolled pearls, floral aroma." },
    { name: "Rooibos Vanilla (80g)", sku: "TA-ROO-80", category: "Tea & Alternatives", supplier: "Sumatra Heritage Co.", cost: 3.50, price: 10.00, unit: "bag", reorder: 15, reorderQty: 30, desc: "Caffeine-free, naturally sweet." },
  ];

  const products: { id: string; sku: string; name: string; cost: number; price: number }[] = [];

  for (const p of productDefs) {
    const created = await prisma.product.create({
      data: {
        businessId: biz,
        categoryId: categoryMap[p.category],
        supplierId: sup(p.supplier),
        name: p.name,
        description: p.desc ?? null,
        sku: p.sku,
        unit: p.unit ?? "pcs",
        costPrice: p.cost,
        sellingPrice: p.price,
        reorderPoint: p.reorder,
        reorderQuantity: p.reorderQty,
        isActive: true,
      },
    });
    products.push({ id: created.id, sku: p.sku, name: p.name, cost: p.cost, price: p.price });
  }

  console.log(`  ✅ ${products.length} products created`);

  // ── 7. Opening stock (inventory movements) ──────────────────────────────

  for (const p of products) {
    // Reduce opening stock to create low stock situations
    // High-demand items (beans, popular bakery): 15-35 units
    // Medium items: 20-45 units
    // Low-demand items (equipment, expensive items): 5-15 units
    let qty;
    if (p.price > 200) {
      // Expensive equipment
      qty = Math.floor(Math.random() * 11) + 5; // 5-15
    } else if (p.sku.startsWith('CB-') || p.sku.startsWith('BK-GFT')) {
      // Coffee beans and gift boxes (high turnover)
      qty = Math.floor(Math.random() * 21) + 15; // 15-35
    } else {
      // Everything else
      qty = Math.floor(Math.random() * 26) + 20; // 20-45
    }
    
    await prisma.inventoryMovement.create({
      data: {
        businessId: biz,
        productId: p.id,
        branchId: warehouse.id,
        movementType: "opening_stock",
        quantityDelta: qty,
        unitCost: p.cost,
        referenceType: "manual",
        notes: "Initial stock load",
        createdBy: owner.id,
      },
    });
  }

  console.log(`  ✅ ${products.length} opening stock movements created`);

  // ── 8. Customers (25 online shoppers with segments) ─────────────────────

  const customerDefs = [
    // VIP Segment - High value, frequent buyers
    { fullName: "Olivia Harper", email: "olivia.harper@gmail.com", phone: "+1-503-555-1001", address: "410 SE Hawthorne Blvd, Portland, OR 97214", city: "Portland", state: "OR", zipCode: "97214", country: "USA", tags: ["vip", "subscription", "high-value"], notes: "Monthly connoisseur subscriber. Prefers single-origin Ethiopian. Orders every 2-3 weeks. Lifetime value: $2,400+", segment: "VIP" },
    { fullName: "Ava Martinez", email: "ava.m@gmail.com", phone: "+1-425-555-1007", address: "890 Bellevue Way NE, Bellevue, WA 98004", city: "Bellevue", state: "WA", zipCode: "98004", country: "USA", tags: ["vip", "repeat", "high-value"], notes: "Orders every 2 weeks. Loves bakery items and premium blends. Average order: $85. Responds well to new product launches", segment: "VIP" },
    { fullName: "Charlotte Brown", email: "charlotte.b@icloud.com", phone: "+1-503-555-1013", address: "3300 SE Belmont St, Portland, OR 97214", city: "Portland", state: "OR", zipCode: "97214", country: "USA", tags: ["vip", "merch", "brand-advocate"], notes: "Bought full merch set ($450). Active on social media. Great for testimonials. Orders gifts for friends frequently", segment: "VIP" },
    { fullName: "Lily King", email: "lily.k@outlook.com", phone: "+1-503-555-1025", address: "200 SW Market St, Portland, OR 97201", city: "Portland", state: "OR", zipCode: "97201", country: "USA", tags: ["vip", "repeat", "top-spender"], notes: "Top 5 spender last quarter ($1,800). Buys premium equipment and rare beans. Orders 2-3x per month", segment: "VIP" },
    { fullName: "Grace Lewis", email: "grace.l@gmail.com", phone: "+1-347-555-1021", address: "45 Court St, Brooklyn, NY 11201", city: "Brooklyn", state: "NY", zipCode: "11201", country: "USA", tags: ["vip", "subscription", "loyal"], notes: "Connoisseur subscription since launch. Never cancelled. Buys gift boxes for holidays. East Coast VIP", segment: "VIP" },
    
    // Regular Segment - Consistent moderate buyers
    { fullName: "Jackson Lee", email: "jackson.lee@fastmail.com", phone: "+1-503-555-1008", address: "555 NE Alberta St, Portland, OR 97211", city: "Portland", state: "OR", zipCode: "97211", country: "USA", tags: ["local-pickup", "repeat", "regular"], notes: "Weekly bean buyer. Local pickup only. Prefers Morning Bloom Blend. Very punctual with orders", segment: "Regular" },
    { fullName: "Mia Thompson", email: "mia.t@gmail.com", phone: "+1-503-555-1011", address: "920 NW 23rd Ave, Portland, OR 97210", city: "Portland", state: "OR", zipCode: "97210", country: "USA", tags: ["local-pickup", "repeat", "regular"], notes: "Sourdough regular. Orders every Thursday for weekend. Also buys coffee occasionally", segment: "Regular" },
    { fullName: "Scarlett Harris", email: "scarlett.h@gmail.com", phone: "+1-503-555-1019", address: "850 N Killingsworth St, Portland, OR 97217", city: "Portland", state: "OR", zipCode: "97217", country: "USA", tags: ["repeat", "regular"], notes: "Bi-weekly Morning Bloom buyer. Very consistent. Average order: $45. Loyal to specific products", segment: "Regular" },
    { fullName: "Daniel Walker", email: "daniel.w@yahoo.com", phone: "+1-503-555-1022", address: "1100 SW Jefferson St, Portland, OR 97201", city: "Portland", state: "OR", zipCode: "97201", country: "USA", tags: ["local-pickup", "repeat", "regular"], notes: "Friday bread pickup regular. Sometimes adds pastries. Orders every 1-2 weeks", segment: "Regular" },
    { fullName: "Harper Anderson", email: "harper.a@outlook.com", phone: "+1-503-555-1017", address: "700 NE Dekum St, Portland, OR 97211", city: "Portland", state: "OR", zipCode: "97211", country: "USA", tags: ["local-pickup", "regular"], notes: "Weekday pickup regular. Works nearby. Prefers quick pickups during lunch break", segment: "Regular" },
    { fullName: "Emma Wilson", email: "emma.w@gmail.com", phone: "+1-310-555-1005", address: "1450 Ocean Ave, Santa Monica, CA 90401", city: "Santa Monica", state: "CA", zipCode: "90401", country: "USA", tags: ["subscription", "regular"], notes: "Explorer box monthly subscription. California customer. Ships reliably. Likes variety", segment: "Regular" },
    { fullName: "Lucas Johnson", email: "lucas.j@outlook.com", phone: "+1-773-555-1010", address: "1600 W Division St, Chicago, IL 60622", city: "Chicago", state: "IL", zipCode: "60622", country: "USA", tags: ["subscription", "regular"], notes: "Bakery box monthly subscription. Midwest customer. Orders gifts occasionally", segment: "Regular" },
    
    // Occasional Segment - Infrequent but valuable
    { fullName: "Sophia Nguyen", email: "sophia.n@icloud.com", phone: "+1-415-555-1003", address: "320 Valencia St, San Francisco, CA 94103", city: "San Francisco", state: "CA", zipCode: "94103", country: "USA", tags: ["gift-buyer", "occasional"], notes: "Loves gift boxes. Orders for special occasions (birthdays, holidays). High AOV when orders. SF Bay Area", segment: "Occasional" },
    { fullName: "Isabella Chen", email: "isabella.c@gmail.com", phone: "+1-212-555-1009", address: "172 Bleecker St, New York, NY 10012", city: "New York", state: "NY", zipCode: "10012", country: "USA", tags: ["gift-buyer", "occasional"], notes: "Birthday box fan. Orders quarterly for family events. NYC customer. Appreciates premium packaging", segment: "Occasional" },
    { fullName: "Noah Kim", email: "noah.kim@proton.me", phone: "+1-503-555-1006", address: "1200 SE Division St, Portland, OR 97202", city: "Portland", state: "OR", zipCode: "97202", country: "USA", tags: ["equipment-enthusiast", "occasional"], notes: "Bought full V60 setup ($280). Interest in brewing equipment. Orders beans monthly after equipment purchase", segment: "Occasional" },
    { fullName: "James Davis", email: "james.d@gmail.com", phone: "+1-720-555-1014", address: "1800 Wazee St, Denver, CO 80202", city: "Denver", state: "CO", zipCode: "80202", country: "USA", tags: ["equipment-enthusiast", "occasional"], notes: "Espresso gear collector. High-value equipment orders. Buys beans occasionally. Denver market", segment: "Occasional" },
    { fullName: "Chloe Hall", email: "chloe.h@proton.me", phone: "+1-971-555-1023", address: "500 NW 14th Ave, Portland, OR 97209", city: "Portland", state: "OR", zipCode: "97209", country: "USA", tags: ["merch", "occasional"], notes: "Gifted aprons to family ($120). Merch buyer. Orders seasonally. Good for holiday campaigns", segment: "Occasional" },
    { fullName: "Elijah White", email: "elijah.w@fastmail.com", phone: "+1-617-555-1018", address: "255 Newbury St, Boston, MA 02116", city: "Boston", state: "MA", zipCode: "02116", country: "USA", tags: ["tea-lover", "occasional"], notes: "Orders matcha and chai. Not a coffee buyer. Niche segment. East Coast. Orders monthly", segment: "Occasional" },
    
    // Wholesale/B2B Segment
    { fullName: "Ethan Brooks", email: "ethan.brooks@outlook.com", phone: "+1-206-555-1002", address: "1822 Pike St, Seattle, WA 98101", city: "Seattle", state: "WA", zipCode: "98101", country: "USA", tags: ["wholesale", "b2b", "bulk-buyer"], notes: "Buys bulk for his cafe 'Brew Haven'. Orders 5-10kg monthly. Prefers house blends. Invoice payment. Wholesale pricing", segment: "Wholesale" },
    { fullName: "Alexander Clark", email: "alex.c@icloud.com", phone: "+1-503-555-1020", address: "3700 SE Woodstock Blvd, Portland, OR 97202", city: "Portland", state: "OR", zipCode: "97202", country: "USA", tags: ["wholesale", "b2b", "bulk-buyer"], notes: "Supplies his bookshop cafe 'Page & Pour'. Weekly bulk orders. Also buys bakery items. Net 30 terms", segment: "Wholesale" },
    
    // New Customer Segment - Recent acquisitions
    { fullName: "Aiden Garcia", email: "aiden.g@yahoo.com", phone: "+1-602-555-1012", address: "4420 N Central Ave, Phoenix, AZ 85012", city: "Phoenix", state: "AZ", zipCode: "85012", country: "USA", tags: ["new", "first-timer"], notes: "First order 3 weeks ago ($62). Phoenix market. Found via Google Ads. Potential for repeat. Follow up", segment: "New" },
    { fullName: "Benjamin Taylor", email: "ben.t@gmail.com", phone: "+1-512-555-1016", address: "2200 S Lamar Blvd, Austin, TX 78704", city: "Austin", state: "TX", zipCode: "78704", country: "USA", tags: ["new", "gift-buyer", "corporate"], notes: "Corporate gift inquiry. First order last month. Austin tech company. High-value B2B potential", segment: "New" },
    { fullName: "Henry Young", email: "henry.y@gmail.com", phone: "+1-808-555-1024", address: "2300 Kalakaua Ave, Honolulu, HI 96815", city: "Honolulu", state: "HI", zipCode: "96815", country: "USA", tags: ["new", "social-media"], notes: "Discovered us on Instagram. First order 2 weeks ago. Hawaii customer (high shipping). Engaged on social", segment: "New" },
    
    // At-Risk/Special Attention Segment
    { fullName: "Liam Patel", email: "liam.patel@yahoo.com", phone: "+1-971-555-1004", address: "2600 NW Lovejoy St, Portland, OR 97210", city: "Portland", state: "OR", zipCode: "97210", country: "USA", tags: ["local-pickup", "at-risk"], notes: "Was a weekly customer, now orders monthly. Last order 4 weeks ago. Local pickup. Re-engagement needed", segment: "At-Risk" },
    { fullName: "Amelia Rodriguez", email: "amelia.r@proton.me", phone: "+1-503-555-1015", address: "1400 SE Water Ave, Portland, OR 97214", city: "Portland", state: "OR", zipCode: "97214", country: "USA", tags: ["subscription", "repeat", "churning"], notes: "Double subscription (beans + bakery). Recently cancelled bakery subscription. Monitor for bean sub cancellation", segment: "At-Risk" },
  ];

  const customers: { id: string; fullName: string; segment: string }[] = [];
  for (const c of customerDefs) {
    const { segment, city, state, zipCode, country, ...customerData } = c;
    // Store segment in notes for now, or we can add it as a tag
    const enhancedNotes = `[${segment} Segment] ${customerData.notes}`;
    const enhancedTags = [...customerData.tags, segment.toLowerCase()];
    
    const created = await prisma.customer.create({
      data: { 
        businessId: biz, 
        ...customerData,
        notes: enhancedNotes,
        tags: enhancedTags,
      },
    });
    customers.push({ id: created.id, fullName: created.fullName, segment });
  }

  console.log(`  ✅ ${customers.length} customers created with segments (${customers.filter(c => c.segment === 'VIP').length} VIP, ${customers.filter(c => c.segment === 'Regular').length} Regular, ${customers.filter(c => c.segment === 'Occasional').length} Occasional, ${customers.filter(c => c.segment === 'Wholesale').length} Wholesale, ${customers.filter(c => c.segment === 'New').length} New, ${customers.filter(c => c.segment === 'At-Risk').length} At-Risk)`);

  // ── 9. Sales (6 months: ~200 orders) ────────────────────────────────────

  console.log("  🔄 Creating sales (this may take a few minutes)...");

  // End date is today, start date is 6 months ago
  const endDate = new Date(); // Today: March 11, 2026
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 6); // September 11, 2025
  const dayMs = 86_400_000;
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs);

  const paymentMethods: ("card" | "bank_transfer" | "mobile_payment" | "cash" | "credit")[] = [
    "card", "card", "card", "card",          // 50% card
    "mobile_payment", "mobile_payment",       // 25% mobile
    "bank_transfer",                          // 12.5%
    "cash",                                   // 12.5% (local pickup)
  ];

  let saleCount = 0;

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    // Progress indicator every 30 days
    if (dayIdx > 0 && dayIdx % 30 === 0) {
      console.log(`    → Processing day ${dayIdx}/${totalDays} (${saleCount} sales created so far)...`);
    }
    const saleDate = new Date(startDate.getTime() + dayIdx * dayMs);

    // 1-3 orders per day (more on weekends)
    const dayOfWeek = saleDate.getDay();
    const ordersToday = dayOfWeek === 0 || dayOfWeek === 6
      ? Math.floor(Math.random() * 3) + 2   // 2-4 on weekends
      : Math.floor(Math.random() * 2) + 1;  // 1-2 on weekdays

    for (let o = 0; o < ordersToday; o++) {
      // Pick 1-5 random items per order
      const numItems = Math.floor(Math.random() * 4) + 1;
      const orderItems: { product: typeof products[0]; qty: number }[] = [];
      const usedIds = new Set<string>();

      for (let i = 0; i < numItems; i++) {
        const prod = pick(products);
        if (usedIds.has(prod.id)) continue;
        usedIds.add(prod.id);
        const qty = prod.price > 100 ? 1 : Math.floor(Math.random() * 3) + 1; // equipment qty=1
        orderItems.push({ product: prod, qty });
      }

      if (orderItems.length === 0) continue;

      // Smart customer selection based on segment probabilities
      let customer: typeof customers[0] | null = null;
      const r = Math.random();
      
      if (r < 0.05) {
        // 5% guest orders
        customer = null;
      } else if (r < 0.35) {
        // 30% VIP customers (they buy frequently)
        const vips = customers.filter(c => c.segment === 'VIP');
        customer = vips.length > 0 ? pick(vips) : pick(customers);
      } else if (r < 0.65) {
        // 30% Regular customers
        const regulars = customers.filter(c => c.segment === 'Regular');
        customer = regulars.length > 0 ? pick(regulars) : pick(customers);
      } else if (r < 0.85) {
        // 20% Occasional customers
        const occasional = customers.filter(c => c.segment === 'Occasional');
        customer = occasional.length > 0 ? pick(occasional) : pick(customers);
      } else if (r < 0.92) {
        // 7% Wholesale customers (bulk orders)
        const wholesale = customers.filter(c => c.segment === 'Wholesale');
        customer = wholesale.length > 0 ? pick(wholesale) : pick(customers);
      } else if (r < 0.97) {
        // 5% New customers (testing the waters)
        const newCust = customers.filter(c => c.segment === 'New');
        customer = newCust.length > 0 ? pick(newCust) : pick(customers);
      } else {
        // 3% At-Risk customers (sporadic orders)
        const atRisk = customers.filter(c => c.segment === 'At-Risk');
        customer = atRisk.length > 0 ? pick(atRisk) : pick(customers);
      }
      
      const paymentMethod = pick(paymentMethods);
      const isPickup = customer && customer.fullName.match(/Liam|Jackson|Mia|Harper|Daniel/);
      const branch = isPickup ? pickup : warehouse;

      // Compute totals
      let subtotal = 0;
      const items: {
        productId: string; quantity: number; unitPrice: number;
        unitCost: number; discountAmount: number; totalPrice: number;
      }[] = [];

      for (const oi of orderItems) {
        const lineTotal = oi.qty * oi.product.price;
        const disc = Math.random() < 0.1 ? Math.round(lineTotal * 0.1 * 100) / 100 : 0; // 10% chance of 10% discount
        const total = Math.round((lineTotal - disc) * 100) / 100;
        subtotal += total;
        items.push({
          productId: oi.product.id,
          quantity: oi.qty,
          unitPrice: oi.product.price,
          unitCost: oi.product.cost,
          discountAmount: disc,
          totalPrice: total,
        });
      }

      const discountAmount = items.reduce((s, i) => s + i.discountAmount, 0);
      const taxRate = 0.0;  // no tax for now (online store, varies by state)
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

      // Add time variance to sales (not all at midnight)
      const hour = Math.floor(Math.random() * 18) + 6; // 6am-11pm
      const minute = Math.floor(Math.random() * 60);
      const saleDateTime = new Date(saleDate);
      saleDateTime.setHours(hour, minute, 0, 0);

      // Status: 97% completed, 3% voided (no pending in schema)
      let saleStatus: "completed" | "voided" = "completed";
      if (Math.random() < 0.03) saleStatus = "voided";

      // Transaction: create sale + items + movements + cashflow + customer update
      await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            businessId: biz,
            branchId: branch.id,
            customerId: customer?.id ?? null,
            createdBy: owner.id,
            saleDate: saleDateTime,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paymentMethod,
            paymentStatus: "paid", // PaymentStatus enum only has: paid, partial, unpaid
            amountPaid: totalAmount,
            status: saleStatus,
          },
        });

        for (const item of items) {
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              businessId: biz,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              discountAmount: item.discountAmount,
              totalPrice: item.totalPrice,
            },
          });

          // Only deduct stock for completed sales
          if (saleStatus === "completed") {
            await tx.inventoryMovement.create({
              data: {
                businessId: biz,
                productId: item.productId,
                branchId: branch.id,
                movementType: "sale",
                quantityDelta: -item.quantity,
                unitCost: item.unitCost,
                referenceType: "sale",
                referenceId: sale.id,
                createdBy: owner.id,
                createdAt: saleDateTime,
              },
            });
          }
        }

        // Cashflow event only for completed sales
        if (saleStatus === "completed") {
          await tx.cashflowEvent.create({
            data: {
              businessId: biz,
              branchId: branch.id,
              eventType: "sale_revenue",
              direction: "inflow",
              amount: totalAmount,
              referenceType: "sale",
              referenceId: sale.id,
              description: `Online order #${sale.id.slice(0, 8)}`,
              eventDate: saleDateTime,
              createdBy: owner.id,
              createdAt: saleDateTime,
            },
          });
        }

        // Update customer stats only for completed sales
        if (customer && saleStatus === "completed") {
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              totalSpent: { increment: totalAmount },
              lastPurchaseAt: saleDateTime,
            },
          });
        }
      });

      saleCount++;
    }
  }

  console.log(`  ✅ ${saleCount} sales created (with items, movements, cashflow)`);

  // ── 10. Restock purchases (monthly, only for items that need it) ─────────

  console.log("  🔄 Creating restock purchases...");

  let restockCount = 0;
  // Only 5 restock cycles over 6 months (not every 2 weeks)
  for (let cycle = 0; cycle < 5; cycle++) {
    const restockDate = new Date(startDate.getTime() + cycle * 36 * dayMs); // Every ~5 weeks
    const isoDate = restockDate.toISOString().slice(0, 10);

    // Only restock 5-10 products per cycle (not 8-15)
    const numProducts = Math.floor(Math.random() * 6) + 5;
    const restockProducts = [...products].sort(() => Math.random() - 0.5).slice(0, numProducts);

    for (const prod of restockProducts) {
      // Smaller restock quantities: 10-30 units (not 20-60)
      const qty = Math.floor(Math.random() * 21) + 10;
      const totalCost = qty * prod.cost;

      await prisma.inventoryMovement.create({
        data: {
          businessId: biz,
          productId: prod.id,
          branchId: warehouse.id,
          movementType: "purchase",
          quantityDelta: qty,
          unitCost: prod.cost,
          referenceType: "purchase_order",
          supplierId: undefined, // prisma will set null
          notes: `Bi-weekly restock`,
          createdBy: owner.id,
          createdAt: restockDate,
        },
      });

      await prisma.cashflowEvent.create({
        data: {
          businessId: biz,
          branchId: warehouse.id,
          eventType: "inventory_purchase",
          direction: "outflow",
          amount: totalCost,
          description: `Restock ${prod.name} x${qty}`,
          eventDate: d(isoDate),
          createdBy: owner.id,
          createdAt: restockDate,
        },
      });

      restockCount++;
    }
  }

  console.log(`  ✅ ${restockCount} restock movements + cashflow events`);

  // ── 11. Expenses (monthly) ──────────────────────────────────────────────

  console.log("  🔄 Creating monthly expenses...");

  const monthlyExpenses = [
    { category: "Rent", description: "Warehouse lease — 1200 Roastery Lane", amount: 4200 },
    { category: "Rent", description: "Pickup point lease — NW 23rd", amount: 1800 },
    { category: "Utilities", description: "Electricity & gas — warehouse", amount: 680 },
    { category: "Utilities", description: "Internet & phone — all locations", amount: 220 },
    { category: "Salaries", description: "Staff payroll (3 employees)", amount: 12500 },
    { category: "Shipping", description: "USPS/UPS monthly shipping costs", amount: 3400 },
    { category: "Software", description: "Shopify + Inventra + email marketing", amount: 350 },
    { category: "Marketing", description: "Instagram & Google Ads", amount: 1200 },
    { category: "Insurance", description: "General liability + product insurance", amount: 480 },
    { category: "Packaging", description: "Boxes, mailers, tissue, stickers", amount: 750 },
  ];

  let expenseCount = 0;
  // Generate last 6 months dynamically
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(endDate);
    monthDate.setMonth(monthDate.getMonth() - i);
    const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    months.push(yearMonth);
  }

  for (const month of months) {
    for (const exp of monthlyExpenses) {
      const dayOfMonth = Math.floor(Math.random() * 25) + 1;
      const expDate = `${month}-${String(dayOfMonth).padStart(2, "0")}`;
      // Add some variance (±15%)
      const variance = 1 + (Math.random() * 0.3 - 0.15);
      const amount = Math.round(exp.amount * variance * 100) / 100;

      await prisma.expense.create({
        data: {
          businessId: biz,
          branchId: exp.category === "Rent" && exp.description.includes("Pickup") ? pickup.id : warehouse.id,
          createdBy: owner.id,
          category: exp.category,
          description: exp.description,
          amount,
          expenseDate: d(expDate),
          paymentMethod: exp.category === "Salaries" ? "bank_transfer" : "card",
        },
      });

      // Cashflow outflow
      await prisma.cashflowEvent.create({
        data: {
          businessId: biz,
          branchId: exp.category === "Rent" && exp.description.includes("Pickup") ? pickup.id : warehouse.id,
          eventType: "expense_payment",
          direction: "outflow",
          amount,
          description: `${exp.category}: ${exp.description}`,
          eventDate: d(expDate),
          createdBy: owner.id,
        },
      });

      expenseCount++;
    }
  }

  console.log(`  ✅ ${expenseCount} expenses + cashflow events`);

  // ── 12. Forecasts (next 30 days for top 15 products) ────────────────────

  console.log("  🔄 Creating forecasts...");

  const topProducts = products.slice(0, 15); // beans + popular bakery
  // Forecasts for next month (April 2026)
  const forecastStart = new Date(endDate);
  forecastStart.setDate(1); // First of current month
  forecastStart.setMonth(forecastStart.getMonth() + 1); // Next month
  const forecastEnd = new Date(forecastStart);
  forecastEnd.setMonth(forecastEnd.getMonth() + 1);
  forecastEnd.setDate(0); // Last day of next month

  const forecasts: { id: string; productId: string }[] = [];

  for (const prod of topProducts) {
    // Warehouse forecast
    const f1 = await prisma.forecast.create({
      data: {
        businessId: biz,
        productId: prod.id,
        branchId: warehouse.id,
        forecastPeriodStart: forecastStart,
        forecastPeriodEnd: forecastEnd,
        predictedDemand: Math.floor(Math.random() * 80) + 30,
        confidenceScore: randomBetween(0.72, 0.95),
        modelVersion: "prophet-v2.1",
        forecastData: {
          trend: pick(["increasing", "stable", "slightly_decreasing"]),
          seasonality: pick(["high", "moderate", "low"]),
          peakDay: pick(["Monday", "Friday", "Saturday"]),
        },
        generatedAt: endDate, // Generated today
      },
    });
    forecasts.push({ id: f1.id, productId: prod.id });

    // Pickup point forecast
    const f2 = await prisma.forecast.create({
      data: {
        businessId: biz,
        productId: prod.id,
        branchId: pickup.id,
        forecastPeriodStart: forecastStart,
        forecastPeriodEnd: forecastEnd,
        predictedDemand: Math.floor(Math.random() * 25) + 5,
        confidenceScore: randomBetween(0.65, 0.88),
        modelVersion: "prophet-v2.1",
        forecastData: {
          trend: pick(["stable", "increasing"]),
          seasonality: pick(["moderate", "low"]),
          peakDay: pick(["Friday", "Saturday", "Sunday"]),
        },
        generatedAt: endDate, // Generated today
      },
    });
    forecasts.push({ id: f2.id, productId: prod.id });
  }

  // Also add some 60-day forecasts for key items
  const forecast60End = new Date(forecastStart);
  forecast60End.setMonth(forecast60End.getMonth() + 2);
  forecast60End.setDate(0); // End of 2 months from now
  
  for (const prod of products.slice(0, 5)) {
    await prisma.forecast.create({
      data: {
        businessId: biz,
        productId: prod.id,
        branchId: warehouse.id,
        forecastPeriodStart: forecastStart,
        forecastPeriodEnd: forecast60End,
        predictedDemand: Math.floor(Math.random() * 150) + 60,
        confidenceScore: randomBetween(0.6, 0.82),
        modelVersion: "prophet-v2.1",
        forecastData: { trend: "increasing", note: "60-day extended forecast" },
        generatedAt: endDate,
      },
    });
  }

  console.log(`  ✅ ${forecasts.length + 5} forecasts created`);

  // ── 13. Recommendations ─────────────────────────────────────────────────

  console.log("  🔄 Creating recommendations...");

  const recDefs: {
    productSku: string; type: "restock" | "reduce_order" | "promote" | "discontinue" | "pricing_adjustment";
    title: string; body: string; priority: "high" | "medium" | "low";
    suggestedQty?: number; daysFromNow?: number;
  }[] = [
    { productSku: "CB-COL-W-250", type: "restock", title: "Restock Colombia Washed 250g", body: "Stock projected to hit zero within 2 weeks based on current sell-through. Recommend ordering 100 units from Finca El Paraíso immediately.", priority: "high", suggestedQty: 100, daysFromNow: 7 },
    { productSku: "CB-ETH-N-250", type: "restock", title: "Restock Ethiopia Natural 250g", body: "Demand is trending upward (+18% MoM). Current inventory covers ~10 days. Suggest ordering 90 units.", priority: "high", suggestedQty: 90, daysFromNow: 5 },
    { productSku: "CB-BLD-MORN", type: "restock", title: "Restock Morning Bloom Blend", body: "Flagship blend is your #1 seller. Maintain buffer of 2 weeks supply. Order 120 bags.", priority: "high", suggestedQty: 120, daysFromNow: 10 },
    { productSku: "BK-TMC-8", type: "promote", title: "Promote Tiramisu Cake for Mother's Day", body: "Tiramisu Cake has high margins (68%) and aligns well with upcoming Mother's Day. Consider a 'Cake + Beans' bundle at $52.", priority: "medium", daysFromNow: 45 },
    { productSku: "BK-GFT-BDAY", type: "promote", title: "Birthday Box — Spring Campaign", body: "Birthday Box sales spike April–June. Launch an email campaign targeting past gift-buyers.", priority: "medium", daysFromNow: 14 },
    { productSku: "CB-SUM-D-250", type: "reduce_order", title: "Reduce Sumatra Dark reorder qty", body: "Sumatra Dark 250g has slower sell-through than expected (−12% vs forecast). Reduce next reorder to 40 units from 60.", priority: "low", suggestedQty: 40, daysFromNow: 30 },
    { productSku: "TA-ROO-80", type: "reduce_order", title: "Reduce Rooibos Vanilla order", body: "Rooibos Vanilla has 8 weeks of supply on hand. Skip next reorder cycle.", priority: "low", suggestedQty: 0, daysFromNow: 30 },
    { productSku: "EQ-GRD-MINI", type: "pricing_adjustment", title: "Consider price increase on Mazzer Mini", body: "Mazzer Mini has been selling at full price with zero discount needed. Market price is $620. Consider increasing to $599.", priority: "medium", daysFromNow: 21 },
    { productSku: "MR-MUG-12", type: "promote", title: "Bundle Mug with Bean purchase", body: "Customers who buy beans are 3x more likely to add a mug. Offer $2 off mug when ordered with any 250g bag.", priority: "medium", daysFromNow: 7 },
    { productSku: "BK-BIS-ALM", type: "promote", title: "Biscotti cross-sell on checkout", body: "Almond Biscotti pairs well with espresso blends. Show as 'Pairs well with…' on product page.", priority: "low", daysFromNow: 14 },
  ];

  for (const rec of recDefs) {
    const prod = products.find((p) => p.sku === rec.productSku);
    const forecast = forecasts.find((f) => f.productId === prod?.id);
    const actionByDate = rec.daysFromNow ? new Date(endDate.getTime() + rec.daysFromNow * dayMs) : null;
    
    await prisma.recommendation.create({
      data: {
        businessId: biz,
        productId: prod?.id,
        branchId: warehouse.id,
        forecastId: forecast?.id ?? null,
        recommendationType: rec.type,
        title: rec.title,
        body: rec.body,
        priority: rec.priority,
        suggestedQuantity: rec.suggestedQty ?? null,
        suggestedActionBy: actionByDate,
        status: pick(["pending", "pending", "pending", "acknowledged"]),
      },
    });
  }

  console.log(`  ✅ ${recDefs.length} recommendations created`);

  // ── 14. Notifications ───────────────────────────────────────────────────

  console.log("  🔄 Creating notifications...");

  const notifDefs: { type: "low_stock_alert" | "new_recommendation" | "forecast_ready" | "cashflow_alert" | "general"; title: string; body: string }[] = [
    { type: "low_stock_alert", title: "Low stock: Colombia Washed 250g", body: "Only 12 units remaining — below reorder point of 40." },
    { type: "low_stock_alert", title: "Low stock: Ethiopia Natural 250g", body: "Only 8 units remaining — below reorder point of 35." },
    { type: "low_stock_alert", title: "Low stock: Morning Bloom Blend", body: "Only 18 units remaining — below reorder point of 50." },
    { type: "new_recommendation", title: "New recommendation: Restock Colombia Washed", body: "AI recommends ordering 100 units before April 8." },
    { type: "new_recommendation", title: "New recommendation: Promote Tiramisu for Mother's Day", body: "High-margin item aligns with upcoming holiday." },
    { type: "forecast_ready", title: "April forecasts are ready", body: "Demand forecasts for 15 products have been generated." },
    { type: "cashflow_alert", title: "Monthly expenses up 8%", body: "March operating expenses were $26,340 — up 8% vs February." },
    { type: "general", title: "Welcome to Inventra! 🎉", body: "Your online store Bean & Bloom is all set up. Start by reviewing your inventory levels." },
  ];

  for (const n of notifDefs) {
    await prisma.notification.create({
      data: {
        businessId: biz,
        userId: owner.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.type === "general",
      },
    });
  }

  console.log(`  ✅ ${notifDefs.length} notifications created`);

  // ── 15. Settings ────────────────────────────────────────────────────────

  console.log("  🔄 Creating settings...");

  await prisma.settings.create({
    data: {
      businessId: biz,
      lowStockThresholdDefault: 15,
      defaultTaxRate: 0, // No tax for online store (varies by state)
      fiscalYearStartMonth: 1,
      enableDemandForecasting: true,
      enableCustomerAnalytics: true,
      forecastHorizonDays: 30,
      aiModelPreference: "prophet-v2.1",
      notificationPreferences: {
        email: { low_stock: true, recommendations: true, forecasts: false },
        inApp: { low_stock: true, recommendations: true, forecasts: true, cashflow: true },
      },
      customSettings: {
        shippingZones: ["domestic_us", "canada"],
        freeShippingThreshold: 50,
        defaultShippingCost: 6.99,
      },
    },
  });

  console.log("  ✅ Settings created");

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("\n🌱  Seed complete!");
  console.log("─".repeat(50));
  console.log("  Business:      Bean & Bloom");
  console.log("  Login:         admin@beanandbloom.co / Password123!");
  console.log(`  Branches:      2`);
  console.log(`  Categories:    ${Object.keys(categoryMap).length}`);
  console.log(`  Suppliers:     ${suppliers.length}`);
  console.log(`  Products:      ${products.length}`);
  console.log(`  Customers:     ${customers.length}`);
  console.log(`  Sales:         ${saleCount}`);
  console.log(`  Restocks:      ${restockCount}`);
  console.log(`  Expenses:      ${expenseCount}`);
  console.log(`  Forecasts:     ${forecasts.length + 5}`);
  console.log(`  Recommendations: ${recDefs.length}`);
  console.log(`  Notifications: ${notifDefs.length}`);
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
