# Next.js 프론트엔드 개발 가이드 (README.md)

본 프로젝트는 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)으로 생성된 [Next.js](https://nextjs.org) 프론트엔드 애플리케이션입니다. 에이전트 군집 지능 워크스테이션의 지휘 통제실 역할을 수행합니다.

---

## 1. 시작하기 (Getting Started)

먼저, 로컬 환경에서 개발용 서버를 구동하십시오:

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

서버 실행 후, 브라우저를 열고 [http://localhost:3000](http://localhost:3000)으로 접속하면 활성화된 군집 대시보드를 확인할 수 있습니다.

`src/app/page.tsx` 파일을 편집하여 페이지 구성을 시작할 수 있습니다. 편집 시 변경사항이 브라우저에 실시간 핫 리로드(Hot-reload)됩니다.

이 프로젝트는 Vercel에서 제공하는 최적의 폰트 최적화 기술인 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)를 사용하여 [Geist](https://vercel.com/font) 서체를 로드 및 적용하고 있습니다.

---

## 2. 추가 학습 자료 (Learn More)

Next.js의 기능과 사양에 대해 알아보고 싶다면 아래 공식 자료들을 학습해 보십시오:

*   [Next.js 공식 문서 (Next.js Documentation)](https://nextjs.org/docs) - Next.js의 핵심 API와 라우팅 사양.
*   [인터랙티브 Next.js 튜토리얼 (Learn Next.js)](https://nextjs.org/learn) - Next.js 공식 교육 코스.

프로젝트 피드백이나 기여는 [공식 Next.js GitHub 저장소](https://github.com/vercel/next.js)에서 참여할 수 있습니다.

---

## 3. Vercel 플랫폼 배포 (Deploy on Vercel)

Next.js 앱을 가장 빠르고 손쉽게 배포하는 방법은 Next.js 제작사인 Vercel 팀이 운영하는 [Vercel 플랫폼](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)을 활용하는 것입니다.

상세한 배포 과정은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참고하십시오.
