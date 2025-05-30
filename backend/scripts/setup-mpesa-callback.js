#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to update .env file
function updateEnvFile(callbackUrl) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add MPESA_CALLBACK_URL
  if (envContent.includes('MPESA_CALLBACK_URL=')) {
    envContent = envContent.replace(
      /MPESA_CALLBACK_URL=.*/,
      `MPESA_CALLBACK_URL=${callbackUrl}`
    );
  } else {
    envContent += `\nMPESA_CALLBACK_URL=${callbackUrl}`;
  }

  // Write back to .env file
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log(`Updated MPESA_CALLBACK_URL in .env file to: ${callbackUrl}`);
}

// Function to get ngrok public URL
function getNgrokUrl() {
  try {
    const ngrokApi = 'http://127.0.0.1:4040/api/tunnels';
    const response = execSync(`curl -s ${ngrokApi}`);
    const tunnels = JSON.parse(response).tunnels;
    const httpsTunnel = tunnels.find(t => t.proto === 'https');
    
    if (httpsTunnel) {
      return httpsTunnel.public_url;
    }
    throw new Error('No HTTPS tunnel found');
  } catch (error) {
    console.error('Error getting ngrok URL:', error.message);
    console.error('Make sure ngrok is running with: ngrok http 3000');
    process.exit(1);
  }
}

// Function to handle static subdomain
function handleStaticSubdomain(subdomain) {
  return `https://${subdomain}/api/mpesa/callback`;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  let callbackUrl;

  if (args[0] === '--ngrok') {
    if (args[1] === '--static') {
      // Handle static subdomain
      if (!args[2]) {
        console.error('Please provide the static subdomain');
        process.exit(1);
      }
      callbackUrl = handleStaticSubdomain(args[2]);
    } else {
      // Get URL from dynamic ngrok tunnel
      const ngrokUrl = getNgrokUrl();
      callbackUrl = `${ngrokUrl}/api/mpesa/callback`;
    }
  } else if (args[0] === '--url') {
    // Use provided URL
    callbackUrl = args[1];
    if (!callbackUrl) {
      console.error('Please provide a URL with --url option');
      process.exit(1);
    }
  } else {
    console.log(`
Usage:
  Development (dynamic):     npm run setup-mpesa-callback -- --ngrok
  Development (static):      npm run setup-mpesa-callback -- --ngrok --static your-subdomain.ngrok-free.app
  Production:               npm run setup-mpesa-callback -- --url https://your-domain.com
    `);
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(callbackUrl);
  } catch (error) {
    console.error('Invalid URL format:', callbackUrl);
    process.exit(1);
  }

  // Update .env file
  updateEnvFile(callbackUrl);
}

main(); 