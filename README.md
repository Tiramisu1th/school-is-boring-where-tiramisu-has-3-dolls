# school-is-boring-where-tiramisu-has-3-dolls
Small project that hosts a collection of minigames and a small Next.js frontend.
This README explains how to build the frontend, produce a deployable folder for cPanel, and what to upload.


## Overview
Who cares?


## Folder Structure
Top-level repository layout (important files and folders):

```
schoolisboring
├─ .env.example # Shows an example of how .env looks like
├─ .gitignore # helps me hide secrets
├─ app.js # The entry point of the website's backend
├─ build_for_cpanel.ps1 # The script to streamline compilation/localhost procedures
├─ package.json
├─ README.md # this file
├─ public/
│  ├─ 404.html
│  └─ assets/ # favicons and potentially pngs and svgs in the future
└─ src/
   ├─ pages/ # frontend webpages
   │  ├─ avalon.tsx # WIP
   │  ├─ index.tsx
   │  ├─ show-hand.tsx # WIP
   │  └─ werewolf.tsx # WIP
   ├─ styles/ # CSS is currently not in top priorities
   └─ utils/ # minor helper functions
      ├─ time.tsx # time-related helper functions
      └─ print.ts # mimic python print() but includes a timestamp
```


## Downloading the project
```bash
git clone https://github.com/Tiramisu1th/school-is-boring-where-tiramisu-has-3-dolls
```


## Testing backend locally

```powershell
.\build_for_cpanel.ps1 -l
```
You can also add an optional -p flag to specify which port should `Node out\app.js` use. For example,
```powershell
.\build_for_cpanel.ps1 -lp2526
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
.\build_for_cpanel.ps1 -lp2526
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
| **npm** | `11.9.0` |
| **Node.js** | `v24.14.0` |
| **Next.js** | `16.2.4` |
| **React** | `19.2.5`|
| **React DOM** | `19.2.5` |
| **socket.io** | `4.8.3` |
| **TypeScript** | `6.0.3` |