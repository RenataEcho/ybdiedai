import { useState } from 'react';
import { motion } from 'motion/react';
import { MenuRuleDescriptionModal } from './MenuRuleDescriptionModal';
import { OrganizationModulePlaceholderPage } from './OrganizationModulePlaceholderPage';

type OrgMentorTab = 'list' | 'type';

const RULE_ROUTE_KEYS = ['mentor-management-org'] as const;

export function OrganizationMentorManagementPage() {
  const [tab, setTab] = useState<OrgMentorTab>('list');
  const [ruleOpen, setRuleOpen] = useState(false);

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-xl font-bold text-ink">导师管理</h2>
            <button
              type="button"
              onClick={() => setRuleOpen(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              查看规则说明
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">导师列表与类型配置（当前为占位页）</p>
        </div>
      </div>
      <MenuRuleDescriptionModal
        open={ruleOpen}
        navTitle="导师管理"
        routeKeys={RULE_ROUTE_KEYS}
        onClose={() => setRuleOpen(false)}
      />
      <div className="mb-6 flex w-fit gap-1 rounded-xl bg-gray-200/50 p-1">
        {(
          [
            { id: 'list' as const, name: '导师列表' },
            { id: 'type' as const, name: '导师类型' },
          ] as const
        ).map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="orgMentorTab"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{t.name}</span>
            </button>
          );
        })}
      </div>
      {tab === 'list' ? (
        <OrganizationModulePlaceholderPage variant="mentor-list" />
      ) : (
        <OrganizationModulePlaceholderPage variant="mentor-type" />
      )}
    </div>
  );
}
