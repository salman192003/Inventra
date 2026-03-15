// ─── Dashboard ───────────────────────────────────────────────────────────────

export const mockRevenueData = [
  { date: 'Feb 10', revenue: 3200, expenses: 1800 },
  { date: 'Feb 15', revenue: 4100, expenses: 2100 },
  { date: 'Feb 20', revenue: 3800, expenses: 1900 },
  { date: 'Feb 25', revenue: 5200, expenses: 2400 },
  { date: 'Mar 1',  revenue: 4700, expenses: 2200 },
  { date: 'Mar 3',  revenue: 6100, expenses: 2800 },
  { date: 'Mar 5',  revenue: 5500, expenses: 2500 },
  { date: 'Mar 7',  revenue: 6800, expenses: 3000 },
  { date: 'Mar 8',  revenue: 4200, expenses: 1900 },
];

export const mockTopProducts = [
  { name: 'Mineral Water 1L', sales: 420 },
  { name: 'White Rice 5kg',   sales: 310 },
  { name: 'Cooking Oil 2L',   sales: 280 },
  { name: 'Sugar 1kg',        sales: 245 },
  { name: 'Instant Noodles',  sales: 198 },
];

export const mockRecentSales = [
  { id: '#1042', customer: 'Jane Smith',    products: '3 items', total: '$84.00',  date: 'Mar 8, 2026',  status: 'paid' },
  { id: '#1041', customer: 'Marcus Brown',  products: '1 item',  total: '$22.50',  date: 'Mar 8, 2026',  status: 'paid' },
  { id: '#1040', customer: 'Aisha Patel',   products: '5 items', total: '$136.00', date: 'Mar 7, 2026',  status: 'paid' },
  { id: '#1039', customer: 'Carlos Diaz',   products: '2 items', total: '$47.80',  date: 'Mar 7, 2026',  status: 'pending' },
  { id: '#1038', customer: 'Fatima Al-Ali', products: '4 items', total: '$98.20',  date: 'Mar 6, 2026',  status: 'paid' },
];

export const mockLowStockProducts = [
  { name: 'Cooking Oil 2L',   sku: 'SKU-0021', stock: 4,  reorder: 20, supplier: 'Golden Oils Ltd' },
  { name: 'Tomato Paste 200g', sku: 'SKU-0085', stock: 7,  reorder: 25, supplier: 'FreshFarm Co.' },
  { name: 'Salt 1kg',          sku: 'SKU-0034', stock: 9,  reorder: 30, supplier: 'PureSalt Inc.' },
  { name: 'Black Pepper 50g',  sku: 'SKU-0102', stock: 3,  reorder: 15, supplier: 'SpiceWorld' },
];

// ─── Inventory ────────────────────────────────────────────────────────────────

export const mockProducts = [
  { id: '1', name: 'Mineral Water 1L',   sku: 'SKU-001', category: 'Beverages', stock: 120, reorder: 30, supplier: 'AquaPure Ltd',    cost: '$0.40', price: '$0.90', status: 'in_stock' },
  { id: '2', name: 'White Rice 5kg',     sku: 'SKU-002', category: 'Grains',    stock: 85,  reorder: 20, supplier: 'GrainHouse Co.',   cost: '$3.20', price: '$6.50', status: 'in_stock' },
  { id: '3', name: 'Cooking Oil 2L',     sku: 'SKU-003', category: 'Oils',      stock: 4,   reorder: 20, supplier: 'Golden Oils Ltd',  cost: '$2.10', price: '$4.20', status: 'low_stock' },
  { id: '4', name: 'Sugar 1kg',          sku: 'SKU-004', category: 'Baking',    stock: 62,  reorder: 25, supplier: 'SweetSource',      cost: '$0.70', price: '$1.50', status: 'in_stock' },
  { id: '5', name: 'Instant Noodles',    sku: 'SKU-005', category: 'Dry Food',  stock: 200, reorder: 50, supplier: 'NoodleFast Corp',  cost: '$0.20', price: '$0.55', status: 'in_stock' },
  { id: '6', name: 'Tomato Paste 200g',  sku: 'SKU-006', category: 'Canned',    stock: 7,   reorder: 25, supplier: 'FreshFarm Co.',    cost: '$0.60', price: '$1.20', status: 'low_stock' },
  { id: '7', name: 'Salt 1kg',           sku: 'SKU-007', category: 'Seasoning', stock: 9,   reorder: 30, supplier: 'PureSalt Inc.',    cost: '$0.30', price: '$0.80', status: 'low_stock' },
  { id: '8', name: 'Black Pepper 50g',   sku: 'SKU-008', category: 'Seasoning', stock: 3,   reorder: 15, supplier: 'SpiceWorld',       cost: '$1.10', price: '$2.40', status: 'low_stock' },
  { id: '9', name: 'Canned Tuna 185g',   sku: 'SKU-009', category: 'Canned',    stock: 45,  reorder: 20, supplier: 'OceanHarvest',     cost: '$1.40', price: '$2.80', status: 'in_stock' },
  { id: '10',name: 'Wheat Flour 2kg',    sku: 'SKU-010', category: 'Baking',    stock: 0,   reorder: 20, supplier: 'MillPro Ltd',      cost: '$1.20', price: '$2.50', status: 'out_of_stock' },
];

