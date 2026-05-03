# Sattumakhana Website

This is a self-contained first version of the Sattumakhana online storefront.

## Open the site

Open `index.html` in a browser.

## What is included

- Product catalogue
- Cart with quantity controls
- Customer delivery form
- UPI, cash on delivery, and Razorpay-ready payment choices
- WhatsApp order handoff for non-gateway orders

## Before launch

Edit `app.js`:

- Replace `phone` with your WhatsApp business number.
- Replace `upiId` with your real UPI ID.
- Replace `razorpayKeyId` with your Razorpay key ID.

For live card/UPI gateway payments, add a backend server that creates Razorpay orders and verifies payment signatures. Do not rely only on frontend confirmation for dispatching paid orders.
