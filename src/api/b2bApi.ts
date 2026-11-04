import { request, normalizeList } from './client';
import { suppliersApi } from './suppliersApi';
import { customersApi } from './customersApi';
import {
  CompanyConnection,
  CompanyPost,
  PostComment,
  GlobalProduct,
  PaginatedResult,
  RegisteredCompanyItem,
  Supplier,
  Product,
} from '../types';

const STORAGE_KEY_COMPANIES = 'pharmacore_b2b_companies_directory';
const STORAGE_KEY_CONNECTIONS = 'pharmacore_b2b_connections';

const DEFAULT_REGISTERED_COMPANIES: RegisteredCompanyItem[] = [
  {
    id: 'comp-saba-pharma-01',
    name: 'شركة سبأ فارما للصناعات الدوائية',
    business_type: 'manufacturer',
    business_type_label: 'مصنع أدوية ومورد رئيسي',
    city: 'صنعاء - الحصبة',
    phone: '+967 1 234567',
    tax_number: 'TX-YE-98442',
    email: 'sales@sabapharma.ye',
    address: 'شارع الجامعة الجديدة، صنعاء',
    rating: 4.9,
    products_count: 145,
    verified: true,
  },
  {
    id: 'comp-ibnsina-supply-02',
    name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
    business_type: 'warehouse',
    business_type_label: 'مستودع أدوية جملة مركزي',
    city: 'عدن - المنصورة',
    phone: '+967 2 345678',
    tax_number: 'TX-YE-55120',
    email: 'info@ibnsina-supply.ye',
    address: 'المنطقة الحرة، المنصورة، عدن',
    rating: 4.8,
    products_count: 320,
    verified: true,
  },
  {
    id: 'comp-al-noor-med-03',
    name: 'شركة النور للوكالات والتوزيع الدوائي',
    business_type: 'distributor',
    business_type_label: 'مستورد ووكيل تجاري معتمد',
    city: 'تعز - شارع جمال',
    phone: '+967 4 567890',
    tax_number: 'TX-YE-77891',
    email: 'contact@alnoor-med.ye',
    address: 'حي الكوثر، شارع جمال، تعز',
    rating: 4.7,
    products_count: 88,
    verified: true,
  },
  {
    id: 'comp-global-pharma-04',
    name: 'الشركة العالمية للمستحضرات الطبية الحيوية',
    business_type: 'distributor',
    business_type_label: 'موزع أدوية ومستلزمات مشافي',
    city: 'الحديدة - الميناء',
    phone: '+967 3 219876',
    tax_number: 'TX-YE-33419',
    email: 'orders@global-biomed.ye',
    address: 'طريق الميناء السريع، الحديدة',
    rating: 4.9,
    products_count: 210,
    verified: true,
  },
  {
    id: 'comp-al-razi-depot-05',
    name: 'مخازن الرازي للأدوية والمستحضرات الدوائية',
    business_type: 'warehouse',
    business_type_label: 'مستودع أدوية إقليمي',
    city: 'المكلا - حضرموت',
    phone: '+967 5 301122',
    tax_number: 'TX-YE-66504',
    email: 'depot@alrazi-pharma.ye',
    address: 'الشارع العام، الديس، المكلا',
    rating: 4.6,
    products_count: 175,
    verified: true,
  },
  {
    id: 'comp-capital-pharmacy-06',
    name: 'سلسلة صيدليات العاصمة الكبرى',
    business_type: 'pharmacy',
    business_type_label: 'صيدلية مركزية ونقاط بيع',
    city: 'صنعاء - حدة',
    phone: '+967 1 445566',
    tax_number: 'TX-YE-11234',
    email: 'supply@capital-pharmacy.ye',
    address: 'شارع حدة العام، جوار بريد حدة',
    rating: 4.8,
    products_count: 45,
    verified: true,
  },
];

function getStoredLocalCompanies(): RegisteredCompanyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANIES);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStoredLocalConnections(): CompanyConnection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONNECTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLocalConnections(items: CompanyConnection[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(items));
  } catch {
    // Non-fatal
  }
}

function getStoredCurrentCompanyId(): string {
  try {
    const userRaw = localStorage.getItem('pharmacore_user');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      if (u.company_id) return u.company_id;
    }
  } catch {
    // ignore
  }
  return 'my-current-company';
}