export const mockSuppliers = [
  { id: '1', name: 'AquaPure Ltd',    contact: 'David Lim',    email: 'david@aquapure.com',   phone: '+1 555-0101', products: 3 },
  { id: '2', name: 'GrainHouse Co.', contact: 'Sara Mensah',  email: 'sara@grainhouse.com',  phone: '+1 555-0202', products: 5 },
  { id: '3', name: 'Golden Oils Ltd',contact: 'Ali Hassan',   email: 'ali@goldenoils.com',   phone: '+1 555-0303', products: 2 },
  { id: '4', name: 'FreshFarm Co.',  contact: 'Maria Lopez',  email: 'maria@freshfarm.com',  phone: '+1 555-0404', products: 7 },
  { id: '5', name: 'SpiceWorld',     contact: 'Chen Wei',     email: 'chen@spiceworld.com',  phone: '+1 555-0505', products: 4 },
];

// ─── Sales ────────────────────────────────────────────────────────────────────

export const mockSales = [
  { id: '#1042', customer: 'Jane Smith',    products: 'Water x3, Sugar x1',     total: '$84.00',  date: 'Mar 8, 2026',  status: 'paid' },
  { id: '#1041', customer: 'Marcus Brown',  products: 'Rice x1',                total: '$22.50',  date: 'Mar 8, 2026',  status: 'paid' },
  { id: '#1040', customer: 'Aisha Patel',   products: 'Noodles x5',             total: '$136.00', date: 'Mar 7, 2026',  status: 'paid' },
  { id: '#1039', customer: 'Carlos Diaz',   products: 'Oil x1, Tuna x1',        total: '$47.80',  date: 'Mar 7, 2026',  status: 'pending' },
  { id: '#1038', customer: 'Fatima Al-Ali', products: 'Flour x2, Pepper x2',    total: '$98.20',  date: 'Mar 6, 2026',  status: 'paid' },
  { id: '#1037', customer: 'James K.',      products: 'Water x10',              total: '$29.00',  date: 'Mar 6, 2026',  status: 'paid' },
  { id: '#1036', customer: 'Priya Nair',    products: 'Rice x2, Oil x1',        total: '$60.00',  date: 'Mar 5, 2026',  status: 'paid' },
];

export const mockExpenses = [
  { id: 'EXP-01', category: 'Rent',       description: 'March office rent',      amount: '$800.00',  date: 'Mar 1, 2026'  },
  { id: 'EXP-02', category: 'Utilities',  description: 'Electricity & water',    amount: '$145.00',  date: 'Mar 2, 2026'  },
  { id: 'EXP-03', category: 'Salaries',   description: 'Staff wages March',      amount: '$2,400.00',date: 'Mar 3, 2026'  },
  { id: 'EXP-04', category: 'Transport',  description: 'Delivery fuel costs',    amount: '$92.00',   date: 'Mar 4, 2026'  },
  { id: 'EXP-05', category: 'Supplies',   description: 'Packaging materials',    amount: '$68.00',   date: 'Mar 5, 2026'  },
  { id: 'EXP-06', category: 'Marketing',  description: 'Social media ads',       amount: '$120.00',  date: 'Mar 6, 2026'  },
];

