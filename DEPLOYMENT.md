# Roomie Connect Deployment Guide

This guide explains how to deploy the Roomie Connect application:
- **Frontend** on [Vercel](https://vercel.com)
- **Backend** on [Render](https://render.com)

## 1. Prerequisites

1. Your code should be pushed to a GitHub repository.
2. Sign up/Log in to [Render](https://dashboard.render.com).
3. Sign up/Log in to [Vercel](https://vercel.com).
4. Have your MongoDB URI ready (e.g., from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).

---

## 2. Deploying the Backend (Render)

We have provided a `render.yaml` file in the root directory which serves as a blueprint for the backend service.

### Option A: Blueprint Deployment (Recommended)
1. In your Render Dashboard, click **New +** and select **Blueprint**.
2. Connect your GitHub repository.
3. Render will automatically detect the `render.yaml` file.
4. During setup, it will ask for the `MONGO_URI` environment variable. Fill it in with your actual MongoDB connection string.
5. Click **Apply**. Render will start building and deploying your Node.js backend.
6. Once deployed, note the **external URL** (e.g., `https://roomie-connect-backend.onrender.com`). You will need this for the frontend!

### Option B: Manual Web Service
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Use the following settings:
   - **Name**: `roomie-connect-backend`
   - **Root Directory**: `be`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A random string for token generation
   - `PORT`: `5000`
5. Click **Create Web Service**.

---

## 3. Deploying the Frontend (Vercel)

1. In your Vercel Dashboard, click **Add New...** > **Project**.
2. Select your GitHub repository.
3. In the Configuration screen:
   - **Framework Preset**: Select `Vite`.
   - **Root Directory**: Click the `Edit` button and select the `fe` directory.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add a new variable named `VITE_API_URL`.
   - Set the value to your Render backend URL with `/api` at the end (e.g., `https://roomie-connect-backend.onrender.com/api`).
5. Click **Deploy**.
6. Vercel will build and deploy the React app. We have included a `vercel.json` inside the `fe` folder to ensure client-side routing works flawlessly.

---

## 4. Verification

1. Once both deployments are successful, open the Vercel app URL in your browser.
2. Try logging in or registering to verify that the frontend successfully communicates with the backend on Render.
3. Ensure that image uploads and other API calls are functioning correctly.

Enjoy your deployed application!
