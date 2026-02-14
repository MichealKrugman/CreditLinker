# CreditLinker - Functional Testing Checklist

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Docker Services
```bash
chmod +x start-dev.sh
./start-dev.sh
```

OR manually:
```bash
docker-compose up -d
```

### 3. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed test data
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

---

## Functional Tests (No UI Focus)

### Test 1: Routes Load (No 404s)
- [ ] http://localhost:3000 → Landing page loads
- [ ] http://localhost:3000/login → Login page loads
- [ ] http://localhost:3000/signup → Signup page loads
- [ ] http://localhost:3000/dashboard → Redirects to login (not authenticated)

### Test 2: User Registration
- [ ] Go to /signup
- [ ] Fill form:
  - Business Name: "Test Pharmacy"
  - Industry: "PHARMACY"
  - Email: "test@example.com"
  - Password: "password123"
  - Confirm Password: "password123"
- [ ] Click "Sign Up"
- [ ] Should redirect to /login
- [ ] Check terminal for errors

### Test 3: User Login
- [ ] Go to /login
- [ ] Enter credentials from Test 2
- [ ] Click "Login"
- [ ] Should redirect to /dashboard
- [ ] Check terminal for errors

### Test 4: Dashboard Access
- [ ] After login, should see dashboard
- [ ] Check if these routes work:
  - [ ] /dashboard → Main dashboard
  - [ ] /dashboard/upload → Upload page
  - [ ] /dashboard/transactions → Transactions page
  - [ ] /dashboard/analytics → Analytics page

### Test 5: File Upload (Basic)
- [ ] Go to /dashboard/upload
- [ ] Try to upload a CSV file
- [ ] Check terminal for processing logs
- [ ] Check MinIO console (http://localhost:9001) for uploaded file

### Test 6: API Endpoints
- [ ] After uploading data, test:
  - [ ] GET /api/metrics → Should return metrics
  - [ ] GET /api/scores → Should return identity score
  - [ ] GET /api/transactions → Should return transactions

### Test 7: Data Display
- [ ] Go to /dashboard
- [ ] Check if score displays (even as 0)
- [ ] Check if metrics cards show
- [ ] Check if insights section appears

---

## Common Issues & Fixes

### Issue: "npm install" fails
**Fix:** Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue: Database connection error
**Fix:** 
1. Check Docker: `docker-compose ps`
2. Ensure postgres is running
3. Check DATABASE_URL in .env matches docker-compose.yml

### Issue: Prisma errors
**Fix:**
```bash
npx prisma generate
npx prisma db push --force-reset
```

### Issue: MinIO connection error
**Fix:**
1. Check MinIO is running: `docker-compose ps`
2. Visit http://localhost:9001 to verify MinIO console loads
3. Login with creditlink_minio / creditlink_minio_secret_key_2024

### Issue: NextAuth errors
**Fix:**
1. Verify NEXTAUTH_SECRET is set in .env
2. Restart dev server: `npm run dev`

### Issue: Redis connection error
**Fix:**
1. Check Redis: `docker-compose ps`
2. Test connection: `docker exec -it creditlinker-redis redis-cli ping`
   Should return "PONG"

---

## Debug Commands

```bash
# Check all Docker services
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs minio
docker-compose logs redis

# Restart a specific service
docker-compose restart postgres

# Stop all services
docker-compose down

# Nuclear option (delete all data and restart)
docker-compose down -v
docker-compose up -d
```

---

## What Should Work (Functionality-Wise)

✅ User can register
✅ User can login
✅ User sees dashboard after login
✅ User can access all dashboard routes
✅ User can upload files
✅ Files are stored in MinIO
✅ Transactions are parsed and stored
✅ Metrics are calculated
✅ Identity score is calculated
✅ Data displays on dashboard

---

## Next Steps After Functional Testing

Once all functional tests pass:
1. Fix UI/styling (Tailwind CSS)
2. Add proper error messages
3. Improve forms with validation
4. Add loading states
5. Polish dashboard design

---

**Focus:** Get the CORE FUNCTIONALITY working first. UI polish comes later!
