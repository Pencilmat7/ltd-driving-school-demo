# LTD Driving School Website + Booking Demo

Demo only. Do not use real customer information.

## Local
npm install
npm start
Open http://localhost:3000

Local demo admin:
Username: ltdadmin
Password: ChangeMe123!

## Render
Create a Node Web Service from this repository.
Build command: npm install
Start command: npm start
Plan: Free (demo/testing only)

Set these Environment Variables in Render:
ADMIN_USER = ltdadmin
ADMIN_PASSWORD = choose-a-strong-demo-password
SESSION_SECRET = choose-a-long-random-secret
NODE_ENV = production

Then use the generated https://YOUR-SERVICE.onrender.com URL.

Important: the demo currently stores appointments in data/db.json. Render free services have an ephemeral filesystem, so appointment data can be lost when the service restarts/redeploys/spins down. This is NOT suitable for real customer bookings until a persistent production database is added.
