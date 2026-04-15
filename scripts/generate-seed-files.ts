#!/usr/bin/env tsx
/**
 * 将各模型的 TS 种子数据序列化为 JSON 种子文件。
 * 使用方式：npx tsx scripts/generate-seed-files.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDir = path.resolve(__dirname, '../src/mock');

if (!fs.existsSync(mockDir)) fs.mkdirSync(mockDir, { recursive: true });

function writeJson(name: string, data: unknown) {
  const outPath = path.join(mockDir, name);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`写入 ${outPath}`);
}

const { iterationRecordSeedData } = await import('../src/iterationRecordModel.js');
writeJson('iteration-records-seed.json', iterationRecordSeedData);

const { productStaffSeedData } = await import('../src/productStaffModel.js');
writeJson('product-staff-seed.json', productStaffSeedData);

const { sectGuildSeedData } = await import('../src/sectGuildModel.js');
writeJson('sect-guild-seed.json', sectGuildSeedData);

const { rewardManagementSeedData } = await import('../src/rewardManagementModel.js');
writeJson('reward-management-seed.json', rewardManagementSeedData);

const { projectManagementSeedData } = await import('../src/projectManagementModel.js');
writeJson('project-management-seed.json', projectManagementSeedData);

const { customerServiceSeedData } = await import('../src/customerServiceModel.js');
writeJson('customer-service-seed.json', customerServiceSeedData());

const { youboomTeamSeedData } = await import('../src/youboomTeamModel.js');
writeJson('youboom-team-seed.json', youboomTeamSeedData);

const { academyCategoryInitialData, academyContentInitialData } = await import('../src/mockData.js');
writeJson('academy-categories-seed.json', academyCategoryInitialData);
writeJson('academy-contents-seed.json', academyContentInitialData);

console.log('所有种子文件生成完毕');
