# NEXA Admin Portal – Vercel Deployment Guide

This project is prepared for a 2-project Vercel deployment:

- `frontend` → deploy as a Vite project
- `backend` → deploy as a Flask project

## 1) Why your backend was failing
Your backend was crashing during function startup because MongoDB was initialized immediately when `app.py` was imported.
On Vercel, if import-time code throws an exception, the request ends as `FUNCTION_INVOCATION_FAILED`.

The most common trigger in this codebase was an invalid MongoDB connection string, especially:

- `MONGO_URI` still containing `<db_password>`
- no database name in the URI path
- Atlas credentials/network access not ready yet

## 2) Correct backend environment variables
Set these in the Vercel backend project:

```env
SECRET_KEY=replace-with-a-strong-secret-key
JWT_SECRET_KEY=replace-with-a-strong-jwt-secret-key
MONGO_URI=mongodb+srv://NEXA-ADMIN-2021:yourRealAtlasPassword@nexaadminportal.ujl2w0u.mongodb.net/nexa_db?retryWrites=true&w=majority&appName=NexaAdminPortal
MONGO_DB_NAME=nexa_db
DEBUG=false
FRONTEND_URL=https://your-frontend-project.vercel.app
```

## 3) Deploy backend
Create a Vercel project with:

- **Root Directory**: `backend`

Then redeploy.

Health check:

- `https://your-backend-project.vercel.app/api/health`

Expected result after fixing env:

```json
{
  "status": "ok",
  "service": "NEXA Admin Portal",
  "database": "MongoDB"
}
```

If env is still wrong, the function should now return a readable JSON error instead of crashing.

## 4) Deploy frontend
Create another Vercel project with:

- **Root Directory**: `frontend`

Set:

```env
VITE_API_URL=https://your-backend-project.vercel.app
```

Then redeploy frontend.

## 5) After frontend deploy
Copy the real frontend URL and update backend env:

```env
FRONTEND_URL=https://your-frontend-project.vercel.app
```

Then redeploy backend again so CORS is correct.

## 6) Local development
Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
