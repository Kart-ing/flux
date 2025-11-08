# Starting Quorum Dashboard

You have **three options** for starting the Quorum Dashboard:

## Option 1: Start Both in One Terminal (Recommended)

Run both backend and frontend in the same terminal using `concurrently`:

```bash
./start.sh
```

This will:
- Activate the Python virtual environment
- Start the Flask backend on `http://localhost:5001`
- Start the Next.js frontend on `http://localhost:3000`
- Show colored output from both services
- Stop both when you press `Ctrl+C`

## Option 2: Start in Separate Terminals

If you prefer separate terminals for better log separation:

### Terminal 1 - Backend:
```bash
./start-backend.sh
```

### Terminal 2 - Frontend:
```bash
./start-frontend.sh
```

## Option 3: Use npm Scripts Directly

From the `quorum-dashboard` directory:

```bash
# Start both
npm run dev:all

# Or start individually
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
```

## Notes

- Make sure you have the Python virtual environment set up in the root `venv/` directory
- Make sure npm dependencies are installed (`npm install` in `quorum-dashboard/`)
- Backend runs on port **5001**
- Frontend runs on port **3000**