export const mockMonthlyProfit = [
  { month: 'Oct', revenue: 18400, expenses: 9200,  profit: 9200 },
  { month: 'Nov', revenue: 22100, expenses: 10400, profit: 11700 },
  { month: 'Dec', revenue: 31200, expenses: 13800, profit: 17400 },
  { month: 'Jan', revenue: 19800, expenses: 9800,  profit: 10000 },
  { month: 'Feb', revenue: 24600, expenses: 11200, profit: 13400 },
  { month: 'Mar', revenue: 14200, expenses: 6400,  profit: 7800 },
];

// ─── Customers ────────────────────────────────────────────────────────────────

export const mockCustomers = [
  { id: '1', name: 'Jane Smith',    email: 'jane@email.com',   phone: '555-0101', purchases: '$1,240.00', lastOrder: 'Mar 8, 2026',  orders: 14 },
  { id: '2', name: 'Marcus Brown',  email: 'marcus@email.com', phone: '555-0202', purchases: '$980.50',   lastOrder: 'Mar 8, 2026',  orders: 9  },
  { id: '3', name: 'Aisha Patel',   email: 'aisha@email.com',  phone: '555-0303', purchases: '$2,104.00', lastOrder: 'Mar 7, 2026',  orders: 22 },
  { id: '4', name: 'Carlos Diaz',   email: 'carlos@email.com', phone: '555-0404', purchases: '$450.80',   lastOrder: 'Mar 7, 2026',  orders: 5  },
  { id: '5', name: 'Fatima Al-Ali', email: 'fatima@email.com', phone: '555-0505', purchases: '$1,780.00', lastOrder: 'Mar 6, 2026',  orders: 18 },
  { id: '6', name: 'James K.',      email: 'james@email.com',  phone: '555-0606', purchases: '$320.00',   lastOrder: 'Mar 6, 2026',  orders: 4  },
  { id: '7', name: 'Priya Nair',    email: 'priya@email.com',  phone: '555-0707', purchases: '$3,450.00', lastOrder: 'Mar 5, 2026',  orders: 31 },
];

// ─── Insights ─────────────────────────────────────────────────────────────────

export const mockForecast = [
  { product: 'Mineral Water 1L',  current: 120, predicted: 340, reorder: 200, trend: 'up' },
  { product: 'White Rice 5kg',    current: 85,  predicted: 310, reorder: 150, trend: 'up' },
  { product: 'Cooking Oil 2L',    current: 4,   predicted: 280, reorder: 100, trend: 'up' },
  { product: 'Sugar 1kg',         current: 62,  predicted: 240, reorder: 80,  trend: 'stable' },
  { product: 'Instant Noodles',   current: 200, predicted: 80,  reorder: 0,   trend: 'down' },
  { product: 'Wheat Flour 2kg',   current: 0,   predicted: 60,  reorder: 40,  trend: 'stable' },
];

export const mockTurnoverData = [
  { month: 'Oct', rate: 3.2 },
  { month: 'Nov', rate: 3.8 },
  { month: 'Dec', rate: 5.1 },
  { month: 'Jan', rate: 2.9 },
  { month: 'Feb', rate: 3.6 },
  { month: 'Mar', rate: 4.2 },
];

export const mockAIMessages = [
  {
    id: '1',
    role: 'assistant' as const,
    content: "Hello! I'm your Inventra AI Assistant. I can help you analyze your inventory, sales trends, customer behavior, and more. What would you like to know?",
    timestamp: '9:00 AM',
  },
];

export const mockSuggestedPrompts = [
  'What products should I reorder this week?',
  'Who are my top customers this month?',
  'What is my profit trend over the last 6 months?',
  'Which products are overstocked?',
  'What is my busiest sales day?',
  'Show me slow-moving inventory.',
];
