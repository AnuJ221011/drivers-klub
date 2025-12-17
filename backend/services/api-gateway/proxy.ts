import { createProxyMiddleware } from 'http-proxy-middleware';

export const authProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/login': '/auth/login',
    '^/verify-otp': '/auth/verify-otp',
  },
});

export const driverProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/drivers': '/drivers',
  },
});

export const vehicleProxy = createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/vehicles': '/vehicles',
  },
});

export const assignmentProxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/assignments': '/assignments',
  },
});

export const tripProxy = createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/trips': '/trips',
  },
});

export const notificationProxy = createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/notifications',
  },
});
