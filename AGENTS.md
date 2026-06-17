# AGENTS.md

## Cursor Cloud specific instructions

SuruAhai is a 3-role home-services marketplace (USER / MITRA / ADMIN) with:
- **Backend**: FastAPI ASGI app in `backend/server.py`, talks to MongoDB via PyMongo. Served on port **8001**.
- **Frontend**: Create React App (`react-scripts`), dev server on port **3000** (`frontend/`).
- **Database**: local MongoDB 8.0 (`mongod`) on `127.0.0.1:27017`.

The update script only refreshes Python/npm dependencies. MongoDB (the `mongodb-org`
package + the self-signed TLS cert under `/etc/mongodb-tls/`) is installed in the VM
snapshot and is **not** reinstalled on startup. You must start the services yourself.

### Critical gotcha — MongoDB MUST be reached over TLS
`server.py` connects with `MongoClient(MONGO_URL, tlsCAFile=certifi.where())`. Passing
`tlsCAFile` **forces TLS on every connection**, and PyMongo rejects `tls=false` while it
is set. So a plain non-TLS `mongod` will fail with `SSL handshake failed`. Therefore:
- Start `mongod` with TLS using the pre-generated self-signed cert in `/etc/mongodb-tls/`.
- `MONGO_URL` must enable TLS and skip cert/hostname validation (self-signed):
  `mongodb://127.0.0.1:27017/?tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true`

### Start the services
1. **MongoDB** (TLS, in a long-lived tmux/background session; data persists in `/var/lib/mongodb`):
   ```
   mongod --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --port 27017 \
     --tlsMode requireTLS --tlsCertificateKeyFile /etc/mongodb-tls/mongo.pem \
     --tlsCAFile /etc/mongodb-tls/mongo-cert.pem --tlsAllowConnectionsWithoutCertificates
   ```
   If `/etc/mongodb-tls/` is missing (fresh VM), regenerate:
   ```
   sudo mkdir -p /etc/mongodb-tls && sudo chown $USER /etc/mongodb-tls && cd /etc/mongodb-tls
   openssl req -x509 -newkey rsa:2048 -days 3650 -nodes -keyout mongo-key.pem -out mongo-cert.pem \
     -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"
   cat mongo-key.pem mongo-cert.pem > mongo.pem && chmod 600 mongo.pem
   ```
2. **Backend** — `server.py` has **no `__main__`/uvicorn block**; the README's
   `python server.py` does nothing. Run with uvicorn from `backend/` so `load_dotenv()`
   picks up `backend/.env`. Console scripts live in `~/.local/bin` (not on PATH), so call
   the module form:
   ```
   cd backend && python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
   ```
   `backend/.env` (gitignored) holds the local `MONGO_URL` (TLS, see above), `DB_NAME`,
   and JWT settings. If it is missing, recreate it from `backend/env.example` but with the
   local TLS `MONGO_URL`.
3. **Seed the DB** once the backend is up: `curl -X POST http://127.0.0.1:8001/api/seed`.
   Demo accounts: `admin@suruahai.com/admin123`, `user@suruahai.com/user123`,
   `mitra@suruahai.com/mitra123`.
4. **Frontend** — it is Create React App, **not** Vite (the README is outdated; ignore the
   Vite/5173 references). The frontend calls the backend at `http://127.0.0.1:8001` by default.
   ```
   cd frontend && BROWSER=none PORT=3000 npm start
   ```

### Tests / lint / build
- Backend integration tests (backend must be running): `API_BASE_URL="http://127.0.0.1:8001" python3 backend_test.py` (uses `requests`).
- Frontend lint runs automatically during `npm start` / `npm run build` (CRA + eslint `react-app`). Use `CI=false npm run build` to verify a production build.

### npm note
`npm ci` fails because `frontend/package-lock.json` is out of sync with `package.json`.
Use `npm install` instead (this is what the update script does).
