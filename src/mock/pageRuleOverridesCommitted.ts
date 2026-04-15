import type { PageRuleParagraph } from '../pageRuleCatalog';

/** 提交到仓库的默认覆盖（优先级：本机 localStorage > src/page-rule-description-overrides.json > 本文件 > pageRuleCatalog） */
export type PageRuleCommittedOverride = {
  menuTitle?: string;
  paragraphs?: PageRuleParagraph[];
};

export const PAGE_RULE_COMMITTED_OVERRIDES: Record<string, PageRuleCommittedOverride> = {
  // 示例：可按路由键合并团队共享的规则
  // AuditLogs: { menuTitle: '操作日志', paragraphs: [{ subheading: '合规', body: '...' }] },
};
