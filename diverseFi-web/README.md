This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Current stack:** Next.js 16.1, React 19, TypeScript 5, Tailwind CSS 3

## Introduction
DiverseFi web dashboard — Next.js frontend for the DiverseFi application.

## Environment

```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Go API base URL (include `/api`) | `http://localhost:8080/api` |

## Getting Started
```bash
npm install
```

## Libraries Packages
This application have the following packagaes:
- Tailwindcss
- TailwindUI
- HeroIcons
- Redux Toolkit

## Framework & Runtime

- **Next.js:** `16.1.6`
- **React / React DOM:** `19.2.4`
- **TypeScript:** `^5`
- **Node.js requirement:** `>= 20.9.0` (per Next.js 16)

## Running Local Development Envrionment
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Notes on Next.js 16 Upgrade

This project has been upgraded from Next.js 14 → 16 using `npx @next/codemod@canary upgrade latest`, with the following key changes applied:

- **Middleware → Proxy:** `src/middleware.ts` has been renamed to `src/proxy.ts` and now exports `proxy` instead of `middleware`.
- **Async request APIs:** `cookies()` and other request APIs are now async; the logout route at `app/api/auth/logout/route.ts` has been updated to `await cookies()`.
- **Async params in client routes:** Dynamic client routes under `app/(protected)/*/[id]/page.tsx` now treat `params` as `Promise<{ id: string }>` and unwrap them with `React.use(params)`.
- **Type safety:** All TypeScript errors related to the upgrade have been resolved (`npx tsc --noEmit` passes).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
