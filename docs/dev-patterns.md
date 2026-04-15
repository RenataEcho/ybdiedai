# 开发通用模式

## 目录

- [本机数据持久化到仓库](#本机数据持久化到仓库)

---

## 本机数据持久化到仓库

### 背景

无后端接口、无数据库时，需要在本机浏览器里做增删改，并将结果提交到 git，让其他人拉代码后看到相同的初始数据。

### 数据流

```
运行时修改
    │
    ▼
localStorage（立即写入，刷新不丢）
    │
    ▼  点击「保存到仓库」按钮
src/mock/*.json（JSON 种子文件，可 git commit）
    │
    ▼  冷启动加载优先级
localStorage > JSON 种子 > TS 硬编码兜底
```

### 已接入的数据类型

| 数据类型 | localStorage key | JSON 种子文件 |
|---|---|---|
| 迭代记录 | `ybdiedai-iteration-records-v1` | `src/mock/iteration-records-seed.json` |
| 产研人员 | `ybdiedai-product-staff-v2` | `src/mock/product-staff-seed.json` |
| 门派管理 | `ybdiedai-sect-guild-v1` | `src/mock/sect-guild-seed.json` |
| 奖励管理 | `ybdiedai-reward-management-v1` | `src/mock/reward-management-seed.json` |
| 项目管理 | `ybdiedai-project-management-v1` | `src/mock/project-management-seed.json` |
| 客服管理 | `ybdiedai-customer-service-v1` | `src/mock/customer-service-seed.json` |
| 团队数据 | `ybdiedai-youboom-team-v1` | `src/mock/youboom-team-seed.json` |
| 商学院分类 | `ybdiedai-academy-categories-v1` | `src/mock/academy-categories-seed.json` |
| 商学院内容 | `ybdiedai-academy-contents-v1` | `src/mock/academy-contents-seed.json` |

### 使用方式

启动开发服务器后，页面右下角出现紫色「保存到仓库」按钮：

1. 点击按钮，弹出面板，查看各数据类型的当前条数
2. 点击「确认保存到仓库」
3. 所有 localStorage 数据写入 `src/mock/` 对应 JSON 文件
4. `git add src/mock/ && git commit -m "..."` 提交即可

> 此按钮仅在 `npm run dev` 开发模式下显示，build 产物中不会出现。

### 为新数据类型接入此模式（4步）

#### 第 1 步：生成 JSON 种子文件

在 `scripts/generate-seed-files.ts` 末尾添加：

```typescript
const { myNewSeedData } = await import('../src/myNewModel.js');
writeJson('my-new-seed.json', myNewSeedData);
```

运行一次生成初始文件：

```bash
npx tsx scripts/generate-seed-files.ts
```

#### 第 2 步：Model 文件从 JSON 加载

```typescript
// src/myNewModel.ts
import _seedJson from './mock/my-new-seed.json';

const _fromFile = _seedJson as unknown as MyNewRow[];

export const myNewSeedData: MyNewRow[] = _fromFile.length > 0
  ? _fromFile
  : [ /* TS 硬编码兜底数据 */ ];
```

#### 第 3 步：在 localWorkspacePersistence.ts 注册

```typescript
// STORAGE_KEYS 对象里加一行
myNew: 'ybdiedai-my-new-v1',

// 文件末尾加 load/save 函数
export function loadMyNewFromStorage(): MyNewRow[] {
  const parsed = readLocalJson<unknown>(STORAGE_KEYS.myNew);
  if (parsed === null) return [...myNewSeedData];
  if (!Array.isArray(parsed)) return [...myNewSeedData];
  return parsed as MyNewRow[];
}

export function saveMyNewToStorage(rows: MyNewRow[]): void {
  writeLocalJson(STORAGE_KEYS.myNew, rows);
}
```

#### 第 4 步：注册到 DevSaveToRepo

```typescript
// vite.config.ts → saveWorkspaceSnapshotPlugin → fileMap 加一行
myNew: 'my-new-seed.json',

// src/DevSaveToRepo.tsx → KEY_LABEL 加一行
myNew: '我的新数据',

// src/DevSaveToRepo.tsx → collectPayload 加一行
myNew: readLocalJson(STORAGE_KEYS.myNew) ?? [],
```

在 App.tsx（或对应页面组件）里改用 localStorage 加载并在变更时保存：

```typescript
const [myNewRows, setMyNewRows] = useState(() => loadMyNewFromStorage());

useEffect(() => {
  saveMyNewToStorage(myNewRows);
}, [myNewRows]);
```

---
