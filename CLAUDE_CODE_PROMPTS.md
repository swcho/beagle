# AssetVault — Claude Code 세션 프롬프트 (Electron)

> 사용법: CLAUDE.md를 프로젝트 루트에 두고,
> 각 세션 시작 시 해당 프롬프트를 Claude Code에 붙여넣으세요.

---

## Session 1 — 프로젝트 초기 셋업

```
CLAUDE.md를 먼저 읽어.

다음을 순서대로 진행해:

1. electron-vite로 프로젝트를 생성해.
   - 템플릿: react-ts
   - 패키지 매니저: pnpm

   ```bash
   pnpm create @quick-start/electron assetvault --template react-ts
   cd assetvault
   ```

2. 다음 의존성을 설치해:
   ```bash
   # 렌더러
   pnpm add @tanstack/react-virtual @dnd-kit/core zustand lucide-react three
   pnpm add -D tailwindcss @types/three

   # 메인 프로세스
   pnpm add better-sqlite3 sharp node-vibrant chokidar uuid
   pnpm add -D @types/better-sqlite3 @types/uuid electron-builder
   ```

3. Tailwind CSS를 설정해 (PostCSS 방식).

4. src/shared/types.ts 를 CLAUDE.md의 공유 타입 정의대로 만들어.

5. src/main/db/schema.ts 를 만들어:
   - CLAUDE.md의 SQL 스키마를 실행하는 `initializeDatabase()` 함수
   - better-sqlite3로 DB 파일을 앱 userData 디렉토리에 생성
     (`app.getPath('userData') + '/assetvault.db'`)

6. src/main/index.ts 에서 앱 시작 시 DB를 초기화해.

7. src/main/preload.ts 에서 contextBridge로 window.api를 노출해.
   CLAUDE.md의 ElectronAPI 타입에 맞게 채널 이름을 정의해.
   (구현은 빈 stub으로, 나중 세션에서 채워나감)

8. pnpm dev 로 빈 앱이 실행되는지 확인해.

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 2 — 파일 스캔 & 임포트

```
CLAUDE.md를 먼저 읽어.

파일 시스템 스캔과 임포트 기능을 구현해:

1. src/main/services/scanner.ts:
   - `scanDirectory(dirPath: string): AsyncGenerator<ScannedFile>`
   - 재귀적으로 폴더를 순회
   - SUPPORTED_FORMATS에 해당하는 파일만 yield
   - 각 파일에서 추출할 정보: path, name, ext, size, createdAt
   - 이미지(png/jpg/jpeg/gif/webp)는 sharp로 width/height 추출
   - 오디오는 duration 추출 (music-metadata 패키지 사용)

2. src/main/db/queries.ts:
   - `upsertAsset(asset: Omit<Asset, 'tags' | 'colors'>): void`
   - `getAssets(filter: AssetFilter): Asset[]`
     - AssetFilter 조건에 맞게 동적 WHERE절 생성
     - tags는 JOIN으로 함께 조회
   - `getAssetById(id: string): Asset | null`
   - `deleteAssets(ids: string[]): void`

3. src/main/ipc/library.ts:
   - `import-folder` 핸들러:
     - scanner로 파일 목록 수집
     - DB에 upsert
     - 진행률을 mainWindow.webContents.send('import-progress', payload)로 emit
     - 완료 후 { imported, skipped } 반환
   - `get-assets` 핸들러: getAssets(filter) 호출
   - `get-asset` 핸들러
   - `remove-assets` 핸들러

4. preload.ts에서 위 채널들을 window.api에 연결해.

5. 렌더러에서 임시 테스트 버튼을 만들어:
   - "폴더 임포트" 버튼 클릭 → dialog.showOpenDialog → import-folder IPC
   - import-progress 이벤트 수신 → 콘솔에 진행률 출력
   - 완료 후 get-assets 호출 결과를 콘솔에 출력

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 3 — 썸네일 생성 & 색상 추출

```
CLAUDE.md를 먼저 읽어.

썸네일 생성 파이프라인을 구현해:

1. src/main/services/thumbnailer.ts:
   - `generateThumbnail(asset: Asset): Promise<string>`
   - 저장 경로: `{userData}/thumbnails/{assetId}.webp`
   - 이미지(png/jpg/jpeg/gif/bmp): sharp로 200x200 리사이즈 (fit: inside)
   - SVG: 그대로 원본 경로 반환 (리사이즈 불필요)
   - 오디오/폰트/3D: 타입별 플레이스홀더 반환 (나중에 교체)
   - 이미 캐시된 파일이 있으면 바로 반환 (재생성 skip)

2. src/main/services/colorExtract.ts:
   - `extractColors(imagePath: string): Promise<string[]>`
   - node-vibrant으로 주요 5가지 색상 HEX 배열 반환
   - 실패 시 빈 배열 반환 (에러 throw 하지 않음)

3. src/main/ipc/thumbnail.ts:
   - `generate-thumbnails` 핸들러:
     - asset_ids 배열을 받아 순서대로 처리
     - 각 썸네일 완료 시 'thumbnail-ready' 이벤트 emit
       payload: { assetId, thumbnailPath, colors }
     - DB에 thumbnail, colors 업데이트
   - Worker Thread는 이번 세션에서는 생략, 단순 순차 처리로 시작

4. import-folder 완료 직후 generate-thumbnails 자동 호출하도록 수정.

5. preload.ts에 generateThumbnails 연결.

6. 렌더러에서 thumbnail-ready 이벤트를 수신해서 콘솔에 출력 확인.

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 4 — 메인 Grid UI

```
CLAUDE.md를 먼저 읽어.

