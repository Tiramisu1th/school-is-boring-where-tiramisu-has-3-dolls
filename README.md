# school-is-boring-where-tiramisu-has-3-dolls
Small project that hosts a collection of minigames and a small Next.js frontend.
This README explains how to build the frontend, produce a deployable folder for cPanel, and what to upload.


## Overview
Who cares?


## Folder Structure
Top-level repository layout (important files and folders):

```
school-is-boring-where-tiramisu-has-3-dolls
├─ app.ts # cPanel Node.js app entry point
├─ build_for_cpanel.ps1 # Windows script to compile and/or run locally
├─ next-env.d.ts # do I look like I know what this is?
├─ next.config.js # do I look like I know what this is?
├─ package.json # do I look like I know what this is?
├─ README.md # thie docs
├─ tsconfig.json # do I look like I know what this is?
├─ tsconfig.server.json # do I look like I know what this is?
├─ public/
│  ├─ 404.html # custom context-rich 404
│  └─ assets/
└─ src/
   ├─ api/ # also serve as api endpoints
   │  ├─ auth.ts
   │  ├─ health.ts
   │  └─ router.ts
   ├─ pages/
   │  ├─ avalon.tsx
   │  ├─ health.tsx
   │  ├─ index.tsx
   │  ├─ postman.tsx
   │  ├─ show-hand.tsx
   │  └─ werewolf.tsx
   ├─ styles/ # Nothing yet
   └─ utils/ # Helper functions
      ├─ cors.ts
      ├─ print.ts
      ├─ teapot.ts
      └─ time.ts
```


## Downloading the project
```bash
git clone https://github.com/Tiramisu1th/school-is-boring-where-tiramisu-has-3-dolls
```


## Testing backend locally

```powershell
.\build_for_cpanel.ps1 -l
```
You can also add numbers to specify which port should `Node out\app.js` use. For example,
```powershell
.\build_for_cpanel.ps1 -p2526
```
#### Expected Command Output
```powershell
Server listening on port 2526
```

## Previewing TypeScript webpages only
```powershell
.\build_for_cpanel.ps1 -d
```
You can also add an optional -p flag to specify which port should `npx run dev` use. For example,
```powershell
.\build_for_cpanel.ps1 -d2526
```
#### Expected Command Output
```powershell
▲ Next.js 16.2.4 (Turbopack)
- Local:         http://localhost:2526
- Network:       http://calculateangle:2526
- Environments: .env
```

## Versions
| Item | Version |
| --- | --- |
| **dotenv** | `17.4.2` |
| **npm** | `11.9.0` |
| **Node.js** | `v24.14.0` |
| **Next.js** | `16.2.4` |
| **React** | `19.2.5`|
| **React DOM** | `19.2.5` |
| **socket.io** | `4.8.3` |
| **TypeScript** | `6.0.3` |