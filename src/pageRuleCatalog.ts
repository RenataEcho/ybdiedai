/** 菜单规则说明 — 代码内置目录（优先级最低层） */

/**
 * 与侧栏「一级菜单」业务迭代区一一对应（不含「系统配置」本身）。
 * 新增一级菜单时在此数组追加 id，并在下方 `PRODUCT_LINE_TAB_LABEL` 补中文名；
 * 「字段配置」「规则说明」内的子 Tab 会按该顺序自动生成。
 */
export const PRODUCT_LINE_NAV_ORDER = ['youbao', 'youboom', 'mentor'] as const;
export type ProductLine = (typeof PRODUCT_LINE_NAV_ORDER)[number];

export const PRODUCT_LINE_TAB_LABEL: Record<ProductLine, string> = {
  youbao: '右豹',
  youboom: 'youboom',
  mentor: '导师迭代',
};

export type PageRuleParagraph = { subheading: string; body: string };

export type PageRuleCatalogEntry = {
  /** 业务线：与侧栏「右豹迭代 / youboom迭代」对应 */
  productLine: ProductLine;
  routeKey: string;
  menuTitle: string;
  /** 表格「内容摘要」一行展示 */
  summary: string;
  paragraphs: PageRuleParagraph[];
};

export const PAGE_RULE_CATALOG: PageRuleCatalogEntry[] = [
  {
    productLine: 'youbao',
    routeKey: 'leaderboard',
    menuTitle: '榜单数据',
    summary: '维护个人/团队/品牌社群榜单字段与展示规则；收益与维度口径以后台配置为准。',
    paragraphs: [
      {
        subheading: '数据口径',
        body: '榜单按统计维度（如 7 天/30 天）汇总展示；切换 Tab 时筛选条件会重置。导出或对外披露前请核对业务口径。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'community',
    menuTitle: '品牌社群榜单',
    summary: '社群维度榜单只读展示为主；标签与头像变更需走运营流程。',
    paragraphs: [{ subheading: '展示', body: '社群名称、标签、累计收益等字段与前台一致；不支持在后台直接改历史收益明细。' }],
  },
  {
    productLine: 'youbao',
    routeKey: 'brand',
    menuTitle: '品牌推荐',
    summary: '首页品牌推荐位：热门/上新/加权分等运营字段需谨慎调整，避免与算法推荐冲突。',
    paragraphs: [
      {
        subheading: '运营',
        body: '项目 ID、名称、类型为关键索引；推荐日期与权重分影响排序，修改后建议观察前台缓存刷新周期。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'drama',
    menuTitle: '剧作推荐',
    summary: '剧作任务与项目关联展示；今日预估收益为估算值，不作为结算依据。',
    paragraphs: [{ subheading: '合规', body: '任务来源、平台字段需与实际上线渠道一致，避免虚假宣传表述。' }],
  },
  {
    productLine: 'youbao',
    routeKey: 'category',
    menuTitle: '剧作分类',
    summary: '分类与任务类型、关联业务绑定；隐藏分类不展示在前台列表。',
    paragraphs: [{ subheading: '编辑', body: '支持新增/编辑分类；排序数值越大越靠前；关联业务多选需与运营清单对齐。' }],
  },
  {
    productLine: 'youbao',
    routeKey: 'academy-category',
    menuTitle: '分类管理',
    summary: '商学院分类：金刚区为「是」时需配置 icon；删除分类前需清空下属内容。',
    paragraphs: [{ subheading: '约束', body: '分类名称必填；状态为隐藏时前台入口不可见但历史内容链接需单独评估。' }],
  },
  {
    productLine: 'youbao',
    routeKey: 'academy-content',
    menuTitle: '内容配置',
    summary: '图文/视频内容归属分类与品牌项目；发布前检查封面与正文合规。',
    paragraphs: [
      {
        subheading: '必填',
        body: '标题、封面、内容类型、所属分类为常见必填项；视频内容为可播放地址时需验证链接有效期。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'AuditLogs',
    menuTitle: '操作日志',
    summary: '合规：只读、不可删除或修改（NFR10）。筛选维度：业务表、操作类型、时间范围等。',
    paragraphs: [
      {
        subheading: '合规',
        body: '只读、不可删除或修改（NFR10）。筛选维度：业务表、操作类型、时间范围等。',
      },
    ],
  },

  {
    productLine: 'youboom',
    routeKey: 'youboom-board',
    menuTitle: '迭代看板',
    summary: 'youboom 迭代需求与版本进展的聚合视图；状态与负责人字段需与项目管理工具保持一致。',
    paragraphs: [
      {
        subheading: '协作',
        body: '发布版本、负责人、优先级为跨团队对齐关键字段；变更后建议同步周知相关接口人。',
      },
    ],
  },
  {
    productLine: 'youboom',
    routeKey: 'youboom-channel',
    menuTitle: '发布渠道',
    summary: '管理 App / H5 / 小程序等渠道的编码与灰度策略；灰度比例与监控大盘联动。',
    paragraphs: [{ subheading: '放量', body: '灰度比例调整需配合回滚预案；渠道编码与网关路由配置一一对应，勿随意改名。' }],
  },
  {
    productLine: 'youboom',
    routeKey: 'youboom-experiment',
    menuTitle: '实验配置',
    summary: 'AB 实验与功能开关的键、分组与生效范围；下线实验需清理残留配置。',
    paragraphs: [{ subheading: '规范', body: '实验键在配置中心全局唯一；分组命名需可读，避免与历史实验混淆。' }],
  },
  {
    productLine: 'youboom',
    routeKey: 'youboom-metrics',
    menuTitle: '指标看板',
    summary: '指标编码与聚合方式需与数仓口径文档一致，用于订阅与告警。',
    paragraphs: [{ subheading: '口径', body: '变更聚合方式会影响历史对比，重大调整需发变更公告并保留迁移说明。' }],
  },

  {
    productLine: 'mentor',
    routeKey: 'sect-management',
    menuTitle: '门派管理',
    summary: '维护导师门派档案、介绍子页与运营统计；与前台门派详情展示口径保持一致。',
    paragraphs: [
      {
        subheading: '内容',
        body: '社群介绍、专精项目、战绩榜、社群案例等子模块为富文本或视频链接；发布前核对可见性与素材版权。',
      },
    ],
  },
  {
    productLine: 'mentor',
    routeKey: 'customer-service-management',
    menuTitle: '客服管理',
    summary: '维护客服名称、类型、飞书手机号、企微二维码与信息录入专属链接；供用户主档归属选择。',
    paragraphs: [
      {
        subheading: '录入链接',
        body: '保存后系统生成含 agentId 的专属录入 URL；复制链接用于对外投放或绑定物料。',
      },
      {
        subheading: '状态',
        body: '禁用后不再出现在归属选择中；已关联用户数的统计为演示字段，正式环境以后台接口为准。',
      },
    ],
  },
  {
    productLine: 'mentor',
    routeKey: 'mentor-management-org',
    menuTitle: '导师管理（组织）',
    summary: '导师列表与导师类型：当前为占位菜单，数据结构与交互将复用门派管理模块的档案与运营统计模式。',
    paragraphs: [
      {
        subheading: '规划',
        body: '正式版在此拆分「导师列表」与「导师类型」两个 Tab；字段、抽屉与富文本能力与门派管理对齐。',
      },
    ],
  },
  {
    productLine: 'mentor',
    routeKey: 'organization-project-allocation',
    menuTitle: '项目分配',
    summary: '组织内项目与导师/学员的分配关系；当前为占位页。',
    paragraphs: [
      {
        subheading: '规划',
        body: '后续将提供分配矩阵、操作日志与权限控制；列表形态可参考门派管理的关联与统计列。',
      },
    ],
  },
  {
    productLine: 'mentor',
    routeKey: 'audit-entry-workbench',
    menuTitle: '录入审核工作台',
    summary: '用户主档来自后台导入与扫码录入；单据状态、SLA 与超时高亮与入群审核流程对齐（演示数据）。',
    paragraphs: [
      {
        subheading: '操作',
        body: '待审核支持详情、通过、拒绝；处理中仅可查看详情。筛选支持时间范围、所属客服、右豹编码/ID、录入来源。',
      },
    ],
  },
  {
    productLine: 'mentor',
    routeKey: 'audit-message-notification',
    menuTitle: '消息通知记录',
    summary: '按审核类型（入群/录入）、场景与渠道记录推送结果；待发送与失败支持重推（演示）。',
    paragraphs: [
      {
        subheading: '推送',
        body: '推送状态包括待发送、已推送、推送失败；失败原因用于排查 OpenID 绑定与网关超时等问题。',
      },
    ],
  },

  {
    productLine: 'youbao',
    routeKey: 'iteration-record',
    menuTitle: '迭代记录',
    summary: '按业务线记录父需求、必填优先级、可选版本号与子需求、负责人、详细规则与日期范围；支持本机持久化与检索。',
    paragraphs: [
      {
        subheading: '协作',
        body: '父需求与优先级必填；版本号选填。子需求可选并支持逐条配置开发人员（来自系统配置-产研人员）、起止日期与子需求状态；列表中多子需求按序号分行对齐。父需求列可展开/收起整条记录（含多行子需求）。无子需求时列表状态为整体状态并与发布时间联动。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'product-staff',
    menuTitle: '产研人员管理',
    summary: '维护产研人员姓名与职称，作为迭代记录中开发人员多选的数据源；本机持久化。',
    paragraphs: [
      {
        subheading: '字段',
        body: '名字、职称（前端开发、后端开发、测试、产品）、创建时间；删除前请确认无迭代记录仍引用该人员 id。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'project-management',
    menuTitle: '项目管理',
    summary: '维护项目档案、分类、展示开关与会员策略；列表字段与抽屉表单一一对应。',
    paragraphs: [
      {
        subheading: '编辑',
        body: '保存前核对项目 ID、前后台标题与上线状态；会员可见档位变更可能影响前台露出，建议小流量验证。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'project-customization',
    menuTitle: '项目定制',
    summary: '对特定用户配置差异化结算比例；定制结算单价 = 普通单价 × (1 + 定制比例%)。',
    paragraphs: [
      {
        subheading: '使用说明',
        body: '定制比例仅对指定用户生效，不影响其他用户的结算逻辑。\n新增/编辑定制后需刷新缓存方可生效，建议操作后观察次日收益数据。',
      },
    ],
  },
  {
    productLine: 'youboom',
    routeKey: 'reward-management',
    menuTitle: '奖励管理',
    summary: 'youboom 奖励导入、审核、打款与通知流程；导入批次与审核状态需与财务口径一致。',
    paragraphs: [
      {
        subheading: '合规',
        body: '打款前核对用户身份与金额；导出与批量操作需保留操作痕迹，避免重复打款。',
      },
    ],
  },
  {
    productLine: 'youboom',
    routeKey: 'youboom-team',
    menuTitle: '团队数据',
    summary: '展示 youboom 各团队的成员数、收益与奖励汇总；支持按团长ID搜索与多列排序。',
    paragraphs: [
      {
        subheading: '数据口径',
        body: '团队收益与团队奖励均来自数仓定时同步，更新时间以列表中「更新时间」字段为准；数据为只读展示，不支持在后台直接修改。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'field-config',
    menuTitle: '字段配置',
    summary: '按业务线维护各数据表字段的中文名与说明；优先级：本机与仓库 JSON 覆盖 > 代码内置默认。',
    paragraphs: [
      {
        subheading: '同步',
        body: '本地开发运行 npm run dev 时，字段说明保存会尝试写入 src/field-configuration-description-overrides.json，便于直接 git 提交。',
      },
    ],
  },
  {
    productLine: 'youbao',
    routeKey: 'rule-description',
    menuTitle: '规则说明',
    summary: '维护各菜单规则说明段落；支持本机覆盖与仓库工作区 JSON 合并进团队分支。',
    paragraphs: [
      {
        subheading: '同步',
        body: '本地开发运行 npm run dev 时，保存规则会尝试写入 src/page-rule-description-overrides.json，可与 src/mock/pageRuleOverridesCommitted.ts 中的团队默认合并后提交。',
      },
    ],
  },
];
