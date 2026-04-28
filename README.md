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
   └─ styles/ # CSS is currently not in top priorities
```


## Downloading the project
```bash
git clone https://github.com/Tiramisu1th/school-is-boring-where-tiramisu-has-3-dolls
```


## Testing locally
```powershell
.\build_for_cpanel.ps1 -l
```
You can also add an optional -p [flag] to specify which port should `npx run dev` use. For example,
```powershell
.\build_for_cpanel.ps1 -lp2526
```
#### For now, you can only test the appearance in frontend. I still haven't figured out a way to perfectly imitate the backend on localhost mode