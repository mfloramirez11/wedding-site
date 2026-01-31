<<<<<<< HEAD
# Manny & Celesti Wedding Website

Wedding invitation website for mannyandcelesti.com

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to this directory:
```bash
cd wedding-site
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts and link to your Vercel account

5. For production deployment with custom domain:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import this directory (you can drag and drop or connect to Git)
4. Vercel will auto-detect the static site
5. Click "Deploy"

### Custom Domain Setup

After deploying:

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add `mannyandcelesti.com` and `www.mannyandcelesti.com`
4. Vercel will provide you with DNS records to add to your domain registrar:
   - Add an A record pointing to Vercel's IP: `76.76.21.21`
   - Or add a CNAME record pointing to your Vercel deployment
5. Wait for DNS propagation (usually 5-30 minutes)

## File Structure

```
wedding-site/
├── index.html       # Main wedding invitation page
├── vercel.json      # Vercel configuration
└── README.md        # This file
```

## Features

- Elegant botanical-themed wedding invitation
- Animated photo scrollers with your favorite memories
- Responsive design (mobile-friendly)
- Navigation for His Story, Her Story, and Registry (to be implemented)

## Future Enhancements

The navigation links (His Story, Her Story, Registry) are ready for you to add content pages:
- Create `his-story.html`
- Create `her-story.html`
- Create `registry.html`

Or implement as single-page sections with smooth scrolling.

## Notes

- All images are embedded as base64 in the HTML for portability
- No external dependencies except Google Fonts
- Site is fully static (no backend required)
- File size is ~7-8MB due to embedded images
=======
# wedding-site
>>>>>>> 3bb34f309f7a87f7654ec767a65b6ce3c3777fec
