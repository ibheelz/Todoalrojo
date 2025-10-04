# 🚀 Render Deployment Guide for CRM System

## Repository Information
- **GitHub Repo**: `https://github.com/ibheelz/Todoalrojo.git`
- **Branch**: `CRM`
- **Service Path**: `/crm-system`
- **Target Domain**: `crm.mieladigital.com`

## 📋 Deployment Steps

### 1. Create Render Service
1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `ibheelz/Todoalrojo`
4. Configure the service:
   - **Name**: `miela-digital-crm`
   - **Branch**: `CRM`
   - **Root Directory**: `crm-system`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2. Database Setup
1. In Render dashboard, create a PostgreSQL database:
   - **Name**: `miela-digital-db`
   - **Database Name**: `miela_digital_crm`
   - **Plan**: `Starter` (free)

### 3. Environment Variables
Set these in Render dashboard:

```bash
NODE_ENV=production
DATABASE_URL=[Auto-generated from database]
NEXTAUTH_URL=https://crm.mieladigital.com
NEXTAUTH_SECRET=[Auto-generate secure value]
JWT_SECRET=[Auto-generate secure value]
```

### 4. Custom Domain Setup
1. In your service settings, go to "Custom Domains"
2. Add domain: `crm.mieladigital.com`
3. Update your DNS settings:

#### DNS Configuration
Add these records to your `mieladigital.com` DNS:

```
Type: CNAME
Name: crm
Value: [your-render-app].onrender.com
TTL: 300
```

### 5. Production Configuration
The following files are already configured:
- ✅ `render.yaml` - Service configuration
- ✅ `Dockerfile` - Container setup
- ✅ `next.config.js` - Next.js production settings
- ✅ `package.json` - Build scripts

## 🔧 Post-Deployment Steps

### 1. Database Migration
After deployment, run database migrations:
```bash
# This will be handled automatically by the build process
npm run db:push
```

### 2. Seed Initial Data
```bash
npm run db:seed
```

### 3. Verify Deployment
1. Check health endpoint: `https://crm.mieladigital.com/api/health`
2. Test login with default credentials:
   - Email: `admin@todoalrojo.com`
   - Password: `admin123`

## 🌐 Production URLs
- **Main App**: `https://crm.mieladigital.com`
- **Health Check**: `https://crm.mieladigital.com/api/health`
- **API Docs**: `https://crm.mieladigital.com/api`

## 🔍 Monitoring & Logs
- **Render Dashboard**: Monitor deployments and logs
- **Health Endpoint**: Automated health checks
- **Database**: PostgreSQL metrics in Render dashboard

## 🛠 Troubleshooting

### Common Issues
1. **Build Failures**: Check Render logs for specific errors
2. **Database Connection**: Verify DATABASE_URL is correct
3. **Environment Variables**: Ensure all required vars are set
4. **Custom Domain**: DNS propagation may take up to 24 hours

### Useful Commands
```bash
# Check service status
curl https://crm.mieladigital.com/api/health

# View recent logs (in Render dashboard)
# Navigate to: Service → Logs
```

## 📊 Service Configuration Summary
- **Plan**: Starter (Free tier)
- **Auto-Deploy**: Enabled on `CRM` branch pushes
- **Health Check**: `/api/health`
- **Database**: PostgreSQL Starter
- **Custom Domain**: `crm.mieladigital.com`

## 🚀 Next Steps After Deployment
1. Configure email settings for user notifications
2. Set up monitoring and alerts
3. Configure backup strategy
4. Set up staging environment if needed
5. Configure CI/CD pipeline for automated testing