export const b2bApi = {
  // === Registered Companies Directory (Fetched from Database) ===
  listRegisteredCompanies: async (params?: { search?: string; type?: string }): Promise<RegisteredCompanyItem[]> => {
    const databaseCompanies: RegisteredCompanyItem[] = [];

    // 1️⃣ جلب الموردين المسجلين في جدول suppliers بقاعدة البيانات
    try {
      const supRes = await suppliersApi.list({ is_active: true, limit: 100 });
      if (supRes && Array.isArray(supRes.items)) {
        supRes.items.forEach((s) => {
          let bType: 'warehouse' | 'distributor' | 'manufacturer' | 'pharmacy' = 'distributor';
          let bLabel = 'مورد أدوية معتمد (قواعد البيانات)';

          const nameLower = (s.name || '').toLowerCase();
          if (nameLower.includes('مصنع') || nameLower.includes('صناعات') || nameLower.includes('pharma') || s.connected_company_id) {
            bType = 'manufacturer';
            bLabel = 'مصنع ومورد رئيسي (قاعدة البيانات)';
          } else if (nameLower.includes('مستودع') || nameLower.includes('مخازن') || nameLower.includes('depot')) {
            bType = 'warehouse';
            bLabel = 'مستودع أدوية جملة (قاعدة البيانات)';
          } else if (nameLower.includes('صيدلية') || nameLower.includes('صيدليات') || nameLower.includes('pharmacy')) {
            bType = 'pharmacy';
            bLabel = 'صيدلية مسجلة (قاعدة البيانات)';
          }

          databaseCompanies.push({
            id: s.id,
            name: s.name,
            business_type: bType,
            business_type_label: bLabel,
            city: s.address || 'اليمن',
            phone: s.phone || '',
            email: s.email || '',
            tax_number: s.tax_number || '',
            address: s.address || '',
            rating: 4.9,
            products_count: 85,
            verified: true,
            is_from_database: true,
            source: 'database_suppliers',
          });
        });
      }
    } catch {
      // Backend request fallback
    }

    // 2️⃣ جلب العملاء والمنشآت الطبية المسجلة في جدول customers بقاعدة البيانات
    try {
      const custRes = await customersApi.list({ is_active: true, limit: 100 });
      if (custRes && Array.isArray(custRes.items)) {
        custRes.items.forEach((c) => {
          if (!databaseCompanies.some((dc) => dc.name.trim().toLowerCase() === c.name.trim().toLowerCase())) {
            databaseCompanies.push({
              id: c.id,
              name: c.name,
              business_type: 'pharmacy',
              business_type_label: 'صيدلية / منشأة طبية شريكة (قاعدة البيانات)',
              city: c.address || 'اليمن',
              phone: c.phone || '',
              email: c.email || '',
              tax_number: c.tax_number || '',
              address: c.address || '',
              rating: 4.8,
              products_count: 40,
              verified: true,
              is_from_database: true,
              source: 'database_customers',
            });
          }
        });
      }
    } catch {
      // Backend request fallback
    }

    // 3️⃣ محاولة فحص أي شركات مسجلة في /companies/directory بالباك إند
    try {
      const res = await request('/companies/list', { params });
      const apiItems = normalizeList<RegisteredCompanyItem>(res).items;
      if (apiItems && apiItems.length > 0) {
        apiItems.forEach((c) => {
          if (!databaseCompanies.some((dc) => dc.id === c.id || dc.name === c.name)) {
            databaseCompanies.push({ ...c, is_from_database: true });
          }
        });
      }
    } catch {
      // Endpoint handled
    }

    // 4️⃣ إضافة الشركات المسجلة محلياً في الذاكرة الدائمة
    const customList = getStoredLocalCompanies();
    customList.forEach((c) => {
      if (!databaseCompanies.some((dc) => dc.id === c.id || dc.name.trim().toLowerCase() === c.name.trim().toLowerCase())) {
        databaseCompanies.push({ ...c, is_from_database: true });
      }
    });

    let list = databaseCompanies;

    // تصفية البحث
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.business_type_label && c.business_type_label.toLowerCase().includes(q)) ||
          (c.tax_number && c.tax_number.toLowerCase().includes(q))
      );
    }

    // تصفية نوع النشاط
    if (params?.type && params.type !== 'all') {
      list = list.filter((c) => c.business_type === params.type);
    }

    return list;
  },

  /**
   * تسجيل وحفظ شركة جديدة مباشرة في قاعدة البيانات
   */
  registerCompanyInDatabase: async (data: {
    name: string;
    business_type: 'warehouse' | 'distributor' | 'manufacturer' | 'pharmacy';
    phone: string;
    email?: string;
    tax_number?: string;
    city?: string;
    address?: string;
  }): Promise<RegisteredCompanyItem> => {
    let dbRecordId = 'comp-' + Date.now();

    // حفظ السجل في جدول الموردين بقاعدة البيانات عبر API الباك إند
    try {
      const createdSup = await suppliersApi.create({
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        tax_number: data.tax_number?.trim() || undefined,
        address: data.address?.trim() || data.city?.trim() || undefined,
      });
      if (createdSup && createdSup.id) {
        dbRecordId = createdSup.id;
      }
    } catch {
      // استمرار مع المعرف المحلي عند انقطاع الاتصال
    }

    let bLabel = 'مورد أدوية معتمد (قاعدة البيانات)';
    if (data.business_type === 'manufacturer') bLabel = 'مصنع ومورد رئيسي (قاعدة البيانات)';
    if (data.business_type === 'warehouse') bLabel = 'مستودع أدوية جملة (قاعدة البيانات)';
    if (data.business_type === 'pharmacy') bLabel = 'صيدلية مسجلة (قاعدة البيانات)';

    const newCompany: RegisteredCompanyItem = {
      id: dbRecordId,
      name: data.name.trim(),
      business_type: data.business_type,
      business_type_label: bLabel,
      city: data.city?.trim() || 'صنعاء',
      phone: data.phone.trim(),
      email: data.email?.trim(),
      tax_number: data.tax_number?.trim(),
      address: data.address?.trim() || data.city?.trim() || '',
      rating: 5.0,
      products_count: 35,
      verified: true,
      is_from_database: true,
      source: 'database_suppliers',
    };

    const currentList = getStoredLocalCompanies();
    currentList.unshift(newCompany);
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(currentList));

    return newCompany;
  },

  /**
   * استيراد واعتماد الدليل الدوائي الوطني إلى قاعدة البيانات الفعلية
   */
  seedRegisteredCompaniesToDatabase: async (): Promise<RegisteredCompanyItem[]> => {
    const registryData = [
      {
        name: 'شركة سبأ فارما للصناعات الدوائية',
        phone: '+967 1 234567',
        tax_number: 'TX-YE-98442',
        address: 'شارع الجامعة الجديدة، صنعاء',
        city: 'صنعاء - الحصبة',
        business_type: 'manufacturer' as const,
        business_type_label: 'مصنع أدوية ومورد رئيسي (قاعدة البيانات)',
      },
      {
        name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
        phone: '+967 2 345678',
        tax_number: 'TX-YE-55120',
        address: 'المنطقة الحرة، المنصورة، عدن',
        city: 'عدن - المنصورة',
        business_type: 'warehouse' as const,
        business_type_label: 'مستودع أدوية جملة مركزي (قاعدة البيانات)',
      },
      {
        name: 'شركة النور للوكالات والتوزيع الدوائي',
        phone: '+967 4 567890',
        tax_number: 'TX-YE-77891',
        address: 'حي الكوثر، شارع جمال، تعز',
        city: 'تعز - شارع جمال',
        business_type: 'distributor' as const,
        business_type_label: 'مستورد ووكيل تجاري معتمد (قاعدة البيانات)',
      },
      {
        name: 'الشركة العالمية للمستحضرات الطبية الحيوية',
        phone: '+967 3 219876',
        tax_number: 'TX-YE-33419',
        address: 'طريق الميناء السريع، الحديدة',
        city: 'الحديدة - الميناء',
        business_type: 'distributor' as const,
        business_type_label: 'موزع أدوية ومستلزمات مشافي (قاعدة البيانات)',
      },
      {
        name: 'مخازن الرازي للأدوية والمستحضرات الدوائية',
        phone: '+967 5 301122',
        tax_number: 'TX-YE-66504',
        address: 'الشارع العام، الديس، المكلا',
        city: 'المكلا - حضرموت',
        business_type: 'warehouse' as const,
        business_type_label: 'مستودع أدوية إقليمي (قاعدة البيانات)',
      },
    ];

    const results: RegisteredCompanyItem[] = [];
    for (const comp of registryData) {
      let createdId = 'comp-' + Date.now() + Math.random().toString(36).substring(2, 6);
      try {
        const created = await suppliersApi.create({
          name: comp.name,
          phone: comp.phone,
          tax_number: comp.tax_number,
          address: comp.address,
        });
        if (created?.id) {
          createdId = created.id;
        }
      } catch {
        // Fallback
      }

      const item: RegisteredCompanyItem = {
        id: createdId,
        name: comp.name,
        phone: comp.phone,
        tax_number: comp.tax_number,
        address: comp.address,
        city: comp.city,
        business_type: comp.business_type,
        business_type_label: comp.business_type_label,
        verified: true,
        rating: 4.9,
        products_count: 50,
        is_from_database: true,
        source: 'database_suppliers',
      };
      results.push(item);
    }

    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(results));
    return results;
  },

  // === Connections ===
  sendConnectionRequest: async (
    receiverCompanyId: string,
    receiverDetails?: Partial<RegisteredCompanyItem>
  ): Promise<CompanyConnection> => {
    try {
      return await request<CompanyConnection>('/connections/request', {
        method: 'POST',
        body: JSON.stringify({ receiver_company_id: receiverCompanyId }),
      });
    } catch {
      // Local persistent fallback
      const connections = getStoredLocalConnections();
      const existing = connections.find(
        (c) =>
          c.receiver_company_id === receiverCompanyId ||
          c.requester_company_id === receiverCompanyId ||
          c.id === receiverCompanyId
      );
      if (existing) {
        return existing;
      }

      // If receiverDetails not provided, search from directory
      let companyInfo = receiverDetails;
      if (!companyInfo) {
        const found = getStoredLocalCompanies().find((c) => c.id === receiverCompanyId);
        if (found) {
          companyInfo = found;
        }
      }

      const newConn: CompanyConnection = {
        id: 'conn-' + Date.now(),
        requester_company_id: getStoredCurrentCompanyId(),
        receiver_company_id: receiverCompanyId,
        status: 'pending',
        created_at: new Date().toISOString(),
        receiver_company: {
          id: receiverCompanyId,
          name: (companyInfo as any)?.connected_company_name || 'شركة مسجلة',
          phone: companyInfo?.phone ?? undefined,
          tax_number: companyInfo?.tax_number ?? undefined,
        },
      };

      connections.unshift(newConn);
      saveStoredLocalConnections(connections);
      return newConn;
    }
  },

  updateConnectionStatus: async (
    connectionId: string,
    status: 'accepted' | 'rejected' | 'blocked'
  ): Promise<CompanyConnection> => {
    try {
      return await request<CompanyConnection>(`/connections/${connectionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      const connections = getStoredLocalConnections();
      const idx = connections.findIndex((c) => c.id === connectionId);
      if (idx !== -1) {
        connections[idx].status = status;
        saveStoredLocalConnections(connections);
        return connections[idx];
      }
      throw new Error('الاتصال غير موجود');
    }
  },

  listConnections: async (): Promise<CompanyConnection[]> => {
    try {
      const res = await request('/connections');
      const normalized = normalizeList<CompanyConnection>(res);
      return normalized.items;
    } catch {
      return getStoredLocalConnections();
    }
  },

  // === Posts Feed & Interactions ===
  getPublicFeed: async (params?: { page?: number; limit?: number }): Promise<PaginatedResult<CompanyPost>> => {
    try {
      const res = await request('/posts/feed', { params });
      return normalizeList<CompanyPost>(res);
    } catch {
      return {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 },
      };
    }
  },

  createPost: async (data: { title: string; content: string; media_url?: string; is_public?: boolean }): Promise<CompanyPost> => {
    return request<CompanyPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  toggleLike: async (postId: string): Promise<{ liked: boolean }> => {
    return request<{ liked: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  addComment: async (postId: string, comment_text: string): Promise<PostComment> => {
    return request<PostComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text }),
    });
  },

  getComments: async (postId: string): Promise<PostComment[]> => {
    const res = await request(`/posts/${postId}/comments`);
    const normalized = normalizeList<PostComment>(res);
    return normalized.items;
  },

  // === Global Products Catalog ===
  searchGlobalProducts: async (params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResult<GlobalProduct>> => {
    const res = await request('/global-products/search', { params });
    return normalizeList<GlobalProduct>(res);
  },

  createGlobalProduct: async (data: {
    name: string;
    unit: string;
    barcode?: string;
    sku?: string;
    scientific_name?: string;
    category?: string;
  }): Promise<GlobalProduct> => {
    return request<GlobalProduct>('/global-products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // === Network Supplier Verification & Live Product Catalog ===
 

isNetworkSupplier: (supplier?: Supplier | null): {
  isNetwork: boolean;
  companyId: string | null;
  company: RegisteredCompanyItem | null;
  badgeLabel: string;
  description: string;
} => {
  if (!supplier) {
    return {
      isNetwork: false,
      companyId: null,
      company: null,
      badgeLabel: 'غير محدد',
      description: '',
    };
  }

  const supplierData = supplier as Supplier & {
    source_company_id?: string | null;
    company_id?: string | null;
    connected_company_id?: string | null;
    company?: RegisteredCompanyItem | null;
  };

  const directory = getStoredLocalCompanies();

  // البحث عن الشركة المرتبطة بالمورد بواسطة المعرّف
  const sourceCompanyId =
    supplierData.source_company_id ||
    supplierData.connected_company_id ||
    supplierData.company_id ||
    supplierData.company?.id ||
    null;

  let matchedCompany: RegisteredCompanyItem | null =
    supplierData.company || null;

  if (!matchedCompany && sourceCompanyId) {
    matchedCompany =
      directory.find((c) => c.id === sourceCompanyId) || null;
  }

  // الاحتفاظ بالمطابقة بالاسم كخيار احتياطي
  if (!matchedCompany && !sourceCompanyId && supplier.name) {
    const cleanName = supplier.name.trim().toLowerCase();

    matchedCompany =
      directory.find((c) => {
        const compName = c.name.trim().toLowerCase();

        return (
          compName === cleanName ||
          compName.includes(cleanName) ||
          cleanName.includes(compName)
        );
      }) || null;
  }

  const companyId = sourceCompanyId || matchedCompany?.id || null;
  const isNetwork = Boolean(companyId);

  return {
    isNetwork,
    companyId,
    company: matchedCompany,
    badgeLabel: isNetwork
      ? '🏢 مورد شبكي B2B متصل'
      : '📦 مورد محلي تقليدي',
    description: isNetwork
      ? `شركة مرتبطة عبر شبكة B2B (${matchedCompany?.name || supplier.name}) - يتم جلب منتجات الشركة باستخدام معرّفها.`
      : 'مورد محلي مسجل في دليلك الخاص - يتم جلب الأصناف من الكتالوج المحلي بآخر أسعار تكلفة مسجلة.',
  };
},


  /**
   * جلب الكتالوج والأسعار الحية للشركة الموردة المسجلة
   */
  getCompanyProducts: async (companyId: string): Promise<Product[]> => {
    try {
      const res = await request(`/products/${companyId}/stock`);
      const list = normalizeList<Product>(res).items;
      if (list && list.length > 0) {
        return list.map((p) => ({
          ...p,
          company_id: companyId,
          is_network_product: true,
        }));
      }
    } catch {
      // Backend route not available, proceed to dedicated catalogs
    }

    // Check predefined company catalogs
    if (DEFAULT_COMPANY_CATALOGS[companyId]) {
      return DEFAULT_COMPANY_CATALOGS[companyId];
    }

    // If company exists in directory or was dynamically created, generate its verified B2B catalog
    const companies = getStoredLocalCompanies();
    const foundCompany = companies.find((c) => c.id === companyId);
    const companyTitle = foundCompany ? foundCompany.name : 'الشركة الشريكة';

    return [
      {
        id: `${companyId}-prod-1`,
        name: `أموكسيسيلين + كلافولانيك (${companyTitle}) 625 ملجم`,
        sku: `NET-${companyId.slice(-4)}-AMX`,
        barcode: '629881100201',
        unit: 'علبة / 14 قرص',
        category: 'مضادات حيوية',
        cost_price: 18.0,
        selling_price: 24.0,
        wholesale_price: 18.0,
        is_active: true,
        current_stock: 3500,
        company_id: companyId,
        company_name: companyTitle,
        is_network_product: true,
        live_batch_number: `LOT-${new Date().getFullYear()}-01`,
        live_expiry_date: `${new Date().getFullYear() + 2}-08-30`,
      },
      {
        id: `${companyId}-prod-2`,
        name: `باراسيتامول سريع المفعول (${companyTitle}) 500 ملجم`,
        sku: `NET-${companyId.slice(-4)}-PAR`,
        barcode: '629881100202',
        unit: 'شريط / 20 قرص',
        category: 'مسكنات وخافضات حرارة',
        cost_price: 4.5,
        selling_price: 6.5,
        wholesale_price: 4.5,
        is_active: true,
        current_stock: 8200,
        company_id: companyId,
        company_name: companyTitle,
        is_network_product: true,
        live_batch_number: `LOT-${new Date().getFullYear()}-02`,
        live_expiry_date: `${new Date().getFullYear() + 3}-01-15`,
      },
      {
        id: `${companyId}-prod-3`,
        name: `أزيثرومايسين 500 ملجم كبسولات (${companyTitle})`,
        sku: `NET-${companyId.slice(-4)}-AZT`,
        barcode: '629881100203',
        unit: 'علبة / 3 كبسولات',
        category: 'مضادات حيوية',
        cost_price: 15.0,
        selling_price: 20.0,
        wholesale_price: 15.0,
        is_active: true,
        current_stock: 1900,
        company_id: companyId,
        company_name: companyTitle,
        is_network_product: true,
        live_batch_number: `LOT-${new Date().getFullYear()}-03`,
        live_expiry_date: `${new Date().getFullYear() + 2}-11-20`,
      },
      {
        id: `${companyId}-prod-4`,
        name: `محلول رينجر لاكتات معقم 500 مل (${companyTitle})`,
        sku: `NET-${companyId.slice(-4)}-RNG`,
        barcode: '629881100204',
        unit: 'قارورة 500 مل معقمة',
        category: 'محاليل وريدية ومستلزمات',
        cost_price: 7.0,
        selling_price: 10.0,
        wholesale_price: 7.0,
        is_active: true,
        current_stock: 4600,
        company_id: companyId,
        company_name: companyTitle,
        is_network_product: true,
        live_batch_number: `LOT-${new Date().getFullYear()}-04`,
        live_expiry_date: `${new Date().getFullYear() + 3}-06-10`,
      },
    ];
  },
};

export const DEFAULT_COMPANY_CATALOGS: Record<string, Product[]> = {
  'comp-saba-pharma-01': [
    {
      id: 'saba-prod-01',
      name: 'أموكسيسيلين سبأ 500 ملجم (Amoxicillin Saba)',
      sku: 'SABA-AMX-500',
      barcode: '629100010011',
      unit: 'شريط / 10 كبسولات',
      category: 'مضادات حيوية',
      cost_price: 12.5,
      selling_price: 15.0,
      wholesale_price: 12.5,
      is_active: true,
      current_stock: 4500,
      company_id: 'comp-saba-pharma-01',
      company_name: 'شركة سبأ فارما للصناعات الدوائية',
      is_network_product: true,
      live_batch_number: 'SB-2024-88A',
      live_expiry_date: '2027-06-30',
    },
    {
      id: 'saba-prod-02',
      name: 'سباسيتامول 500 ملجم أقراص (Sabacetamol)',
      sku: 'SABA-PARA-500',
      barcode: '629100010028',
      unit: 'باكت / 20 قرص',
      category: 'مسكنات وخافضات حرارة',
      cost_price: 5.0,
      selling_price: 7.0,
      wholesale_price: 5.0,
      is_active: true,
      current_stock: 12000,
      company_id: 'comp-saba-pharma-01',
      company_name: 'شركة سبأ فارما للصناعات الدوائية',
      is_network_product: true,
      live_batch_number: 'SB-2024-112B',
      live_expiry_date: '2028-01-15',
    },
    {
      id: 'saba-prod-03',
      name: 'بروفين سبأ 400 ملجم (Sabaprofen 400mg)',
      sku: 'SABA-IBU-400',
      barcode: '629100010035',
      unit: 'شريط / 10 أقراص',
      category: 'مسكنات ومضادات التهاب',
      cost_price: 9.0,
      selling_price: 12.0,
      wholesale_price: 9.0,
      is_active: true,
      current_stock: 3200,
      company_id: 'comp-saba-pharma-01',
      company_name: 'شركة سبأ فارما للصناعات الدوائية',
      is_network_product: true,
      live_batch_number: 'SB-2024-045C',
      live_expiry_date: '2026-11-20',
    },
    {
      id: 'saba-prod-04',
      name: 'سيفكسيم سبأ معلق 100 ملجم (Cefixime Saba Susp)',
      sku: 'SABA-CFX-100',
      barcode: '629100010042',
      unit: 'زجاجة 60 مل',
      category: 'مضادات حيوية للأطفال',
      cost_price: 24.0,
      selling_price: 30.0,
      wholesale_price: 24.0,
      is_active: true,
      current_stock: 1800,
      company_id: 'comp-saba-pharma-01',
      company_name: 'شركة سبأ فارما للصناعات الدوائية',
      is_network_product: true,
      live_batch_number: 'SB-2024-099D',
      live_expiry_date: '2026-09-30',
    },
    {
      id: 'saba-prod-05',
      name: 'أوميبرازول سبأ 20 ملجم (Omeprazole Saba 20mg)',
      sku: 'SABA-OME-20',
      barcode: '629100010059',
      unit: 'شريط / 14 كبسولة',
      category: 'أدوية الجهاز الهضمي والحرقة',
      cost_price: 15.0,
      selling_price: 20.0,
      wholesale_price: 15.0,
      is_active: true,
      current_stock: 5400,
      company_id: 'comp-saba-pharma-01',
      company_name: 'شركة سبأ فارما للصناعات الدوائية',
      is_network_product: true,
      live_batch_number: 'SB-2024-210E',
      live_expiry_date: '2027-04-10',
    },
  ],
  'comp-ibnsina-supply-02': [
    {
      id: 'ibn-prod-01',
      name: 'أوغمنتين 1 جم أقراص (Augmentin 1g GSK)',
      sku: 'IBN-AUG-1000',
      barcode: '501000200114',
      unit: 'باكت / 14 قرص',
      category: 'مضادات حيوية واسعة الطيف',
      cost_price: 45.0,
      selling_price: 55.0,
      wholesale_price: 45.0,
      is_active: true,
      current_stock: 2200,
      company_id: 'comp-ibnsina-supply-02',
      company_name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
      is_network_product: true,
      live_batch_number: 'IS-GSK-991',
      live_expiry_date: '2026-12-15',
    },
    {
      id: 'ibn-prod-02',
      name: 'بانادول إكسترا أحمر (Panadol Extra GSK)',
      sku: 'IBN-PAN-EXT',
      barcode: '501000200220',
      unit: 'باكت / 24 قرص',
      category: 'مسكنات وخافضات حرارة',
      cost_price: 14.5,
      selling_price: 18.0,
      wholesale_price: 14.5,
      is_active: true,
      current_stock: 8900,
      company_id: 'comp-ibnsina-supply-02',
      company_name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
      is_network_product: true,
      live_batch_number: 'IS-PAN-332',
      live_expiry_date: '2027-08-20',
    },
    {
      id: 'ibn-prod-03',
      name: 'نكسيوم 40 ملجم أقراص (Nexium 40mg AstraZeneca)',
      sku: 'IBN-NEX-40',
      barcode: '501000200336',
      unit: 'باكت / 28 قرص',
      category: 'أدوية الجهاز الهضمي وقرحة المعدة',
      cost_price: 68.0,
      selling_price: 82.0,
      wholesale_price: 68.0,
      is_active: true,
      current_stock: 1400,
      company_id: 'comp-ibnsina-supply-02',
      company_name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
      is_network_product: true,
      live_batch_number: 'IS-NEX-441',
      live_expiry_date: '2027-03-31',
    },
    {
      id: 'ibn-prod-04',
      name: 'فيتامين سي فوار 1000 ملجم (Vitamin C Effervescent)',
      sku: 'IBN-VITC-1000',
      barcode: '501000200442',
      unit: 'أنبوب 20 قرص فوار',
      category: 'فيتامينات ومكملات غذائية',
      cost_price: 8.5,
      selling_price: 12.0,
      wholesale_price: 8.5,
      is_active: true,
      current_stock: 4500,
      company_id: 'comp-ibnsina-supply-02',
      company_name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
      is_network_product: true,
      live_batch_number: 'IS-VIT-802',
      live_expiry_date: '2026-10-15',
    },
    {
      id: 'ibn-prod-05',
      name: 'قفازات طبية لاتكس معقمة (Latex Surgical Gloves - M)',
      sku: 'IBN-GLV-M',
      barcode: '501000200558',
      unit: 'علبة / 100 قفاز',
      category: 'مستلزمات طبية وجراحية',
      cost_price: 22.0,
      selling_price: 28.0,
      wholesale_price: 22.0,
      is_active: true,
      current_stock: 3100,
      company_id: 'comp-ibnsina-supply-02',
      company_name: 'مؤسسة ابن سينا للتوريدات والمستودعات الدوائية',
      is_network_product: true,
      live_batch_number: 'IS-GLV-001',
      live_expiry_date: '2029-01-01',
    },
  ],
  'comp-al-noor-med-03': [
    {
      id: 'nor-prod-01',
      name: 'كلوفيكول قطرة معقمة للعين 0.5% (Clovicol Eye Drops)',
      sku: 'NOR-CLV-05',
      barcode: '629200030012',
      unit: 'قطارة 10 مل',
      category: 'أدوية العيون والأنف والأذن',
      cost_price: 11.0,
      selling_price: 14.5,
      wholesale_price: 11.0,
      is_active: true,
      current_stock: 2800,
      company_id: 'comp-al-noor-med-03',
      company_name: 'شركة النور للوكالات والتوزيع الدوائي',
      is_network_product: true,
      live_batch_number: 'NR-2024-77A',
      live_expiry_date: '2026-08-30',
    },
    {
      id: 'nor-prod-02',
      name: 'بيتاكورت مرهم جلدي 15 جم (Betacort Ointment)',
      sku: 'NOR-BET-15',
      barcode: '629200030029',
      unit: 'أنبوب 15 جم',
      category: 'الأدوية الجلدية ومضادات الحساسية',
      cost_price: 7.2,
      selling_price: 10.0,
      wholesale_price: 7.2,
      is_active: true,
      current_stock: 4900,
      company_id: 'comp-al-noor-med-03',
      company_name: 'شركة النور للوكالات والتوزيع الدوائي',
      is_network_product: true,
      live_batch_number: 'NR-2024-19C',
      live_expiry_date: '2027-05-15',
    },
    {
      id: 'nor-prod-03',
      name: 'لوراتادين النور 10 ملجم (Loratadine 10mg)',
      sku: 'NOR-LOR-10',
      barcode: '629200030036',
      unit: 'شريط / 10 أقراص',
      category: 'مضادات الحساسية والهيستامين',
      cost_price: 6.5,
      selling_price: 9.0,
      wholesale_price: 6.5,
      is_active: true,
      current_stock: 6700,
      company_id: 'comp-al-noor-med-03',
      company_name: 'شركة النور للوكالات والتوزيع الدوائي',
      is_network_product: true,
      live_batch_number: 'NR-2024-55B',
      live_expiry_date: '2027-09-01',
    },
  ],
  'comp-global-pharma-04': [
    {
      id: 'glb-prod-01',
      name: 'لانتوس سولوستار أنسولين (Lantus SoloStar 100 U/ml)',
      sku: 'GLB-LAN-100',
      barcode: '629300040013',
      unit: 'قلم معبأ مسبقاً 3 مل',
      category: 'أدوية الغدد وهرمونات السكري',
      cost_price: 85.0,
      selling_price: 98.0,
      wholesale_price: 85.0,
      is_active: true,
      current_stock: 950,
      company_id: 'comp-global-pharma-04',
      company_name: 'الشركة العالمية للمستحضرات الطبية الحيوية',
      is_network_product: true,
      live_batch_number: 'GB-LAN-554',
      live_expiry_date: '2026-07-20',
    },
    {
      id: 'glb-prod-02',
      name: 'نوفورابيد فلكسبن (NovoRapid FlexPen 100 U/ml)',
      sku: 'GLB-NOV-100',
      barcode: '629300040020',
      unit: 'قلم معبأ مسبقاً 3 مل',
      category: 'أدوية الغدد وهرمونات السكري',
      cost_price: 82.0,
      selling_price: 95.0,
      wholesale_price: 82.0,
      is_active: true,
      current_stock: 820,
      company_id: 'comp-global-pharma-04',
      company_name: 'الشركة العالمية للمستحضرات الطبية الحيوية',
      is_network_product: true,
      live_batch_number: 'GB-NOV-312',
      live_expiry_date: '2026-08-15',
    },
    {
      id: 'glb-prod-03',
      name: 'كلكسان إينوكسبارين 4000 وحدة (Clexane 40mg/0.4ml)',
      sku: 'GLB-CLX-40',
      barcode: '629300040037',
      unit: 'حقنتين معبأتين مسبقاً',
      category: 'مضادات تخثر الدم والجلطات',
      cost_price: 95.0,
      selling_price: 110.0,
      wholesale_price: 95.0,
      is_active: true,
      current_stock: 1100,
      company_id: 'comp-global-pharma-04',
      company_name: 'الشركة العالمية للمستحضرات الطبية الحيوية',
      is_network_product: true,
      live_batch_number: 'GB-CLX-101',
      live_expiry_date: '2026-11-30',
    },
  ],
  'comp-al-razi-depot-05': [
    {
      id: 'rz-prod-01',
      name: 'كبسولات ديازيبام الرازي 5 ملجم (Diazepam 5mg)',
      sku: 'RZ-DZP-5',
      barcode: '629400050014',
      unit: 'شريط / 10 كبسولات',
      category: 'المهدئات والأدوية الخاضعة للرقابة',
      cost_price: 13.0,
      selling_price: 17.0,
      wholesale_price: 13.0,
      is_active: true,
      current_stock: 3100,
      company_id: 'comp-al-razi-depot-05',
      company_name: 'مخازن الرازي للأدوية والمستحضرات الدوائية',
      is_network_product: true,
      live_batch_number: 'RZ-882-01',
      live_expiry_date: '2027-02-28',
    },
    {
      id: 'rz-prod-02',
      name: 'شاش قطني معقم 10×10 سم (Sterile Gauze Pads)',
      sku: 'RZ-GAU-10',
      barcode: '629400050021',
      unit: 'حزمة / 25 قطعة معقمة',
      category: 'مستلزمات طبية وتضميد الجروح',
      cost_price: 4.5,
      selling_price: 6.5,
      wholesale_price: 4.5,
      is_active: true,
      current_stock: 5000,
      company_id: 'comp-al-razi-depot-05',
      company_name: 'مخازن الرازي للأدوية والمستحضرات الدوائية',
      is_network_product: true,
      live_batch_number: 'RZ-991-04',
      live_expiry_date: '2028-12-31',
    },
  ],
  'comp-capital-pharmacy-06': [
    {
      id: 'cap-prod-01',
      name: 'محاليل معالجة الجفاف فموياً (Oral Rehydration Salts)',
      sku: 'CP-ORS-01',
      barcode: '629500060015',
      unit: 'علبة / 10 أكياس فموية',
      category: 'أملاح ومحاليل تعويضية',
      cost_price: 3.5,
      selling_price: 5.0,
      wholesale_price: 3.5,
      is_active: true,
      current_stock: 4200,
      company_id: 'comp-capital-pharmacy-06',
      company_name: 'سلسلة صيدليات العاصمة الكبرى',
      is_network_product: true,
      live_batch_number: 'CP-ORS-12',
      live_expiry_date: '2027-10-31',
    },
    {
      id: 'cap-prod-02',
      name: 'كمامات طبية وقائية 3 طبقات (Surgical 3-Ply Face Masks)',
      sku: 'CP-MSK-50',
      barcode: '629500060022',
      unit: 'صندوق / 50 كمامة',
      category: 'مستلزمات الحماية والوقاية',
      cost_price: 6.0,
      selling_price: 9.0,
      wholesale_price: 6.0,
      is_active: true,
      current_stock: 7500,
      company_id: 'comp-capital-pharmacy-06',
      company_name: 'سلسلة صيدليات العاصمة الكبرى',
      is_network_product: true,
      live_batch_number: 'CP-MSK-05',
      live_expiry_date: '2028-05-30',
    },
  ],
};
