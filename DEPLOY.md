# Deploy Frontend to Vercel

You can deploy the Inventra frontend directly to Vercel with one click.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsalman192003%2FInventra&project-name=inventra-frontend&repository-name=inventra-frontend&root-directory=frontend&env=NEXT_PUBLIC_API_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Manual Setup

1.  Push this code to your GitHub repository.
2.  Go to [Vercel](https://vercel.com) and click **Add New > Project**.
3.  Import your **Inventra** repository.
4.  **Important:** Check the **Root Directory** setting. Edit it and select the `frontend` folder.
5.  Set your Environment Variables:
    *   `NEXT_PUBLIC_API_URL`: The URL of your backend (deploying elsewhere?)
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
6.  Click **Deploy**.
