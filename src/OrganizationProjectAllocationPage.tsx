import { useState } from 'react';
import { MenuRuleDescriptionModal } from './MenuRuleDescriptionModal';
import { OrganizationModulePlaceholderPage } from './OrganizationModulePlaceholderPage';

const RULE_ROUTE_KEYS = ['organization-project-allocation'] as const;

export function OrganizationProjectAllocationPage() {
  const [ruleOpen, setRuleOpen] = useState(false);

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-xl font-bold text-ink">项目分配</h2>
            <button
              type="button"
              onClick={() => setRuleOpen(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              查看规则说明
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">组织内项目与导师/学员的分配（占位说明见下方）</p>
        </div>
      </div>
      <OrganizationModulePlaceholderPage variant="project-allocation" />
      <MenuRuleDescriptionModal
        open={ruleOpen}
        navTitle="项目分配"
        routeKeys={RULE_ROUTE_KEYS}
        onClose={() => setRuleOpen(false)}
      />
    </div>
  );
}
