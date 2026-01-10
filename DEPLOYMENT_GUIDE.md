# Deployment Guide: Vercel & Render

This guide provides step-by-step instructions for deploying your project to Vercel and Render.

---

## Table of Contents
- [Deploying to Vercel](#deploying-to-vercel)
- [Deploying to Render](#deploying-to-render)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Deploying to Vercel

Vercel is ideal for frontend applications, Next.js, React, Vue, and static sites.

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Your project pushed to a GitHub repository

### Step 1: Prepare Your Project

1. **Ensure your project builds successfully locally**
   ```bash
   npm run build
   ```

2. **Create/verify `.gitignore` file** to exclude:
   ```
   node_modules/
   .env
   .env.local
   dist/
   build/
   .vercel/
   ```

3. **Commit and push all changes to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** or **"Import Project"**
3. Select **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account if prompted
5. Select your project repository from the list

### Step 3: Configure Project Settings

1. **Framework Preset**: Vercel usually auto-detects (e.g., Vite, Next.js, React)
2. **Root Directory**: Leave as `.` unless your app is in a subdirectory
3. **Build Command**: Usually auto-detected
   - For Vite: `npm run build` or `vite build`
   - For Create React App: `npm run build`
4. **Output Directory**: Usually auto-detected
   - For Vite: `dist`
   - For CRA: `build`
5. **Install Command**: `npm install` (default)

### Step 4: Add Environment Variables

1. Click **"Environment Variables"** section
2. Add all necessary variables (e.g., API keys, Firebase config)
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - etc.
3. Choose environment: **Production**, **Preview**, or **Development**

> [!IMPORTANT]
> Never commit `.env` files with sensitive data to GitHub. Always use environment variables in Vercel dashboard.

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build process to complete (usually 1-3 minutes)
3. Once successful, you'll get a deployment URL (e.g., `your-project.vercel.app`)

### Step 6: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions provided by Vercel

### Step 7: Enable Automatic Deployments

- Every push to your main branch automatically triggers a new deployment
- Pull requests create preview deployments
- Configure branch settings in **Project Settings > Git**

---

## Deploying to Render

Render is great for backend services, full-stack applications, databases, and static sites.

### Prerequisites
- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Your project pushed to a GitHub repository

### Option A: Deploying a Web Service (Backend/Full-Stack)

#### Step 1: Prepare Your Project

1. **Create a build script** in `package.json`:
   ```json
   {
     "scripts": {
       "build": "npm install && npm run build",
       "start": "node dist/index.js"
     }
   }
   ```

2. **Specify Node version** in `package.json`:
   ```json
   {
     "engines": {
       "node": "18.x"
     }
   }
   ```

3. **Commit and push changes**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

#### Step 2: Create Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository

#### Step 3: Configure Web Service

1. **Name**: Enter a unique name for your service
2. **Region**: Choose closest to your users
3. **Branch**: `main` (or your default branch)
4. **Root Directory**: Leave blank unless app is in subdirectory
5. **Runtime**: **Node**
6. **Build Command**: 
   ```bash
   npm install && npm run build
   ```
7. **Start Command**:
   ```bash
   npm start
   ```
   Or for specific file:
   ```bash
   node dist/index.js
   ```

#### Step 4: Choose Plan

- **Free**: Limited resources, spins down after inactivity
- **Starter/Professional**: Always-on service with better resources

#### Step 5: Add Environment Variables

1. Scroll to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add all necessary variables:
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url
   FIREBASE_API_KEY=your_key
   ```

#### Step 6: Deploy

1. Click **"Create Web Service"**
2. Monitor the deployment logs
3. Once complete, you'll get a URL (e.g., `your-app.onrender.com`)

### Option B: Deploying a Static Site

#### Step 1: Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your repository
3. Configure settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist` (for Vite) or `build` (for CRA)

#### Step 2: Add Environment Variables

- Add any build-time environment variables needed

#### Step 3: Deploy

1. Click **"Create Static Site"**
2. Wait for build to complete

### Option C: Deploying a Database

#### PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Enter database name
3. Choose region and plan (Free tier available)
4. Click **"Create Database"**
5. Copy the **Internal Database URL** and **External Database URL**
6. Use these URLs in your web service environment variables

### Step 7: Configure Custom Domain (Optional)

1. Go to your service settings
2. Navigate to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Follow DNS configuration instructions

### Step 8: Enable Auto-Deploy

- Render automatically deploys on every push to your branch
- Configure in **Settings > Build & Deploy**

---

## Environment Variables

### Common Variables for Firebase Projects

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API URLs
VITE_API_URL=https://your-api.onrender.com
```

> [!TIP]
> For Vite projects, environment variables must be prefixed with `VITE_` to be accessible in the browser.

### Setting Environment Variables

**Vercel:**
- Dashboard → Project → Settings → Environment Variables

**Render:**
- Dashboard → Service → Environment → Add Environment Variable

---

## Troubleshooting

### Vercel Issues

#### Build Fails

1. **Check build logs** in Vercel dashboard
2. Ensure `package.json` scripts are correct
3. Verify all dependencies are in `package.json` (not just devDependencies)
4. Test build locally: `npm run build`

#### Peer Dependency Conflicts

If you encounter errors like `ERESOLVE could not resolve` or peer dependency conflicts:

**Solution 1: Create `.npmrc` file** (Recommended)
1. Create `.npmrc` in your project root:
   ```
   legacy-peer-deps=true
   ```
2. Commit and push:
   ```bash
   git add .npmrc
   git commit -m "Add .npmrc for peer deps"
   git push
   ```

**Solution 2: Configure `vercel.json`**
1. Create or update `vercel.json`:
   ```json
   {
     "buildCommand": "npm install --legacy-peer-deps && npm run build",
     "installCommand": "npm install --legacy-peer-deps"
   }
   ```

**Example Error:**
```
npm error ERESOLVE could not resolve
npm error peer react@"^19" from @react-three/drei@10.7.7
npm error Conflicting peer dependency: react@19.2.3
```

This happens when a package requires a different version of a peer dependency than what your project uses. Using `--legacy-peer-deps` tells npm to ignore these conflicts.

#### Environment Variables Not Working

1. Ensure variables are prefixed correctly (e.g., `VITE_` for Vite)
2. Redeploy after adding variables
3. Check variable spelling in code

#### 404 on Routes

For SPAs (Single Page Applications):
1. Create `vercel.json` in project root:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Render Issues

#### Service Won't Start

1. **Check logs** in Render dashboard
2. Verify start command is correct
3. Ensure port is set correctly:
   ```javascript
   const PORT = process.env.PORT || 3000;
   app.listen(PORT);
   ```

#### Build Timeout

1. Increase build timeout in settings
2. Optimize build process
3. Consider upgrading plan

#### Free Tier Spin Down

- Free services spin down after 15 minutes of inactivity
- First request after spin down takes 30-60 seconds
- Upgrade to paid plan for always-on service

### General Issues

#### CORS Errors

Configure CORS in your backend:
```javascript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'https://your-domain.com'],
  credentials: true
}));
```

#### Database Connection Issues

1. Verify database URL is correct
2. Check firewall/IP whitelist settings
3. Ensure SSL/TLS settings match database requirements

---

## Quick Reference

### Vercel CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Render CLI Deployment

```bash
# Install Render CLI
npm i -g render

# Login
render login

# Deploy
render deploy
```

---

## Best Practices

1. **Always test builds locally** before deploying
2. **Use environment variables** for all sensitive data
3. **Enable automatic deployments** for CI/CD
4. **Set up custom domains** for production apps
5. **Monitor deployment logs** for errors
6. **Use preview deployments** to test changes before production
7. **Keep dependencies updated** to avoid security vulnerabilities

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Hosting](https://firebase.google.com/docs/hosting) (Alternative option)

---

> [!NOTE]
> This guide is tailored for Node.js/React/Vite projects. Adjust commands and configurations based on your specific project setup.
