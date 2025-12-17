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
  // NOTE: mounted at `/api/drivers`, so the incoming path here is `/...`
  // We need to forward `/api/drivers/*` -> `/drivers/*` on the driver service.
  pathRewrite: (path) => `/drivers${path}`,
});

export const vehicleProxy = createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  // NOTE: mounted at `/api/vehicles`, so the incoming path here is `/...`
  // We need to forward `/api/vehicles/*` -> `/vehicles/*` on the vehicle service.
  pathRewrite: (path) => `/vehicles${path}`,
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
