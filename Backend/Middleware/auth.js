const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const cors = require('cors');

function isAdminAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.admin) {
      return next();
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.use(cors({
  origin: 'https://your-frontend-url.vercel.app', // replace with your actual Vercel URL
  credentials: true,
}));

module.exports = { isAdminAuthenticated };
