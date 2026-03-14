# AssetVault — Game Asset Manager
> Eagle App 대용 인디 게임 에셋 관리 데스크탑 앱

---

## 프로젝트 개요

게임 개발자를 위한 로컬 디지털 에셋 매니저. 이미지, 사운드, 폰트, 3D 모델 등을
빠르게 브라우징하고 태깅·검색할 수 있는 macOS/Windows 데스크탑 앱.

**핵심 가치:**
- 파일을 열지 않고도 hover 한 번으로 즉시 미리보기
- 사운드는 웨이브폼 시각화 + 인라인 재생
- 태그 + 컬러 팔레트 기반 검색
- 로컬 전용, 빠른 응답성

---

## 기술 스택

### 프레임워크
- **Electron 32.x**
- **React 18 + TypeScript** (strict mode)
- **Tailwind CSS**
- **electron-vite** (번들러)

### 주요 라이브러리
| 역할 | 패키지 |
|------|--------|
| 빌드/패키징 | `electron-vite`, `electron-builder` |
| 가상 스크롤 | `@tanstack/react-virtual` |
| 드래그앤드롭 | `@dnd-kit/core` |
| 상태 관리 | `zustand` |
| DB | `better-sqlite3` |
| 이미지 처리 | `sharp` |
| 색상 추출 | `node-vibrant` |
| 파일 감시 | `chokidar` |
| 오디오 프리뷰 | Web Audio API (렌더러) |
| 3D 프리뷰 | `three.js` (렌더러) |
| 아이콘 | `lucide-react` |

---

## 디렉토리 구조

```
assetvault/
├── src/
│   ├── main/                   # Electron 메인 프로세스 (Node.js)
│   │   ├── index.ts            # 앱 진입점, BrowserWindow 생성
│   │   ├── preload.ts          # contextBridge — window.api 노출
│   │   ├── ipc/                # IPC 핸들러
│   │   │   ├── library.ts      # 임포트, 에셋 조회
│   │   │   ├── thumbnail.ts    # 썸네일 생성
│   │   │   ├── search.ts       # 검색
│   │   │   └── tags.ts         # 태그 CRUD
│   │   ├── db/
│   │   │   ├── schema.ts       # 스키마 & 마이그레이션
│   │   │   └── queries.ts      # 쿼리 함수
│   │   └── services/
│   │       ├── scanner.ts      # 파일 시스템 스캔
│   │       ├── thumbnailer.ts  # sharp 썸네일 생성
│   │       ├── colorExtract.ts # node-vibrant 색상 추출
│   │       └── watcher.ts      # chokidar 파일 감시
│   │
│   ├── renderer/               # React 앱
│   │   ├── components/
│   │   │   ├── layout/         # TopBar, Sidebar, StatusBar
│   │   │   ├── asset/          # AssetCard, AssetPreviewPopup, AssetDetail
│   │   │   ├── filter/         # TagFilter, ColorFilter, TypeFilter
│   │   │   └── ui/             # 공통 컴포넌트
│   │   ├── stores/
│   │   │   ├── libraryStore.ts
│   │   │   ├── filterStore.ts
│   │   │   └── uiStore.ts
│   │   └── hooks/
│   │
│   └── shared/                 # 메인/렌더러 공유 타입
│       └── types.ts
│
├── electron.vite.config.ts
├── electron-builder.yml
└── CLAUDE.md
```

---

## 공유 타입 (src/shared/types.ts)

