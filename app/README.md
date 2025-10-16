# GymChain 프론트엔드

Solana 기반 P2E(Play to Earn) 운동 기록 애플리케이션의 React 프론트엔드입니다. 이 프로젝트는 Anchor 프로그램과 연동하여 지갑 연결, 운동 세션 생성 및 세트 기록, 세션 통계를 확인할 수 있는 UI를 제공합니다.

## 사전 준비

- Node.js 18.x 이상
- npm 9.x 이상 (또는 yarn, pnpm 중 하나)
- Solana CLI (`solana --version` 으로 설치 확인)
- Anchor CLI (`anchor --version`)
- Phantom 지갑 또는 Wallet Adapter가 지원하는 Solana 지갑

> ⚠️ **중요**: 실제 온체인 Anchor 프로그램을 빌드하고 배포한 뒤, `src/utils/constants.js`의 `PROGRAM_ID`와 `src/idl.json` 파일을 실제 값으로 교체해야 합니다.

## 설치 및 실행

```bash
# 의존성 설치
cd app
npm install

# 개발 서버 실행 (http://localhost:3000)
npm start

# 프로덕션 번들 생성
npm run build

# 단위 테스트 실행
npm test
```

## 프로젝트 구조

```
app/
├── public/               # CRA 정적 자원
├── src/
│   ├── components/
│   │   └── WorkoutApp.jsx   # 지갑 연결 및 운동 세션 UI
│   ├── hooks/
│   │   ├── useProgram.js    # Anchor Program 초기화 훅
│   │   └── useWorkout.js    # 운동 세션 관련 커스텀 훅
│   ├── utils/
│   │   └── constants.js     # 네트워크/운동 기본값
│   ├── App.jsx              # 지갑 Provider 래퍼
│   ├── App.js               # CRA 호환을 위한 재노출 파일
│   └── idl.json             # Anchor IDL (실제 프로그램에 맞게 교체)
└── README.md
```

## Solana 프로그램 연동 가이드

1. Anchor 프로그램을 로컬 또는 Devnet에 배포합니다.
   ```bash
   anchor build
   anchor deploy --provider.cluster devnet
   ```
2. 배포 후 출력되는 Program ID를 `src/utils/constants.js`의 `PROGRAM_ID` 값으로 교체합니다.
3. `target/idl/<program-name>.json` 파일을 `src/idl.json`으로 복사하거나, 실제 스키마에 맞게 내용(계정, instruction)을 업데이트합니다.
4. 필요시 `NETWORK` 값을 `clusterApiUrl('mainnet-beta')` 등 원하는 네트워크로 수정합니다.

## 주요 기능

- **지갑 연결/해제**: Solana Wallet Adapter UI를 사용하여 Phantom 등 지갑 연결을 지원합니다.
- **사용자 프로필 생성**: 온체인에 사용자 이름과 기본 휴식 시간을 기록합니다.
- **운동 세션 관리**: 세션 시작, 세트 저장, 세션 완료 처리 및 실시간 통계(세트 수, 볼륨, 운동 종류 수)를 제공합니다.
- **휴식 타이머 & 알림**: 세트 완료 후 자동 휴식 타이머와 브라우저 Notification API를 통한 휴식 완료 알림을 제공합니다.
- **데이터 모니터링**: 세트별 운동 이름, 무게, 횟수, 수행 시각, 총 볼륨을 카드 형태로 확인할 수 있습니다.

## 문제 해결 팁

- **지갑 연결이 되지 않는 경우**: 브라우저에서 Phantom 지갑이 설치되어 있고 Devnet이 선택되어 있는지 확인합니다.
- **트랜잭션 실패**: `PROGRAM_ID`, `idl.json`이 실제 Anchor 프로그램과 일치하는지 점검하고, Devnet SOL 잔액을 확인하세요.
- **알림 권한**: 브라우저에서 사이트의 알림 권한을 허용해야 휴식 완료 알림을 받을 수 있습니다.

## 라이선스

이 프로젝트는 팀 내부 사용을 목적으로 하며 필요에 따라 자유롭게 수정할 수 있습니다.
