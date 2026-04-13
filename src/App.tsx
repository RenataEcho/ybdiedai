import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  LayoutDashboard, 
  Clock, 
  Tag,
  Search,
  Info,
  HelpCircle,
  Home,
  BarChart3,
  Flame,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  Settings,
  ChevronLeft,
  Edit2,
  Check,
  ChevronDown
} from 'lucide-react';
import { 
  individualData, 
  teamData, 
  communityData, 
  brandRecommendationData,
  dramaRecommendationData,
  dramaCategoryData,
  fieldConfigurationData,
  LeaderboardEntry, 
  CommunityEntry,
  BrandRecommendation,
  DramaRecommendation,
  DramaCategory,
  FieldConfiguration
} from './mockData';

type ModuleType = 'leaderboard' | 'recommendation' | 'config';
type LeaderboardTab = 'individual' | 'team' | 'community';
type RecommendationTab = 'brand' | 'drama' | 'category';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('leaderboard');
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>('individual');
  const [recommendationTab, setRecommendationTab] = useState<RecommendationTab>('brand');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dimensionFilter, setDimensionFilter] = useState<string>('all');
  const [hotFilter, setHotFilter] = useState<string>('all');
  const [newFilter, setNewFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    taskType: 'novel',
    relatedBusiness: [] as string[],
    sort: 0,
    status: 'show'
  });

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfiguration[]>(fieldConfigurationData);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const modules = [
    { id: 'leaderboard', name: '榜单数据', icon: BarChart3 },
    { id: 'recommendation', name: '首页推荐', icon: Home },
    { id: 'config', name: '字段配置', icon: Settings },
  ];

  const filteredLeaderboardData = useMemo(() => {
    const baseData = leaderboardTab === 'individual' ? individualData : teamData;
    return baseData.filter(item => {
      const matchesSearch = item.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || 
                         (typeFilter === 'individual' && item.type === 'individual') ||
                         (typeFilter === 'project' && item.type === 'project');
      const matchesDimension = dimensionFilter === 'all' || item.dimension === dimensionFilter;
      return matchesSearch && matchesType && matchesDimension;
    });
  }, [leaderboardTab, searchQuery, typeFilter, dimensionFilter]);

  const filteredCommunityData = useMemo(() => {
    return communityData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDimension = dimensionFilter === 'all' || item.dimension === dimensionFilter;
      return matchesSearch && matchesDimension;
    });
  }, [searchQuery, dimensionFilter]);

  const filteredBrandData = useMemo(() => {
    return brandRecommendationData.filter(item => {
      const matchesSearch = item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.projectId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || item.projectType === typeFilter;
      const matchesHot = hotFilter === 'all' || (hotFilter === 'yes' ? item.isHot : !item.isHot);
      const matchesNew = newFilter === 'all' || (newFilter === 'yes' ? item.isNew : !item.isNew);
      const matchesDate = !dateFilter || item.recommendDate === dateFilter;
      return matchesSearch && matchesType && matchesHot && matchesNew && matchesDate;
    });
  }, [searchQuery, typeFilter, hotFilter, newFilter, dateFilter]);

  const filteredDramaData = useMemo(() => {
    return dramaRecommendationData.filter(item => {
      const matchesSearch = item.taskName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.taskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHot = hotFilter === 'all' || (hotFilter === 'yes' ? item.isHot : !item.isHot);
      const matchesNew = newFilter === 'all' || (newFilter === 'yes' ? item.isNew : !item.isNew);
      return matchesSearch && matchesHot && matchesNew;
    });
  }, [searchQuery, hotFilter, newFilter]);

  const filteredCategoryData = useMemo(() => {
    return dramaCategoryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.relatedBusiness.some(biz => biz.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [searchQuery]);

  const filteredConfigData = useMemo(() => {
    return fieldConfigs.filter(item => {
      const matchesSearch = item.menuName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.fieldCnName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.fieldEnName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, fieldConfigs]);

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDimensionFilter('all');
    setHotFilter('all');
    setNewFilter('all');
    setDateFilter('');
    setCurrentPage(1);
  };

  const getFieldRule = (routeKey: string, fieldEnName: string) => {
    const config = fieldConfigs.find(c => c.routeKey === routeKey && c.fieldEnName === fieldEnName);
    return config?.description || '暂无说明';
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-line flex flex-col sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">右豹后台迭代</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id as ModuleType);
                  resetFilters();
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer
                  ${isActive ? 'bg-accent/5 text-accent' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {mod.name}
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-line">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                AD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-[10px] text-gray-500 truncate">renataluoy@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
                {activeModule === 'leaderboard' ? '榜单数据' : activeModule === 'recommendation' ? '首页推荐' : '字段配置'}
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                {activeModule === 'leaderboard' 
                  ? '实时监控各项业务收益与社群表现' 
                  : activeModule === 'recommendation'
                  ? '管理首页品牌与剧作推荐内容'
                  : '配置各业务模块数据表的字段规则与说明'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="搜索关键词..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all w-full shadow-sm"
                />
              </div>

              {activeModule === 'leaderboard' && leaderboardTab !== 'community' && (
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                >
                  <option value="all">所有类型</option>
                  <option value="individual">个人收益</option>
                  <option value="project">单项目收益</option>
                </select>
              )}

              {activeModule === 'recommendation' && recommendationTab === 'brand' && (
                <>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                  >
                    <option value="all">所有类型</option>
                    <option value="tweet">推文</option>
                    <option value="drama">短剧</option>
                    <option value="resource">资源</option>
                    <option value="game">游戏</option>
                  </select>
                  <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                  />
                </>
              )}

              {activeModule === 'leaderboard' && (
                <select 
                  value={dimensionFilter}
                  onChange={(e) => setDimensionFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                >
                  <option value="all">所有维度</option>
                  <option value="7d">近7日</option>
                  <option value="30d">近30日</option>
                </select>
              )}

              {activeModule === 'recommendation' && recommendationTab !== 'category' && (
                <>
                  <select 
                    value={hotFilter}
                    onChange={(e) => setHotFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                  >
                    <option value="all">热门状态</option>
                    <option value="yes">热门</option>
                    <option value="no">非热门</option>
                  </select>
                  <select 
                    value={newFilter}
                    onChange={(e) => setNewFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                  >
                    <option value="all">上新状态</option>
                    <option value="yes">上新</option>
                    <option value="no">非上新</option>
                  </select>
                </>
              )}

              <button 
                onClick={resetFilters}
                className="px-4 py-2 bg-white border border-line rounded-lg hover:bg-gray-50 transition-colors text-gray-500 text-xs font-medium shadow-sm cursor-pointer"
              >
                重置
              </button>

              {activeModule === 'recommendation' && recommendationTab === 'category' && (
                <button 
                  onClick={() => {
                    setEditingCategoryId(null);
                    setFormData({
                      name: '',
                      taskType: 'novel',
                      relatedBusiness: [],
                      sort: 0,
                      status: 'show'
                    });
                    setIsDrawerOpen(true);
                  }}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增分类
                </button>
              )}
            </div>
          </header>

          {/* Tabs */}
          {activeModule !== 'config' && (
            <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl mb-6 w-fit">
              {activeModule === 'leaderboard' ? (
                [
                  { id: 'individual', name: '个人榜单', icon: Trophy },
                  { id: 'team', name: '团队榜单', icon: Users },
                  { id: 'community', name: '品牌社群榜单', icon: LayoutDashboard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = leaderboardTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setLeaderboardTab(tab.id as LeaderboardTab);
                        resetFilters();
                      }}
                      className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </span>
                    </button>
                  );
                })
              ) : (
                [
                  { id: 'brand', name: '品牌推荐', icon: Sparkles },
                  { id: 'drama', name: '剧作推荐', icon: Flame },
                  { id: 'category', name: '剧作分类', icon: Tag },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = recommendationTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setRecommendationTab(tab.id as RecommendationTab);
                        resetFilters();
                      }}
                      className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeModule}-${leaderboardTab}-${recommendationTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-line rounded-2xl shadow-sm"
            >
              {activeModule === 'leaderboard' ? (
                leaderboardTab === 'community' ? (
                  <CommunityTable 
                    data={filteredCommunityData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('community', field)}
                  />
                ) : (
                  <LeaderboardTable 
                    data={filteredLeaderboardData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('leaderboard', field)}
                  />
                )
              ) : activeModule === 'recommendation' ? (
                recommendationTab === 'brand' ? (
                  <BrandRecommendationTable 
                    data={filteredBrandData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('brand', field)}
                  />
                ) : recommendationTab === 'drama' ? (
                  <DramaRecommendationTable 
                    data={filteredDramaData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('drama', field)}
                  />
                ) : (
                  <DramaCategoryTable 
                    data={filteredCategoryData} 
                    currentPage={currentPage} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    getRule={(field) => getFieldRule('category', field)}
                    onEdit={(category) => {
                      setEditingCategoryId(category.id);
                      setFormData({
                        name: category.name,
                        taskType: category.taskType,
                        relatedBusiness: category.relatedBusiness,
                        sort: category.sort,
                        status: category.status
                      });
                      setIsDrawerOpen(true);
                    }}
                  />
                )
              ) : (
                <FieldConfigTable 
                  data={filteredConfigData}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  editingId={editingFieldId}
                  editValue={editDescription}
                  onEditStart={(id, val) => {
                    setEditingFieldId(id);
                    setEditDescription(val);
                  }}
                  onEditChange={setEditDescription}
                  onEditSave={(id) => {
                    setFieldConfigs(prev => prev.map(f => f.id === id ? { ...f, description: editDescription } : f));
                    setEditingFieldId(null);
                  }}
                  onEditCancel={() => setEditingFieldId(null)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-line flex items-center justify-between">
                <h2 className="text-lg font-bold">{editingCategoryId ? '编辑剧作分类' : '新增剧作分类'}</h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    分类名称
                    <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="请输入分类名称"
                    className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">推荐任务类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'novel', name: '小说' },
                      { id: 'drama', name: '短剧' },
                      { id: 'comic', name: '漫剧' },
                      { id: 'game', name: '游戏' }
                    ].map(type => (
                      <label key={type.id} className="flex items-center gap-2 p-3 border border-line rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input 
                          type="radio" 
                          name="taskType" 
                          className="accent-accent"
                          checked={formData.taskType === type.id}
                          onChange={() => setFormData({...formData, taskType: type.id as any})}
                        />
                        <span className="text-sm">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">关联业务 (多选)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['融合', '版权', '商单', '哔哩哔哩', '聚星', '原生', '0粉快手', '海外文娱', 'TTO'].map(biz => (
                      <label key={biz} className="flex items-center gap-2 p-2 border border-line rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input 
                          type="checkbox" 
                          className="accent-accent"
                          checked={formData.relatedBusiness.includes(biz)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, relatedBusiness: [...formData.relatedBusiness, biz]});
                            } else {
                              setFormData({...formData, relatedBusiness: formData.relatedBusiness.filter(b => b !== biz)});
                            }
                          }}
                        />
                        <span className="text-sm">{biz}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">排序</label>
                  <input 
                    type="number" 
                    placeholder="数值越大越靠前"
                    className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                    value={formData.sort}
                    onChange={(e) => setFormData({...formData, sort: parseInt(e.target.value) || 0})}
                  />
                  <p className="text-[10px] text-gray-400">数值越大越靠前</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">状态</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        className="accent-accent"
                        checked={formData.status === 'show'}
                        onChange={() => setFormData({...formData, status: 'show'})}
                      />
                      <span className="text-sm">显示</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        className="accent-accent"
                        checked={formData.status === 'hide'}
                        onChange={() => setFormData({...formData, status: 'hide'})}
                      />
                      <span className="text-sm">隐藏</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">更新时间</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full px-4 py-2 bg-gray-50 border border-line rounded-lg text-gray-400 text-sm"
                    value={new Date().toLocaleString()}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-line flex gap-3">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 px-4 py-2 border border-line rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (!formData.name.trim()) {
                      alert('请输入分类名称');
                      return;
                    }
                    // In a real app, we would save the data here
                    setIsDrawerOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TableHeader({ label, rule, align = 'left' }: { label: string, rule: string, align?: 'left' | 'right' }) {
  return (
    <th className={`px-6 py-4 group relative ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center gap-1.5 font-serif italic text-[11px] uppercase tracking-wider text-gray-400 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        <div className="relative group/tooltip">
          <HelpCircle className="w-3 h-3 cursor-help opacity-40 group-hover/tooltip:opacity-100 transition-opacity" />
          <div className={`absolute top-full mt-2 px-3 py-2 bg-gray-900 text-white text-[10px] normal-case font-sans rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}>
            <div className="font-bold mb-1 text-blue-400 border-b border-white/10 pb-1">字段规则</div>
            {rule}
            <div className={`absolute bottom-full border-8 border-transparent border-b-gray-900 ${align === 'right' ? 'right-4' : 'left-4'}`} />
          </div>
        </div>
      </div>
      <div className={`mt-1 text-[9px] text-gray-300 font-sans normal-case font-normal truncate max-w-[120px] ${align === 'right' ? 'ml-auto' : ''}`}>
        {rule}
      </div>
    </th>
  );
}

function LeaderboardTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: LeaderboardEntry[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="用户ID" rule={getRule('userId')} />
            <TableHeader label="用户昵称" rule={getRule('nickname')} />
            <TableHeader label="类型" rule={getRule('type')} />
            <TableHeader label="累计收益" rule={getRule('totalEarnings')} align="right" />
            <TableHeader label="统计纬度" rule={getRule('dimension')} />
            <TableHeader label="收益最高项目" rule={getRule('topProject')} />
            <TableHeader label="项目收益" rule={getRule('projectEarnings')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-mono text-sm text-gray-500">{item.id}</td>
              <td className="px-6 py-4 font-bold text-sm text-ink">{item.nickname}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${
                  item.type === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {item.type === 'individual' ? '个人收益' : '单项目收益'}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-sm text-right font-bold text-accent">
                ¥{item.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {item.dimension === '7d' ? '近7日' : '近30日'}
                </div>
              </td>
              <td className="px-6 py-4">
                {item.type === 'individual' ? (
                  <span className="text-gray-300">-</span>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-gray-400">{item.topProjectId}</span>
                    <span className="text-sm font-medium text-gray-700">{item.topProjectName}</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 font-mono text-sm text-right text-gray-600">
                {item.type === 'individual' ? (
                  <span className="text-gray-300">-</span>
                ) : (
                  `¥${item.projectEarnings?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function CommunityTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: CommunityEntry[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="社群名称" rule={getRule('name')} />
            <TableHeader label="社群标签" rule={getRule('tags')} />
            <TableHeader label="累计收益" rule={getRule('totalEarnings')} align="right" />
            <TableHeader label="统计纬度" rule={getRule('dimension')} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.avatar} 
                    alt={item.name} 
                    className="w-10 h-10 rounded-full border border-line object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-bold text-sm text-ink">{item.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-sm text-right font-bold text-accent">
                ¥{item.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {item.dimension === '7d' ? '近7日' : '近30日'}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function BrandRecommendationTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: BrandRecommendation[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="项目ID" rule={getRule('projectId')} />
            <TableHeader label="项目名称" rule={getRule('projectName')} />
            <TableHeader label="项目类型" rule={getRule('projectType')} />
            <TableHeader label="项目总收益" rule={getRule('totalEarnings')} align="right" />
            <TableHeader label="昨日收益" rule={getRule('yesterdayEarnings')} align="right" />
            <TableHeader label="昨日题词数量" rule={getRule('yesterdayApprovedKeywords')} align="right" />
            <TableHeader label="热门/上新" rule="项目推荐状态标识" />
            <TableHeader label="加权分值" rule={getRule('weightScore')} align="right" />
            <TableHeader label="推荐日期" rule={getRule('recommendDate')} />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.projectId} className="group hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-mono text-sm text-gray-500">{item.projectId}</td>
              <td className="px-6 py-4 font-bold text-sm text-ink">{item.projectName}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                  {item.projectType === 'tweet' ? '推文' : item.projectType === 'drama' ? '短剧' : item.projectType === 'resource' ? '资源' : '游戏'}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-sm text-right text-accent font-bold">¥{item.totalEarnings.toLocaleString()}</td>
              <td className="px-6 py-4 font-mono text-sm text-right text-green-600 font-medium">¥{item.yesterdayEarnings.toLocaleString()}</td>
              <td className="px-6 py-4 font-mono text-sm text-right text-gray-600">{item.yesterdayApprovedKeywords}</td>
              <td className="px-6 py-4">
                <div className="flex gap-1">
                  {item.isHot && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold">HOT</span>}
                  {item.isNew && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-bold">NEW</span>}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-mono text-sm font-bold text-gray-700">{item.weightScore}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.recommendDate}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function DramaRecommendationTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule }: { 
  data: DramaRecommendation[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string
}) {
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="所属分类" rule={getRule('category')} />
            <TableHeader label="任务ID" rule={getRule('taskId')} />
            <TableHeader label="任务名称" rule={getRule('taskName')} />
            <TableHeader label="任务来源" rule={getRule('taskSource')} />
            <TableHeader label="项目名称" rule={getRule('projectName')} />
            <TableHeader label="今日预估收益" rule={getRule('todayEstimatedEarnings')} align="right" />
            <TableHeader label="热门/上新" rule="剧作推荐状态标识" />
            <TableHeader label="加权分值" rule={getRule('weightScore')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.taskId} className="group hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{item.category}</span>
              </td>
              <td className="px-6 py-4 font-mono text-sm text-gray-500">{item.taskId}</td>
              <td className="px-6 py-4 font-bold text-sm text-ink">{item.taskName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{item.taskSource}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{item.projectName}</td>
              <td className="px-6 py-4 font-mono text-sm text-right text-accent font-bold">¥{item.todayEstimatedEarnings.toLocaleString()}</td>
              <td className="px-6 py-4">
                <div className="flex gap-1">
                  {item.isHot && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold">HOT</span>}
                  {item.isNew && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] font-bold">NEW</span>}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-mono text-sm font-bold text-gray-700">{item.weightScore}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">{item.updateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function DramaCategoryTable({ data, currentPage, pageSize, onPageChange, onPageSizeChange, getRule, onEdit }: { 
  data: DramaCategory[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  getRule: (field: string) => string,
  onEdit: (category: DramaCategory) => void
}) {
  if (data.length === 0) return <EmptyState />;

  const taskTypeMap: Record<string, string> = {
    novel: '小说',
    drama: '短剧',
    comic: '漫剧',
    game: '游戏'
  };

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <TableHeader label="分类名称" rule={getRule('name')} />
            <TableHeader label="任务类型" rule={getRule('taskType')} />
            <TableHeader label="关联业务" rule={getRule('relatedBusiness')} />
            <TableHeader label="状态" rule={getRule('status')} />
            <TableHeader label="分类排序" rule={getRule('sort')} align="right" />
            <TableHeader label="更新时间" rule={getRule('updateTime')} />
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-bold text-sm text-ink">{item.name}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                  {taskTypeMap[item.taskType] || item.taskType}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {item.relatedBusiness.map(biz => (
                    <span key={biz} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-medium">
                      {biz}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                  item.status === 'show' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.status === 'show' ? '显示' : '隐藏'}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-mono text-sm text-gray-600 font-medium">{item.sort}</td>
              <td className="px-6 py-4 text-sm text-gray-400">{item.updateTime}</td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-accent hover:bg-accent/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function FieldConfigTable({ 
  data, 
  currentPage, 
  pageSize, 
  onPageChange,
  onPageSizeChange,
  editingId,
  editValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel
}: { 
  data: FieldConfiguration[], 
  currentPage: number, 
  pageSize: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void,
  editingId: string | null,
  editValue: string,
  onEditStart: (id: string, val: string) => void,
  onEditChange: (val: string) => void,
  onEditSave: (id: string) => void,
  onEditCancel: () => void
}) {
  if (data.length === 0) return <EmptyState />;
  
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-gray-50/50">
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic">菜单名称</th>
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic">路由键</th>
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic">字段中文名</th>
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic">字段英文名</th>
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic">字段说明</th>
            <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-gray-400 font-serif italic text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {paginatedData.map((item) => (
            <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-bold text-ink">{item.menuName}</td>
              <td className="px-6 py-4 font-mono text-sm text-gray-500">{item.routeKey}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.fieldCnName}</td>
              <td className="px-6 py-4 font-mono text-sm text-gray-400">{item.fieldEnName}</td>
              <td className="px-6 py-4">
                {editingId === item.id ? (
                  <input 
                    type="text" 
                    className="w-full px-3 py-1.5 border border-accent rounded text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm text-gray-600">{item.description}</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {editingId === item.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEditSave(item.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={onEditCancel}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => onEditStart(item.id, item.description)}
                    className="p-1.5 text-accent hover:bg-accent/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination 
        total={data.length} 
        pageSize={pageSize} 
        currentPage={currentPage} 
        onPageChange={onPageChange} 
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function Pagination({ total, pageSize, currentPage, onPageChange, onPageSizeChange }: { 
  total: number, 
  pageSize: number, 
  currentPage: number, 
  onPageChange: (page: number) => void,
  onPageSizeChange: (size: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="px-6 py-4 border-t border-line flex items-center justify-between bg-gray-50/30">
      <div className="flex items-center gap-4">
        <p className="text-xs text-gray-500">
          显示 {total === 0 ? 0 : (currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">每页显示</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs bg-white border border-line rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer"
          >
            {[15, 50, 100, 500, 1000].map(size => (
              <option key={size} value={size}>{size} 条</option>
            ))}
          </select>
        </div>
      </div>
      {totalPages >= 1 && (
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded border border-line bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`
                w-8 h-8 rounded text-xs font-medium transition-all
                ${currentPage === i + 1 ? 'bg-accent text-white shadow-sm' : 'bg-white border border-line text-gray-500 hover:bg-gray-50'}
              `}
            >
              {i + 1}
            </button>
          ))}
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded border border-line bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-20 flex flex-col items-center justify-center text-gray-400">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 opacity-20" />
      </div>
      <p className="text-sm font-medium">暂无匹配数据</p>
      <p className="text-xs mt-1">请尝试调整搜索关键词或筛选条件</p>
    </div>
  );
}