메인 에셋 그리드 UI를 구현해:

1. Zustand 스토어 3개를 만들어:

   libraryStore.ts:
   - assets: Asset[]
   - totalCount: number
   - isLoading: boolean
   - fetchAssets(filter): Promise<void>  ← window.api.getAssets 호출
   - removeAssets(ids): Promise<void>

   filterStore.ts:
   - query: string
   - types: AssetType[]
   - tagIds: string[]
   - colors: string[]
   - sortBy, sortOrder
   - setFilter(partial): void
   - resetFilter(): void

   uiStore.ts:
   - viewMode: 'grid' | 'list'
   - selectedIds: Set<string>
   - toggleSelect(id): void
   - selectAll(): void
   - clearSelection(): void
   - gridColumns: number  ← ResizeObserver로 자동 계산

2. 컴포넌트를 만들어:

   TopBar:
   - 검색 입력창 (onChange debounce 300ms → filterStore.setFilter)
   - Grid/List 토글 버튼
   - 정렬 드롭다운 (이름/크기/날짜)
   - "임포트" 버튼 → window.api.openFolderDialog → importFolder

   AssetCard:
   - 썸네일 (thumbnail 없으면 타입별 lucide 아이콘)
   - 파일명 1줄 말줄임
   - 파일 타입 컬러 뱃지 (image=blue, audio=green, video=purple...)
   - 클릭 시 선택 토글
   - hover state CSS만 추가 (팝업은 다음 세션)

   MainGrid:
   - @tanstack/react-virtual의 useVirtualizer 사용
   - 행당 gridColumns개 카드 배치
   - ResizeObserver로 컨테이너 너비 감지 → gridColumns 자동 업데이트

   StatusBar:
   - 총 에셋 수, 선택된 수, 선택된 에셋 총 용량 표시

3. App.tsx에서 전체 레이아웃 조합.
   filterStore 변경 시 fetchAssets 자동 호출 (useEffect).

4. 다크 테마로 스타일링:
   - 배경: zinc-900 / 사이드바: zinc-800 / 카드: zinc-800 hover:zinc-700
   - 부드러운 트랜지션 (transition-colors duration-150)

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 5 — Hover 프리뷰 팝업

```
CLAUDE.md를 먼저 읽어.

에셋 타입별 hover 프리뷰를 구현해:

1. useHover hook (src/renderer/hooks/useHover.ts):
   - 300ms delay 후 isHovered: true
   - 마우스가 떠나면 즉시 false
   - 커서 위치(x, y) 반환

2. AssetPreviewPopup 컴포넌트:
   - AssetCard의 hover 시 표시
   - 위치: 커서 오른쪽 우선, 화면 밖이면 왼쪽으로 flip
   - 최대 400x400, 배경 zinc-800, rounded-xl, shadow-2xl
   - 타입별 프리뷰 컴포넌트를 조건부 렌더링

3. 타입별 프리뷰 컴포넌트:

   ImagePreview (png/jpg/jpeg/webp/bmp):
   - <img> 태그로 원본 파일 표시 (src: `file://${asset.path}`)
   - 해상도, 파일 크기 표시

   GifPreview:
   - <img> 태그 (GIF 자동 재생)

   SvgPreview:
   - <img> 태그로 표시

   AudioPreview (mp3/wav/ogg/flac):
   - Web Audio API로 웨이브폼 Canvas 렌더링
     (AudioContext → decodeAudioData → getChannelData → Canvas에 그리기)
   - <audio> 태그로 재생/정지 버튼
   - 파일 길이, 재생 진행 바

   FontPreview (ttf/otf):
   - FontFace API로 동적 로드
   - "Aa 가나다 AaBbCc 0123" 샘플 텍스트를 여러 크기로 표시

   VideoPreview (mp4/webm):
   - <video autoPlay muted loop> 태그

   Model3DPreview (obj/glb/gltf):
   - three.js + OrbitControls
   - OBJLoader 또는 GLTFLoader로 로드
   - 기본 AmbientLight + DirectionalLight
   - Canvas 300x300

4. AssetCard에 useHover 연결 + AssetPreviewPopup 조건부 렌더링 추가.

오디오 웨이브폼 계산은 useEffect 안에서 처리.
컴포넌트 언마운트 시 AudioContext 닫기.

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 6 — 태그 시스템 & AssetDetail 패널

