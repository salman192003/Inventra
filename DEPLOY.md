# Inventra Deployment Guide

This repository includes a `render.yaml` file to automate deployment on Render.
Follow these steps to deploy the full stack.

## 1. Create a Render Account
Go to [render.com](https://render.com) and sign up.

## 2. New Blueprint Instance
1. In the Render Dashboard, click **New +** and select **Blueprint**.
2. Connect your GitHub/GitLab repository.
3. Select this repository.
4. Render will detect the `render.yaml` file and show the 4 services to be created:
   - `inventra-db` (Postgres Database)
   - `inventra-backend` (Node Web Service)
   - `inventra-ai` (Node Web Service)
   - `inventra-frontend` (Node Web Service)

## 3. Set Environment Variables
Render will ask for values for variables marked as `sync: false` or those without defaults.
Fill them in:

### Backend
- `JWT_SECRET`: (Render can auto-generate this, or set your own)
- `SUPABASE_URL`: Your Supabase Project URL
- `SUPABASE_ANON_KEY`: Your Supabase Public Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Secret Key
- `AI_SERVICE_API_KEY`: Set a secret string (e.g., `my-secret-key-123`). This must match `API_KEY` in the AI Service.
- `GEMINI_API_KEY`: Google Gemini API Key (if used for reporting)

### AI Service
- `API_KEY`: The same secret string as `AI_SERVICE_API_KEY`.
- `OPENAI_API_KEY`: Your OpenAI API Key.

### Frontend
- `NEXT_PUBLIC_SUPABASE_URL`: Same as Backend `SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Same as Backend `SUPABASE_ANON_KEY`.

## 4. Deploy & Database Setup
Click **Approve** to start the deployment.

Once the Database is running, you must enable the required extensions.
1. Go to the **dashboard** for your new database (`inventra-db`).
2. Click the **Connect** button, copy the `External Connection String` or `PSQL Command`.
3. Connect using a terminal or tool (like TablePlus) and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "pgvector";
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
   *(Note: You can also use the "Internal Connection String" from a shell inside one of your services running on Render)*

## 5. Migrations
The backend start command includes `npx prisma migrate deploy`.
However, if the first deploy fails because the DB wasn't ready, you can manually trigger a deploy of the backend service again.

## 6. Final Checks
- Visit the Frontend URL (provided by Render).
- Check Backend logs for startup success.
- Check AI Service logs.

---
**Note:** If you use Supabase as your main database instead of Render's managed Postgres:
1. Delete the `inventra-db` entry from `render.yaml`.
2. Manually set `DATABASE_URL` and `DIRECT_URL` in Backend and AI Service to your Supabase connection string.
