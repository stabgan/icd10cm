# Deployment Instructions for InfinityFree

This document explains how to deploy the ICD-10-CM Browser to InfinityFree hosting.

## Prerequisites

- Node.js and npm installed locally
- FTP client (such as FileZilla, WinSCP, or similar)

## Step 1: Build the Project

1. Open a terminal in the project root directory
2. Run the build command:
   ```
   npm run build
   ```
3. This will create a `dist` folder containing all the files needed for deployment

## Step 2: Prepare for Deployment

1. The `dist` folder contains:
   - index.html
   - assets/ folder (with CSS, JS, and other assets)
   - data/ folder (with ICD-10 code data)

2. Make sure all paths in the built files are relative (they should be if base: './' is set in vite.config.js)

## Step 3: Upload to InfinityFree

1. Connect to your InfinityFree account using FTP:
   - Host: ftpupload.net
   - Username: if0_38542495
   - Password: Kg270898
   - Port: 21

2. Navigate to the public_html directory:
   - /htdocs or /public_html (depending on InfinityFree's setup)

3. Upload the entire contents of your `dist` folder to this directory

## Step 4: Verify Deployment

1. Visit your website at the InfinityFree domain
2. Test the following functionality:
   - Search for ICD codes
   - View code details
   - Download PDFs
   - Toggle between light and dark mode

## Troubleshooting

If you encounter issues:

1. **404 errors for assets**: Check that paths are relative (./assets/ not /assets/)
2. **API errors**: Make sure data files are uploaded to the correct location
3. **Routing issues**: Verify that your .htaccess file is uploaded (see below)

## .htaccess Configuration for SPA

Create a file named `.htaccess` in the `dist` folder with the following content before uploading:

```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

This redirects all routes to index.html, making the SPA work correctly.

## Contact

If you need help with deployment, contact Musafir, Lord of the Night and King of all animals 👑🦁 