```
CLAUDE.md를 먼저 읽어.

태그 CRUD와 에셋 상세 패널을 구현해:

1. src/main/db/queries.ts에 추가:
   - `getTags(): Tag[]`
   - `createTag(name, color): Tag`
   - `deleteTag(id): void`
   - `updateAssetTags(assetId, tagIds): void`

2. src/main/ipc/tags.ts IPC 핸들러 + preload 연결.

3. AssetDetail 패널 (에셋 클릭 시 우측에 표시):
   - 에셋 썸네일 (크게)
   - 파일명 (클릭하면 인라인 편집 가능)
   - 메타데이터: 크기, 해상도, 길이, 임포트 날짜, 전체 경로
   - 주요 색상 팔레트 (5개 컬러 칩)
   - 태그 섹션:
     - 현재 태그 목록 (클릭하면 제거)
     - 태그 추가 인풋 (입력 시 기존 태그 자동완성 드롭다운)
     - 없는 태그 입력 후 Enter → 새 태그 생성
   - "파인더에서 보기" 버튼 → window.api.showInFinder

4. Sidebar 태그 섹션:
   - 태그 목록 (태그명 + 에셋 수 뱃지)
   - 클릭 시 filterStore.tagIds에 추가
   - 태그 옆 컬러 닷 클릭 → color picker (input type=color)
   - 우클릭 → 컨텍스트 메뉴 (삭제)

5. TopBar 활성 필터 칩:
   - 적용된 태그/타입 필터를 칩으로 표시
   - 칩의 X 버튼으로 제거
   - "필터 초기화" 버튼

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 7 — 검색 & 색상 필터

```
CLAUDE.md를 먼저 읽어.

전문 검색과 색상 기반 필터링을 구현해:

1. src/main/db/queries.ts에 추가:

   searchAssets(query: string): Asset[]
   - SQLite FTS5 사용
   - assets_fts 테이블에 검색
   - 결과를 assets JOIN asset_tags로 tags 포함해서 반환
   - 한국어 파일명 테스트

   searchByColor(hex: string, tolerance: number): Asset[]
   - assets.colors JSON 파싱
   - 각 에셋의 색상과 hex 간 HSL 유클리드 거리 계산
   - tolerance 이하인 에셋만 반환
   - SQL에서 처리 어려우면 JS에서 필터링 OK

2. src/main/ipc/search.ts 핸들러 + preload 연결.

3. 색상 필터 UI (Sidebar 하단):
   - 프리셋 색상 팔레트 (빨/주/노/초/파/남/보/분/흰/회/검, 11개)
   - 각 색상 클릭 → filterStore.colors에 추가
   - 선택된 색상 칩 표시 + X로 제거
   - tolerance 슬라이더 (0.1~0.5, 기본 0.25)

4. 복합 검색 통합:
   - filterStore의 query, types, tagIds, colors를 모두 조합
   - query가 있으면 FTS 검색 → 결과 id 목록으로 추가 필터
   - 색상 필터가 있으면 searchByColor 결과와 교집합
   - debounce 300ms

5. TopBar 검색창 단축키:
   - Cmd+F (macOS) / Ctrl+F (Windows): 검색창 포커스
   - Escape: 검색 초기화

완료 후 어떤 파일을 만들었는지, 다음 세션에서 할 일을 요약해.
```

---

## Session 8 — 키보드 단축키 & 마무리

```
CLAUDE.md를 먼저 읽어.

앱을 완성도 있게 다듬어:

1. 키보드 단축키 (useEffect + keydown 이벤트):
   - Cmd/Ctrl+A: 전체 선택
   - Escape: 선택 해제 + 패널 닫기
   - Cmd/Ctrl+I: 임포트 다이얼로그
   - Delete/Backspace: 선택된 에셋 라이브러리에서 제거 (파일 삭제 아님)
   - Space: 선택된 첫 번째 에셋 상세 패널 열기
   - Cmd/Ctrl+F: 검색창 포커스

2. 에러 처리:
   - 파일이 이동/삭제된 경우: 썸네일 위치에 "파일 없음" 오버레이
   - 임포트 실패 파일 목록을 완료 후 토스트로 표시
   - IPC 에러를 사용자 친화적 메시지로 표시

3. 빈 상태(empty state) UI:
   - 에셋이 없을 때: "폴더를 임포트해서 시작하세요" + 임포트 버튼
   - 검색 결과 없음: "검색 결과가 없습니다" + 필터 초기화 버튼

4. electron-builder.yml 설정:
   - appId: com.assetvault.app
   - productName: AssetVault
   - macOS: dmg 포맷, arm64 + x64 universal 빌드 설정

5. pnpm build 실행 후 .dmg 파일 생성 확인.
   빌드 오류가 있으면 하나씩 해결해.

완료 후 최종 앱 구조와 각 세션에서 구현한 내용을 요약해.
```

---

## 공통 지침 (모든 세션)

```
- 매 세션 시작 시 CLAUDE.md를 반드시 읽어
- 코드 작성 전에 무엇을 만들지 한 줄로 설명해
- TypeScript any 사용 금지
- 렌더러에서 ipcRenderer 직접 사용 금지 — 반드시 window.api 경유
- 에러는 콘솔만 찍지 말고 UI에 표시
- 파일 200줄 초과 시 분리
- 작업 완료 후 만든 파일 목록과 다음 세션 할 일을 요약해
```
