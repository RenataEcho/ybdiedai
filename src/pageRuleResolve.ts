import {
  PAGE_RULE_CATALOG,
  type PageRuleCatalogEntry,
  type PageRuleParagraph,
} from './pageRuleCatalog';
import { PAGE_RULE_COMMITTED_OVERRIDES, type PageRuleCommittedOverride } from './mock/pageRuleOverridesCommitted';
import { PAGE_RULE_OVERRIDES_STORAGE_KEY, readLocalJson } from './localWorkspacePersistence';
import workspacePageRuleOverridesJson from './page-rule-description-overrides.json';

export type LocalOverrides = Record<string, { menuTitle?: string; paragraphs?: PageRuleParagraph[] }>;

export type ResolvedPageRule = PageRuleCatalogEntry & {
  effectiveMenuTitle: string;
  effectiveParagraphs: PageRuleParagraph[];
  summaryDisplay: string;
  source: 'local' | 'repo' | 'builtin';
};

const workspacePageRuleOverrides = workspacePageRuleOverridesJson as Record<string, PageRuleCommittedOverride>;

function mergeRepoLayer(routeKey: string): PageRuleCommittedOverride | undefined {
  const c = PAGE_RULE_COMMITTED_OVERRIDES[routeKey];
  const w = workspacePageRuleOverrides[routeKey];
  if (!c && !w) return undefined;
  const paragraphs =
    w?.paragraphs && w.paragraphs.length > 0
      ? w.paragraphs
      : c?.paragraphs && c.paragraphs.length > 0
        ? c.paragraphs
        : undefined;
  const menuTitle =
    w?.menuTitle != null && w.menuTitle.trim() !== ''
      ? w.menuTitle.trim()
      : c?.menuTitle != null && c.menuTitle.trim() !== ''
        ? c.menuTitle.trim()
        : undefined;
  if (!paragraphs && !menuTitle) return undefined;
  return { menuTitle, paragraphs };
}

export function loadPageRuleLocalOverrides(): LocalOverrides {
  const parsed = readLocalJson<unknown>(PAGE_RULE_OVERRIDES_STORAGE_KEY);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return parsed as LocalOverrides;
}

export function resolvePageRuleRow(catalog: PageRuleCatalogEntry, local: LocalOverrides): ResolvedPageRule {
  const routeKey = catalog.routeKey;
  const loc = local[routeKey];

  const hasLocal =
    !!loc &&
    ((loc.menuTitle != null && loc.menuTitle !== '') ||
      (Array.isArray(loc.paragraphs) && loc.paragraphs.length > 0));

  if (hasLocal) {
    const effectiveMenuTitle = loc!.menuTitle?.trim() || catalog.menuTitle;
    const effectiveParagraphs =
      loc!.paragraphs && loc!.paragraphs.length > 0 ? loc!.paragraphs : catalog.paragraphs;
    const summaryDisplay =
      effectiveParagraphs.map((p) => `${p.subheading}：${p.body}`.replace(/\s+/g, ' ')).join('；') ||
      catalog.summary;
    return {
      ...catalog,
      effectiveMenuTitle,
      effectiveParagraphs,
      summaryDisplay: summaryDisplay.slice(0, 200) + (summaryDisplay.length > 200 ? '…' : ''),
      source: 'local',
    };
  }

  const merged = mergeRepoLayer(routeKey);
  const hasRepo =
    !!merged &&
    ((merged.menuTitle != null && merged.menuTitle !== '') ||
      (Array.isArray(merged.paragraphs) && merged.paragraphs.length > 0));

  if (hasRepo) {
    const effectiveMenuTitle = merged!.menuTitle?.trim() || catalog.menuTitle;
    const effectiveParagraphs =
      merged!.paragraphs && merged!.paragraphs!.length > 0 ? merged!.paragraphs! : catalog.paragraphs;
    const summaryDisplay =
      effectiveParagraphs.map((p) => `${p.subheading}：${p.body}`.replace(/\s+/g, ' ')).join('；') ||
      catalog.summary;
    return {
      ...catalog,
      effectiveMenuTitle,
      effectiveParagraphs,
      summaryDisplay: summaryDisplay.slice(0, 200) + (summaryDisplay.length > 200 ? '…' : ''),
      source: 'repo',
    };
  }

  return {
    ...catalog,
    effectiveMenuTitle: catalog.menuTitle,
    effectiveParagraphs: catalog.paragraphs,
    summaryDisplay: catalog.summary,
    source: 'builtin',
  };
}

export function getCatalogEntryOrPlaceholder(routeKey: string): PageRuleCatalogEntry {
  const found = PAGE_RULE_CATALOG.find((c) => c.routeKey === routeKey);
  if (found) return found;
  return {
    productLine: 'youbao',
    routeKey,
    menuTitle: routeKey,
    summary: '尚未在代码目录中配置该路由的规则条目。',
    paragraphs: [
      {
        subheading: '提示',
        body: '请进入「系统配置 → 规则说明」，在对应业务线下补充或从本机覆盖同步到仓库。',
      },
    ],
  };
}

export function resolveRulesForRouteKeys(routeKeys: readonly string[], local: LocalOverrides): ResolvedPageRule[] {
  return routeKeys.map((k) => resolvePageRuleRow(getCatalogEntryOrPlaceholder(k), local));
}

/** 开发服务器写入 src/page-rule-description-overrides.json，便于直接提交 Git */
export function persistPageRuleOverridesToWorkspaceFile(overrides: LocalOverrides): void {
  void fetch('/__dev/api/save-page-rule-overrides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  })
    .then((r) => {
      if (!r.ok) {
        console.warn(
          '[规则说明] 未写入仓库文件（需本地运行 npm run dev）。已保留 localStorage。'
        );
      }
    })
    .catch(() => {
      console.warn(
        '[规则说明] 无法连接开发服务器写入 src/page-rule-description-overrides.json，已仅写入 localStorage。'
      );
    });
}
