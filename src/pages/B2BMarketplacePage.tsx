import React, { useState, useEffect, useCallback } from 'react';
import {
  Network,
  Share2,
  Heart,
  MessageSquare,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Building2,
  Send,
  BookOpen,
  RefreshCw,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  Truck,
  Star,
  MapPin,
  Phone,
  Filter,
} from 'lucide-react';
import { b2bApi } from '../api/b2bApi';
import { suppliersApi } from '../api/suppliersApi';
import {
  CompanyConnection,
  CompanyPost,
  PostComment,
  GlobalProduct,
  RegisteredCompanyItem,
} from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

interface B2BMarketplacePageProps {
  onNavigate?: (tab: string) => void;
}

export const B2BMarketplacePage: React.FC<B2BMarketplacePageProps> = ({ onNavigate }) => {
  const { company } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'connections' | 'catalog' | 'feed'>(
    'directory'
  );

  // ══════════════════════════════════════════════════════════════════════
  // DIRECTORY
  // ══════════════════════════════════════════════════════════════════════
  const [directoryCompanies, setDirectoryCompanies] = useState<RegisteredCompanyItem[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryType, setDirectoryType] = useState('all');
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  // Register Company Modal
  const [showRegisterCompanyModal, setShowRegisterCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyType, setNewCompanyType] = useState<
    'warehouse' | 'manufacturer' | 'distributor' | 'pharmacy'
  >('warehouse');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyTax, setNewCompanyTax] = useState('');
  const [newCompanyCity, setNewCompanyCity] = useState('صنعاء');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [registeringCompany, setRegisteringCompany] = useState(false);

  // ══════════════════════════════════════════════════════════════════════
  // FEED
  // ══════════════════════════════════════════════════════════════════════
  const [posts, setPosts] = useState<CompanyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);

  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postIsPublic, setPostIsPublic] = useState(true);
  const [savingPost, setSavingPost] = useState(false);

  const [activePostForComments, setActivePostForComments] = useState<CompanyPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // ══════════════════════════════════════════════════════════════════════
  // CATALOG
  // ══════════════════════════════════════════════════════════════════════
  const [catalogItems, setCatalogItems] = useState<GlobalProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);

  const [showNewGlobalModal, setShowNewGlobalModal] = useState(false);
  const [newGlobalName, setNewGlobalName] = useState('');
  const [newGlobalUnit, setNewGlobalUnit] = useState('علبة');
  const [newGlobalBarcode, setNewGlobalBarcode] = useState('');
  const [newGlobalSku, setNewGlobalSku] = useState('');
  const [newGlobalScientific, setNewGlobalScientific] = useState('');
  const [newGlobalCategory, setNewGlobalCategory] = useState('');
  const [newGlobalProductType, setNewGlobalProductType] = useState<
    'drug' | 'supplement' | 'cosmetic' | 'food' | 'device' | 'herbal' | 'veterinary' | 'other'
  >('drug');
  const [savingGlobal, setSavingGlobal] = useState(false);

  // ══════════════════════════════════════════════════════════════════════
  // CONNECTIONS
  // ══════════════════════════════════════════════════════════════════════
  const [connections, setConnections] = useState<CompanyConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [copiedCompanyId, setCopiedCompanyId] = useState(false);
  const [addingSupplierId, setAddingSupplierId] = useState<string | null>(null);
  const [supplierSuccessMsg, setSupplierSuccessMsg] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════
  // DATA LOADERS
  // ══════════════════════════════════════════════════════════════════════

  const loadDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    setDirectoryError(null);
    try {
      const res = await b2bApi.listRegisteredCompanies({
        search: directorySearch.trim() || undefined,
        type: directoryType !== 'all' ? directoryType : undefined,
      });
      setDirectoryCompanies(res);
    } catch (err: any) {
      setDirectoryError(err.message || 'تعذر تحميل دليل الشركات المسجلة');
    } finally {
      setDirectoryLoading(false);
    }
  }, [directorySearch, directoryType]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const res = await b2bApi.getPublicFeed({ page: postsPage, limit: 10 });
      setPosts(res.items || []);
      setPostsTotalPages(res.pagination.pages || 1);
    } catch (err: any) {
      setPostsError(err.message || 'تعذر تحميل منشورات شبكة الأعمال');
    } finally {
      setPostsLoading(false);
    }
  }, [postsPage]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await b2bApi.searchGlobalProducts({
        search: catalogSearch.trim() || undefined,
        page: catalogPage,
        limit: 15,
      });
      setCatalogItems(res.items || []);
      setCatalogTotalPages(res.pagination.pages || 1);
      setCatalogTotal(res.pagination.total || 0);
    } catch (err: any) {
      setCatalogError(err.message || 'تعذر تحميل الفهرس الدوائي الموحد');
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogSearch, catalogPage]);

  // ✅ FIX: listConnections يُرجع { items, pagination }
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    setConnectionsError(null);
    try {
      const res = await b2bApi.listConnections();
      setConnections(res.items || []);
    } catch (err: any) {
      setConnectionsError(err.message || 'تعذر تحميل اتصالات الشركات');
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
    if (activeSubTab === 'directory') loadDirectory();
    else if (activeSubTab === 'feed') loadPosts();
    else if (activeSubTab === 'catalog') loadCatalog();
    else if (activeSubTab === 'connections') loadConnections();
  }, [activeSubTab, loadDirectory, loadPosts, loadCatalog, loadConnections]);

  // ══════════════════════════════════════════════════════════════════════
  // DIRECTORY HANDLERS
  // ══════════════════════════════════════════════════════════════════════

  // ✅ FIX: sendConnectionRequest بدون argument ثانٍ
  const handleSendDirectRequest = async (targetComp: RegisteredCompanyItem) => {
    setSendingRequestId(targetComp.id);
    try {
      await b2bApi.sendConnectionRequest(targetComp.id);
      await loadConnections();
      setSupplierSuccessMsg(`تم إرسال طلب المصادقة إلى "${targetComp.name}" بنجاح!`);
      setTimeout(() => setSupplierSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال طلب المصادقة');
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleInstantAccept = async (connId: string, compName: string) => {
    try {
      await b2bApi.updateConnectionStatus(connId, 'accepted');
      await loadConnections();
      setSupplierSuccessMsg(
        `تم قبول واعتماد الشراكة مع "${compName}" بنجاح! يمكنك الآن إضافتها كمورد.`
      );
      setTimeout(() => setSupplierSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'تعذر اعتماد الشراكة');
    }
  };

  const handleAddToSuppliersFromDirectory = async (comp: RegisteredCompanyItem) => {
    setAddingSupplierId(comp.id);
    try {
      await suppliersApi.create({
        name: comp.name,
        phone: comp.phone || undefined,
        tax_number: comp.tax_number || undefined,
        address: comp.address || undefined,
        connected_company_id: comp.id,
      });
      setSupplierSuccessMsg(
        `تمت إضافة "${comp.name}" بنجاح إلى قائمة مورديك! يمكنك الآن إصدار أوامر شراء مباشرة منها.`
      );
      setTimeout(() => setSupplierSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'تعذر إضافة الشركة كمورد (قد تكون مضافة مسبقاً في دليلك)');
    } finally {
      setAddingSupplierId(null);
    }
  };

  // ✅ FIX: registerCompany بدلاً من registerCompanyInDatabase
  const handleRegisterCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyPhone.trim()) {
      alert('يرجى إدخال اسم الشركة ورقم الهاتف');
      return;
    }

    setRegisteringCompany(true);
    try {
      await b2bApi.registerCompany({
        name: newCompanyName.trim(),
        business_type: newCompanyType,
        phone: newCompanyPhone.trim(),
        email: newCompanyEmail.trim() || undefined,
        tax_number: newCompanyTax.trim() || undefined,
        city: newCompanyCity.trim() || undefined,
        address: newCompanyAddress.trim() || undefined,
      });

      setShowRegisterCompanyModal(false);
      setNewCompanyName('');
      setNewCompanyPhone('');
      setNewCompanyEmail('');
      setNewCompanyTax('');
      setNewCompanyAddress('');
      setSupplierSuccessMsg('تم تسجيل وحفظ الشركة بنجاح في قاعدة البيانات المركزية!');
      setTimeout(() => setSupplierSuccessMsg(null), 5000);
      loadDirectory();
    } catch (err: any) {
      alert(err.message || 'تعذر تسجيل الشركة في قاعدة البيانات');
    } finally {
      setRegisteringCompany(false);
    }
  };

  const handleCopyMyCompanyId = () => {
    if (company?.id) {
      navigator.clipboard.writeText(company.id);
      setCopiedCompanyId(true);
      setTimeout(() => setCopiedCompanyId(false), 3000);
    }
  };

  // ✅ FIX: استخدام connected_company_id
  const handleAddToSuppliers = async (conn: CompanyConnection) => {
    const otherCompanyId = conn.connected_company_id;
    const supplierName = conn.connected_company_name || 'مورد شريك مسجل';

    if (!otherCompanyId) return;

    setAddingSupplierId(conn.id);
    try {
      await suppliersApi.create({
        name: supplierName,
        phone: conn.connected_company_phone || undefined,
        tax_number: conn.connected_company_tax_number || undefined,
        address: conn.connected_company_address || undefined,
        connected_company_id: otherCompanyId,
      });
      setSupplierSuccessMsg(
        `تمت إضافة "${supplierName}" بنجاح إلى قائمة مورديك! يمكنك الآن إصدار أوامر شراء مباشرة منها.`
      );
      setTimeout(() => setSupplierSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'تعذر إضافة الشركة كمورد (قد تكون مضافة مسبقاً في دليلك)');
    } finally {
      setAddingSupplierId(null);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // FEED HANDLERS
  // ══════════════════════════════════════════════════════════════════════

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await b2bApi.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const currentLikes = p.likes_count || 0;
            return {
              ...p,
              is_liked_by_me: res.liked,
              likes_count: res.liked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Like error:', err);
    }
  };

  const handleOpenComments = async (post: CompanyPost) => {
    setActivePostForComments(post);
    setCommentsLoading(true);
    try {
      const list = await b2bApi.getComments(post.id);
      setComments(list || []);
    } catch (err: any) {
      console.error('Failed to load comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePostForComments || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const newComment = await b2bApi.addComment(
        activePostForComments.id,
        newCommentText.trim()
      );
      setComments((prev) => [newComment, ...prev]);
      setNewCommentText('');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activePostForComments.id
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || 'فشل إضافة التعليق');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    setSavingPost(true);
    try {
      await b2bApi.createPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        media_url: postMediaUrl.trim() || undefined,
        is_public: postIsPublic,
      });
      setShowNewPostModal(false);
      setPostTitle('');
      setPostContent('');
      setPostMediaUrl('');
      loadPosts();
    } catch (err: any) {
      alert(err.message || 'تعذر نشر العرض التجاري');
    } finally {
      setSavingPost(false);
    }
  };

  // ✅ FIX: product_type إلزامي
  const handleCreateGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobalName.trim() || !newGlobalUnit.trim()) return;

    setSavingGlobal(true);
    try {
      await b2bApi.createGlobalProduct({
        name: newGlobalName.trim(),
        unit: newGlobalUnit.trim(),
        product_type: newGlobalProductType,
        barcode: newGlobalBarcode.trim() || undefined,
        sku: newGlobalSku.trim() || undefined,
        scientific_name: newGlobalScientific.trim() || undefined,
        category: newGlobalCategory.trim() || undefined,
      });
      setShowNewGlobalModal(false);
      setNewGlobalName('');
      setNewGlobalBarcode('');
      setNewGlobalSku('');
      setNewGlobalScientific('');
      setNewGlobalCategory('');
      loadCatalog();
    } catch (err: any) {
      alert(err.message || 'تعذر إضافة الدواء إلى الفهرس الموحد');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSendConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompanyId.trim()) return;

    setSendingRequest(true);
    try {
      await b2bApi.sendConnectionRequest(targetCompanyId.trim());
      setShowRequestModal(false);
      setTargetCompanyId('');
      loadConnections();
      setSupplierSuccessMsg('تم إرسال طلب الربط بنجاح!');
      setTimeout(() => setSupplierSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال طلب الربط');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleUpdateStatus = async (
    connectionId: string,
    status: 'accepted' | 'rejected' | 'blocked'
  ) => {
    try {
      await b2bApi.updateConnectionStatus(connectionId, status);
      loadConnections();
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث حالة الاتصال');
    }
  };

  const filteredConnections = connections.filter((conn) => {
    if (connectionFilter === 'all') return true;
    return conn.status === connectionFilter;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Network className="w-7 h-7 text-emerald-600" />
            سوق الأعمال الصيدلانية الموحد (B2B Marketplace)
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            شبكة تفاعلية حية لربط الموردين والمستودعات والصيدليات، وتبادل العروض الدوائية
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span className="text-slate-600">منشأتك الحالية:</span>
          <span className="font-bold text-emerald-950">{company?.name || 'شركة صيدلانية'}</span>
          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
            ID: {company?.id?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Global Success Alert */}
      {supplierSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{supplierSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSupplierSuccessMsg(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition shrink-0 ${
            activeSubTab === 'directory'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          دليل الشركات
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            {directoryCompanies.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('connections')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition shrink-0 ${
            activeSubTab === 'connections'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4 text-blue-600" />
          علاقات الشراكة
          {connections.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {connections.length}
            </span>
          )}
          {connections.filter((c) => c.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition shrink-0 ${
            activeSubTab === 'catalog'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          الفهرس الدوائي
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('feed')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition shrink-0 ${
            activeSubTab === 'feed'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4 text-amber-600" />
          عروض الشركات
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: DIRECTORY */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  دليل المنشآت الصيدلانية المعتمدة
                </div>
                <h2 className="text-lg md:text-xl font-black">
                  تصفح الشركات وأرسل طلب مصادقة مباشر
                </h2>
                <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
                  اختر المنشأة واضغط "إرسال طلب مصادقة" ليتم ربط حسابك بها فوراً.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-xs text-white space-y-1.5 shrink-0 min-w-[240px]">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-200 text-[11px]">معرف شركتك:</span>
                  <button
                    type="button"
                    onClick={handleCopyMyCompanyId}
                    className="flex items-center gap-1 text-[11px] font-bold text-white hover:text-emerald-300 transition"
                  >
                    {copiedCompanyId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedCompanyId ? 'تم النسخ' : 'نسخ'}
                  </button>
                </div>
                <div className="font-mono text-[11px] bg-slate-950/40 px-2 py-1 rounded-lg truncate select-all">
                  {company?.id || 'غير متوفر'}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="ابحث باسم المنشأة، المدينة، أو النشاط..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadDirectory}
                  disabled={directoryLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${directoryLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  ربط بمعرف يدوي
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 text-xs font-bold">
              <span className="text-slate-500 text-[11px] shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                تصنيف:
              </span>
              {[
                { key: 'all', label: 'الكل' },
                { key: 'warehouse', label: 'مستودعات' },
                { key: 'manufacturer', label: 'مصانع' },
                { key: 'distributor', label: 'موزعين' },
                { key: 'pharmacy', label: 'صيدليات' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDirectoryType(tab.key)}
                  className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                    directoryType === tab.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {directoryError && <ErrorAlert error={directoryError} onRetry={loadDirectory} />}

          {directoryLoading ? (
            <div className="py-20">
              <LoadingSpinner message="جاري استرجاع دليل الشركات..." />
            </div>
          ) : directoryCompanies.length === 0 ? (
            <EmptyState
              title="لم يتم العثور على منشآت مطابقة"
              description="جرب البحث بكلمة أخرى أو مسح الفلاتر"
              actionLabel="إعادة ضبط البحث"
              onAction={() => {
                setDirectorySearch('');
                setDirectoryType('all');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directoryCompanies.map((comp) => {
                // ✅ FIX: استخدام connected_company_id
                const existingConn = connections.find(
                  (c) => c.connected_company_id === comp.id
                );
                const connStatus = existingConn?.status;

                return (
                  <div
                    key={comp.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                            {comp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-black text-slate-900 leading-snug">
                                {comp.name}
                              </h3>
                              {comp.verified && (
                                <span title="منشأة مرخصة">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="inline-block mt-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {comp.business_type_label}
                            </span>
                          </div>
                        </div>

                        {comp.rating && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{comp.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50/80 rounded-2xl p-3 text-xs space-y-1.5 text-slate-600 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {comp.city} - {comp.address || 'اليمن'}
                          </span>
                        </div>
                        {comp.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span dir="ltr" className="font-mono text-[11px] text-slate-700 font-bold">
                              {comp.phone}
                            </span>
                          </div>
                        )}
                        {comp.tax_number && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                            <span className="text-slate-500">الرقم الضريبي:</span>
                            <span className="font-mono font-bold text-slate-700">
                              {comp.tax_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {!connStatus && (
                        <button
                          type="button"
                          onClick={() => handleSendDirectRequest(comp)}
                          disabled={sendingRequestId === comp.id}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50 active:scale-[0.98]"
                        >
                          {sendingRequestId === comp.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              جاري إرسال الطلب...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              إرسال طلب مصادقة
                            </>
                          )}
                        </button>
                      )}

                      {connStatus === 'pending' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-3 py-2 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-600" />
                              طلب قيد الانتظار
                            </span>
                          </div>
                          {existingConn && (
                            <button
                              type="button"
                              onClick={() =>
                                handleInstantAccept(existingConn.id, comp.name)
                              }
                              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              قبول الشراكة الآن
                            </button>
                          )}
                        </div>
                      )}

                      {connStatus === 'accepted' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>شريك مصادق عليه ✓</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddToSuppliersFromDirectory(comp)}
                              disabled={addingSupplierId === comp.id}
                              className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition disabled:opacity-50"
                            >
                              <Truck className="w-3.5 h-3.5 text-slate-600" />
                              {addingSupplierId === comp.id
                                ? 'جاري الإضافة...'
                                : 'إضافة كمورد'}
                            </button>
                            {onNavigate && (
                              <button
                                type="button"
                                onClick={() => onNavigate('purchase-orders')}
                                className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                طلب شراء
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {connStatus === 'rejected' && (
                        <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 font-bold">
                          <span>تم رفض الطلب</span>
                          <button
                            type="button"
                            onClick={() => handleSendDirectRequest(comp)}
                            className="text-[11px] underline text-rose-800 hover:text-rose-900"
                          >
                            إعادة الإرسال
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CONNECTIONS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'connections' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                علاقات الشراكة والربط الشبكي
              </h2>
              <p className="text-xs text-slate-700">
                إدارة طلبات الربط لتبادل الفواتير وعروض الأسعار
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadConnections}
                disabled={connectionsLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connectionsLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                طلب ربط جديد
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-900">
                  معرف منشأتك (Company UUID):
                </span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
                  جاهز للمشاركة
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 font-mono select-all">
                {company?.id || 'غير متوفر'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyMyCompanyId}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shrink-0 shadow-xs"
            >
              {copiedCompanyId ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  تم نسخ المعرف!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  نسخ معرّف شركتي
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 w-fit text-xs font-bold">
            <button
              type="button"
              onClick={() => setConnectionFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                connectionFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({connections.length})
            </button>
            <button
              type="button"
              onClick={() => setConnectionFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition ${
                connectionFilter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بانتظار الموافقة ({connections.filter((c) => c.status === 'pending').length})
            </button>
            <button
              type="button"
              onClick={() => setConnectionFilter('accepted')}
              className={`px-3 py-1.5 rounded-lg transition ${
                connectionFilter === 'accepted'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              متصلون معتمدون ({connections.filter((c) => c.status === 'accepted').length})
            </button>
          </div>

          {connectionsError && (
            <ErrorAlert error={connectionsError} onRetry={loadConnections} />
          )}

          {connectionsLoading ? (
            <div className="py-16">
              <LoadingSpinner message="جاري استعلام قائمة الاتصالات..." />
            </div>
          ) : filteredConnections.length === 0 ? (
            <EmptyState
              title="لا توجد اتصالات في هذا القسم"
              description="أرسل طلب ربط إلى الصيدليات أو الموردين لبدء التبادل التجاري الآمن"
              actionLabel="تصفح دليل الشركات"
              onAction={() => setActiveSubTab('directory')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnections.map((conn) => {
                const isIncoming = conn.receiver_company_id === company?.id;

                // ✅ FIX: استخدام connected_company_*
                const otherCompany = {
                  id: conn.connected_company_id,
                  name: conn.connected_company_name,
                  phone: conn.connected_company_phone,
                  address: conn.connected_company_address,
                  tax_number: conn.connected_company_tax_number,
                };

                return (
                  <div
                    key={conn.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                            {otherCompany?.name ? otherCompany.name.charAt(0) : 'ش'}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">
                              {otherCompany?.name || 'شركة غير مسماة'}
                            </h4>
                            <span className="text-[10px] text-slate-600">
                              {isIncoming ? 'طلب وارد إليك' : 'طلب صادر منك'}
                            </span>
                          </div>
                        </div>

                        <Badge status={conn.status} />
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700 font-sans">معرف المنشأة:</span>
                          <span className="font-bold flex items-center gap-1">
                            {(otherCompany?.id || '').slice(0, 8)}...
                            <button
                              type="button"
                              onClick={() => {
                                if (otherCompany?.id) {
                                  navigator.clipboard.writeText(otherCompany.id);
                                }
                              }}
                              title="نسخ المعرف بالكامل"
                              className="text-slate-400 hover:text-emerald-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                        {otherCompany?.tax_number && (
                          <div className="flex justify-between">
                            <span className="text-slate-700 font-sans">الرقم الضريبي:</span>
                            <span>{otherCompany.tax_number}</span>
                          </div>
                        )}
                        {otherCompany?.phone && (
                          <div className="flex justify-between">
                            <span className="text-slate-700 font-sans">الهاتف:</span>
                            <span>{otherCompany.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {conn.status === 'pending' && (
                      <div className="border-t border-slate-100 pt-3 mt-4">
                        {isIncoming ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(conn.id, 'accepted')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              قبول
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(conn.id, 'rejected')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              رفض
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-1">
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                              ⏳ في انتظار رد الطرف الآخر...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {conn.status === 'accepted' && (
                      <div className="space-y-2 border-t border-slate-100 pt-3 mt-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>الشراكة نشطة ومعتمدة</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToSuppliers(conn)}
                          disabled={addingSupplierId === conn.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-xs disabled:opacity-50"
                        >
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          {addingSupplierId === conn.id
                            ? 'جاري الإضافة...'
                            : 'إضافة إلى قائمة مورديني'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CATALOG */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                الفهرس الدوائي الموحد (Global Drug Registry)
              </h2>
              <p className="text-xs text-slate-700">
                قاعدة بيانات دوائية معيارية مشتركة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadCatalog}
                disabled={catalogLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${catalogLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                type="button"
                onClick={() => setShowNewGlobalModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                إضافة دواء
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setCatalogPage(1);
                }}
                placeholder="ابحث بالاسم التجاري، الاسم العلمي، الباركود، أو SKU..."
                className="w-full pl-3 pr-10 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {catalogError && <ErrorAlert error={catalogError} onRetry={loadCatalog} />}

          {catalogLoading ? (
            <div className="py-16">
              <LoadingSpinner message="جاري استعلام الفهرس الدوائي..." />
            </div>
          ) : catalogItems.length === 0 ? (
            <EmptyState
              title="لم يتم العثور على أدوية مطابقة"
              description="أضف أدوية جديدة إلى الفهرس الدوائي"
              actionLabel="إضافة دواء جديد"
              onAction={() => setShowNewGlobalModal(true)}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-black">
                    <tr>
                      <th className="py-3 px-4">اسم الدواء</th>
                      <th className="py-3 px-4">الاسم العلمي</th>
                      <th className="py-3 px-4">الوحدة</th>
                      <th className="py-3 px-4">الباركود</th>
                      <th className="py-3 px-4">التصنيف</th>
                      <th className="py-3 px-4">التوثيق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalogItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {item.scientific_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {item.barcode || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.category || 'عام'}</td>
                        <td className="py-3 px-4">
                          {item.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              معتمد
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              قيد المراجعة
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>إجمالي الأدوية: {catalogTotal}</span>
                {catalogTotalPages > 1 && (
                  <Pagination
                    pagination={{
                      page: catalogPage,
                      limit: 15,
                      total: catalogTotal,
                      pages: catalogTotalPages,
                    }}
                    onPageChange={(p) => setCatalogPage(p)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 4: FEED */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'feed' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                العروض التجارية والتنبيهات
              </h2>
              <p className="text-xs text-slate-700">
                تصفح أحدث الخصومات والتوريدات
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadPosts}
                disabled={postsLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${postsLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                type="button"
                onClick={() => setShowNewPostModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                نشر عرض
              </button>
            </div>
          </div>

          {postsError && <ErrorAlert error={postsError} onRetry={loadPosts} />}

          {postsLoading ? (
            <div className="py-16">
              <LoadingSpinner message="جاري تحميل عروض الشركات..." />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="لا توجد عروض منشورة"
              description="كن أول من ينشر عروض التوريد"
              actionLabel="نشر أول عرض"
              onAction={() => setShowNewPostModal(true)}
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-sm">
                        {post.company?.name ? post.company.name.charAt(0) : 'ش'}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {post.company?.name || post.company_name || 'شركة دوائية'}
                        </h4>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.created_at
                            ? new Date(post.created_at).toLocaleDateString('ar-SA', {
                                dateStyle: 'medium',
                              })
                            : 'الآن'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {post.is_public ? 'عرض عام' : 'خاص بالشركاء'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {post.media_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 max-h-64 bg-slate-50">
                      <img
                        src={post.media_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition font-bold ${
                        post.is_liked_by_me
                          ? 'text-rose-600'
                          : 'text-slate-600 hover:text-rose-600'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.is_liked_by_me ? 'fill-rose-600' : ''
                        }`}
                      />
                      <span>{post.likes_count || 0} إعجاب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenComments(post)}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 transition font-bold"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments_count || 0} تعليق</span>
                    </button>
                  </div>
                </div>
              ))}

              {postsTotalPages > 1 && (
                <div className="pt-4 flex justify-center">
                  <Pagination
                    pagination={{
                      page: postsPage,
                      limit: 10,
                      total: 0,
                      pages: postsTotalPages,
                    }}
                    onPageChange={(p) => setPostsPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE POST */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        title="نشر عرض تجاري في شبكة B2B"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان العرض *
            </label>
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="مثال: خصم 20% على مضادات حيوية"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              التفاصيل *
            </label>
            <textarea
              required
              rows={4}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="اذكر الأصناف والشروط..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط صورة (اختياري)
            </label>
            <input
              type="url"
              value={postMediaUrl}
              onChange={(e) => setPostMediaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public_check"
              checked={postIsPublic}
              onChange={(e) => setPostIsPublic(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md border-slate-300"
            />
            <label htmlFor="is_public_check" className="text-xs font-bold text-slate-700">
              منشور عام لجميع الشركات
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewPostModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={savingPost}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {savingPost ? 'جاري النشر...' : 'نشر العرض'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL: COMMENTS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activePostForComments && (
        <Modal
          isOpen={!!activePostForComments}
          onClose={() => setActivePostForComments(null)}
          title={`التعليقات: ${activePostForComments.title}`}
        >
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto space-y-3 p-1">
              {commentsLoading ? (
                <div className="py-8">
                  <LoadingSpinner message="جاري استرجاع التعليقات..." />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">
                  لا توجد تعليقات حتى الآن
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {comment.user?.name || comment.company?.name || 'مستخدم'}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {comment.created_at
                          ? new Date(comment.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="text-slate-600">{comment.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddComment}
              className="flex gap-2 pt-3 border-t border-slate-100"
            >
              <input
                type="text"
                required
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="اكتب تعليقك..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                إرسال
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE GLOBAL PRODUCT */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showNewGlobalModal}
        onClose={() => setShowNewGlobalModal(false)}
        title="إضافة دواء جديد إلى الفهرس الموحد"
      >
        <form onSubmit={handleCreateGlobal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الاسم التجاري *
            </label>
            <input
              type="text"
              required
              value={newGlobalName}
              onChange={(e) => setNewGlobalName(e.target.value)}
              placeholder="مثال: Panadol Extra"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاسم العلمي
              </label>
              <input
                type="text"
                value={newGlobalScientific}
                onChange={(e) => setNewGlobalScientific(e.target.value)}
                placeholder="Paracetamol"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الوحدة *
              </label>
              <input
                type="text"
                required
                value={newGlobalUnit}
                onChange={(e) => setNewGlobalUnit(e.target.value)}
                placeholder="علبة / شريط"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نوع المنتج * (إلزامي)
            </label>
            <select
              required
              value={newGlobalProductType}
              onChange={(e) =>
                setNewGlobalProductType(
                  e.target.value as
                    | 'drug'
                    | 'supplement'
                    | 'cosmetic'
                    | 'food'
                    | 'device'
                    | 'herbal'
                    | 'veterinary'
                    | 'other'
                )
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="drug">دواء</option>
              <option value="supplement">مكمل غذائي</option>
              <option value="cosmetic">مستحضر تجميل</option>
              <option value="food">غذاء</option>
              <option value="device">جهاز طبي</option>
              <option value="herbal">عشبي</option>
              <option value="veterinary">بيطري</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الباركود
              </label>
              <input
                type="text"
                value={newGlobalBarcode}
                onChange={(e) => setNewGlobalBarcode(e.target.value)}
                placeholder="628100123456"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رمز SKU
              </label>
              <input
                type="text"
                value={newGlobalSku}
                onChange={(e) => setNewGlobalSku(e.target.value)}
                placeholder="MED-PAN-001"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              التصنيف
            </label>
            <input
              type="text"
              value={newGlobalCategory}
              onChange={(e) => setNewGlobalCategory(e.target.value)}
              placeholder="مسكنات / مضادات حيوية"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewGlobalModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={savingGlobal}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {savingGlobal ? 'جاري الحفظ...' : 'إضافة للفهرس'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL: MANUAL REQUEST CONNECTION */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="إرسال طلب ربط بالمعرف"
      >
        <form onSubmit={handleSendConnection} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            إذا كان لديك المعرف الفريد (Company UUID) لمنشأة غير ظاهرة في الدليل، أدخله هنا.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              معرف المنشأة المستهدفة (UUID) *
            </label>
            <input
              type="text"
              required
              value={targetCompanyId}
              onChange={(e) => setTargetCompanyId(e.target.value)}
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={sendingRequest}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {sendingRequest ? 'جاري الإرسال...' : 'إرسال طلب الربط'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL: REGISTER NEW COMPANY */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showRegisterCompanyModal}
        onClose={() => setShowRegisterCompanyModal(false)}
        title="تسجيل شركة / منشأة دوائية جديدة"
        maxWidth="2xl"
      >
        <form onSubmit={handleRegisterCompanySubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            يتم حفظ المنشأة مباشرة في قاعدة بيانات النظام مع توليد معرف فريد (UUID) رسمي.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الشركة *
              </label>
              <input
                type="text"
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="شركة المتحدون للأدوية"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع النشاط *
              </label>
              <select
                required
                value={newCompanyType}
                onChange={(e) =>
                  setNewCompanyType(
                    e.target.value as
                      | 'warehouse'
                      | 'manufacturer'
                      | 'distributor'
                      | 'pharmacy'
                  )
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="warehouse">مستودع أدوية</option>
                <option value="manufacturer">مصنع</option>
                <option value="distributor">موزع معتمد</option>
                <option value="pharmacy">صيدلية</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف *
              </label>
              <input
                type="tel"
                required
                value={newCompanyPhone}
                onChange={(e) => setNewCompanyPhone(e.target.value)}
                placeholder="+967 1 234567"
                dir="ltr"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={newCompanyEmail}
                onChange={(e) => setNewCompanyEmail(e.target.value)}
                placeholder="info@company.ye"
                dir="ltr"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرقم الضريبي
              </label>
              <input
                type="text"
                value={newCompanyTax}
                onChange={(e) => setNewCompanyTax(e.target.value)}
                placeholder="TX-YE-XXXXX"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المدينة
              </label>
              <input
                type="text"
                value={newCompanyCity}
                onChange={(e) => setNewCompanyCity(e.target.value)}
                placeholder="صنعاء / عدن / تعز"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              العنوان التفصيلي
            </label>
            <input
              type="text"
              value={newCompanyAddress}
              onChange={(e) => setNewCompanyAddress(e.target.value)}
              placeholder="الشارع، الحي..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRegisterCompanyModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={registeringCompany}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {registeringCompany ? 'جاري الحفظ...' : 'حفظ وتسجيل'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};