```typescript
export interface Asset {
  id: string
  path: string
  name: string
  ext: string
  size: number
  width?: number
  height?: number
  duration?: number       // 오디오/비디오 (초)
  thumbnail?: string      // 썸네일 캐시 경로
  colors: string[]        // ["#FF5733", ...]
  tags: Tag[]
  createdAt: number
  importedAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  icon: string
  sortOrder: number
}

export interface AssetFilter {
  query?: string
  types?: AssetType[]
  tagIds?: string[]
  folderId?: string
  colors?: string[]
  sortBy?: 'name' | 'size' | 'createdAt' | 'importedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ImportProgress {
  current: number
  total: number
  filename: string
}

// preload에서 window.api로 노출할 타입
export interface ElectronAPI {
  importFolder: (path: string) => Promise<{ imported: number; skipped: number }>
  getAssets: (filter: AssetFilter) => Promise<Asset[]>
  getAsset: (id: string) => Promise<Asset>
  removeAssets: (ids: string[]) => Promise<void>
  generateThumbnails: (ids: string[]) => Promise<void>
  searchAssets: (query: string) => Promise<Asset[]>
  searchByColor: (hex: string, tolerance: number) => Promise<Asset[]>
  getTags: () => Promise<Tag[]>
  createTag: (name: string, color: string) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  updateAssetTags: (assetId: string, tagIds: string[]) => Promise<void>
  getFolders: () => Promise<Folder[]>
  createFolder: (name: string, parentId?: string) => Promise<Folder>
  openFolderDialog: () => Promise<string | null>
  showInFinder: (path: string) => Promise<void>
  on: (channel: string, cb: (...args: unknown[]) => void) => void
  off: (channel: string, cb: (...args: unknown[]) => void) => void
}

declare global {
  interface Window { api: ElectronAPI }
}

export const SUPPORTED_FORMATS = {
  image:   ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'],
  audio:   ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  video:   ['mp4', 'webm', 'mov'],
  font:    ['ttf', 'otf', 'woff', 'woff2'],
  model3d: ['obj', 'glb', 'gltf'],
  doc:     ['pdf'],
} as const

export type AssetType = keyof typeof SUPPORTED_FORMATS
```

---

## 데이터베이스 스키마

```sql
CREATE TABLE IF NOT EXISTS assets (
  id          TEXT PRIMARY KEY,
  path        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  ext         TEXT NOT NULL,
  size        INTEGER,
  width       INTEGER,
  height      INTEGER,
  duration    REAL,
  thumbnail   TEXT,
  colors      TEXT DEFAULT '[]',
  created_at  INTEGER,
  imported_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS tags (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280'
);

CREATE TABLE IF NOT EXISTS asset_tags (
  asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
  tag_id   TEXT REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (asset_id, tag_id)
);

CREATE TABLE IF NOT EXISTS folders (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  parent_id  TEXT REFERENCES folders(id),
  icon       TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS folder_assets (
  folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  asset_id  TEXT REFERENCES assets(id)  ON DELETE CASCADE,
  PRIMARY KEY (folder_id, asset_id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts
  USING fts5(name, content='assets', content_rowid='rowid');

CREATE INDEX IF NOT EXISTS idx_assets_ext      ON assets(ext);
CREATE INDEX IF NOT EXISTS idx_assets_imported ON assets(imported_at DESC);
```

---

## UI 레이아웃 명세

```
┌──────────────────────────────────────────────────────────┐
│  TopBar: 검색창 / Grid·List 토글 / 정렬 / 임포트 버튼      │
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│  Sidebar    │  MainGrid (@tanstack/react-virtual)        │
│  ├─ 라이브러리│  ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  ├─ 스마트폴더│  │썸네│ │썸네│ │썸네│ │썸네│            │
│  ├─ 태그    │  │ 일 │ │ 일 │ │ 일 │ │ 일 │            │
│  └─ 필터    │  └────┘ └────┘ └────┘ └────┘            │
│    ├─ 타입  │                                            │
│    ├─ 색상  │  [hover → AssetPreviewPopup]               │
│    └─ 날짜  │                                            │
│             ├────────────────────────────────────────────┤
│             │  StatusBar: n개 / m개 선택 / 총 용량        │
└─────────────┴────────────────────────────────────────────┘
```

그리드 컬럼: < 800px → 3열 / 800~1200px → 5열 / > 1200px → 7열

---

## 성능 목표

- 에셋 10만 개 기준 초기 렌더 **< 500ms**
- 썸네일 생성: Worker Thread 비동기, UI 블로킹 없음
- 검색 응답: **< 100ms**
- 메모리: **< 400MB**
- 가상 스크롤: DOM에 최대 60개 카드만 유지

---

## 코딩 컨벤션

- TypeScript strict mode. `any` 사용 금지
- 컴포넌트는 함수형. props 타입은 `interface`로 별도 정의
- Tailwind utility class만. 인라인 `style` prop 금지
- 렌더러에서 IPC 호출은 반드시 `window.api.*` 경유. `ipcRenderer` 직접 사용 금지
- 에러는 try/catch + UI에 표시. 콘솔만 찍고 끝내지 않기
- 파일명: 컴포넌트 PascalCase, 훅/유틸 camelCase
- 파일 200줄 초과 시 분리
