# Deployment Guide

Your application has been successfully built! Here is how to deploy it live.

## Option 1: Vercel (Recommended)
This is the easiest way to deploy a Vite/React app.

1.  **Push to GitHub**:
    Ensure your code is on GitHub. If you haven't pushed yet run:
    ```bash
    git push -u origin main
    ```

2.  **Deploy**:
    -   Go to [Vercel.com](https://vercel.com) and Sign Up/Login.
    -   Click **"Add New..."** -> **"Project"**.
    -   Select your **Coming-Soon-Page-** repository.
    -   Click **Deploy**.
    -   Vercel will detect Vite automatically.

## Option 2: Netlify
1.  Go to [Netlify.com](https://netlify.com).
2.  Click **"Add new site"** -> **"Import an existing project"**.
3.  Connect to GitHub and select your repo.
4.  Click **Deploy**.

## Option 3: GitHub Pages
If you prefer to host directly on GitHub, we need to add the `gh-pages` package and update config.

1.  Run: `npm install gh-pages --save-dev`
2.  Update `vite.config.ts`: add `base: '/Coming-Soon-Page-/',`
3.  Update `package.json`:
    Add `"homepage": "https://altersnehal.github.io/Coming-Soon-Page-",`
    Add script: `"deploy": "gh-pages -d dist"`
4.  Run: `npm run deploy`
