// Role-based authorization. Runs after authMiddleware (which sets req.user from
// the verified JWT). Usage: router.delete("/x", authMiddleware, requireRole("owner", "admin"), ...)
export const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  next()
}
