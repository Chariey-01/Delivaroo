# Production deployment

The production setup uses two services:

- Render runs the Flask API and PostgreSQL database.
- Vercel builds and serves the Vite frontend.

## 1. Deploy the backend on Render

Create a PostgreSQL database and a Python web service from this repository. Use
these web service settings:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn --bind 0.0.0.0:$PORT run:app` |
| Health Check Path | `/api/health` |

On a paid Render web service, set the Pre-Deploy Command to
`flask --app run:app db upgrade`. Render does not provide that field or shell
access on Free web services. For a single-instance Free service, use this Start
Command so migrations run before Gunicorn starts:

```bash
flask --app run:app db upgrade && gunicorn --bind 0.0.0.0:$PORT run:app
```

Set these Render environment variables:

| Variable | Value |
| --- | --- |
| `FLASK_ENV` | `production` |
| `DATABASE_URL` | Render PostgreSQL internal database URL |
| `SECRET_KEY` | A long, random value |
| `JWT_SECRET_KEY` | A different long, random value |
| `CORS_ORIGINS` | The production Vercel origin, such as `https://delivaroo.vercel.app` |
| `CORS_SUPPORTS_CREDENTIALS` | `false` |
| `GOOGLE_MAPS_API_KEY` | Server-restricted Google key for Geocoding API and Routes API |
| `GOOGLE_MAPS_TIMEOUT_SECONDS` | `5` |
| `GOOGLE_MAPS_DEFAULT_REGION` | `KE` |
| `SMTP_HOST` | SMTP hostname used for password-reset email |
| `SMTP_PORT` | SMTP port, usually `587` |
| `SMTP_USERNAME` | SMTP account username |
| `SMTP_PASSWORD` | SMTP account password or provider app password |
| `SMTP_SENDER_EMAIL` | Verified sender address for password-reset email |
| `PASSWORD_RESET_URL` | Public frontend reset route, for example `https://delivaroo.vercel.app/reset-password` |

Do not include a trailing slash in `CORS_ORIGINS`. Multiple origins can be
comma-separated. After the first deploy, verify:

```bash
curl https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should be `{"status":"ok"}`.

## 2. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel and use these project settings:

| Setting | Value |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | `frontend` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set these Vercel environment variables for Production (and Preview when preview
deployments need the live API):

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Render API origin, such as `https://delivaroo-api.onrender.com` |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser-restricted key for Maps JavaScript API and Places API |
| `VITE_MAP_DEFAULT_LAT` | `-1.2921` |
| `VITE_MAP_DEFAULT_LNG` | `36.8219` |

Do not set `VITE_USE_MOCK_BACKEND` in production. Do not add `/api` or a trailing
slash to `VITE_API_URL`; the frontend adds `/api` to every request.

Deploy the Vercel project, copy its production origin, and update Render's
`CORS_ORIGINS` to that exact origin. Redeploy/restart the Render service after
changing the variable, then redeploy Vercel if any `VITE_*` variable changed.

## 3. Verify the connection

Open the deployed frontend and check the browser network panel while signing in.
Requests should go to:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/...
```

A CORS error means the current frontend origin is missing from Render's
`CORS_ORIGINS`. A 404 whose response is Vercel HTML usually means `VITE_API_URL`
was blank when the frontend was built; set it and redeploy the frontend.
