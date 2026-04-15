/**
 * 侧栏二级菜单 → 规则说明（PAGE_RULE_CATALOG 的 routeKey）映射。
 * 首页推荐 / 学院管理等对应多个路由键时，弹窗内按顺序展示多段说明。
 */
export const MODULE_RULE_ROUTE_KEYS = {
  iterationRecord: ['iteration-record'],
  leaderboard: ['leaderboard'],
  recommendation: ['brand', 'drama', 'category'],
  academy: ['academy-category', 'academy-content'],
  projectManagement: ['project-management'],
  sectManagement: ['sect-management'],
  customerServiceManagement: ['customer-service-management'],
  organizationMentorManagement: ['mentor-management-org'],
  organizationProjectAllocation: ['organization-project-allocation'],
  auditEntryWorkbench: ['audit-entry-workbench'],
  auditMessageNotification: ['audit-message-notification'],
  rewardManagement: ['reward-management'],
  youboomTeam: ['youboom-team'],
  config: ['field-config'],
  ruleDescription: ['rule-description'],
  productStaff: ['product-staff'],
} as const;

export type ModuleTypeWithRules = keyof typeof MODULE_RULE_ROUTE_KEYS;
