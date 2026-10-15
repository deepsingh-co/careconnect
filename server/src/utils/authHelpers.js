const FamilyLink = require('../models/FamilyLink');

/**
 * Resolve the effective parent ID from the authenticated user.
 * - If user is a parent, return their own ID.
 * - If user is a child, look up their linked parent (from query or first active link).
 * - If user is admin, use the parentId query param.
 */
async function resolveParentId(req) {
  const { user } = req;

  if (user.role === 'parent') return user._id;

  if (user.role === 'child') {
    const parentId = req.query.parentId || req.body.parentId;
    if (parentId) {
      const link = await FamilyLink.findOne({
        parent: parentId,
        child: user._id,
        status: 'active',
      });
      return link ? link.parent : null;
    }
    // Default to first active link
    const link = await FamilyLink.findOne({ child: user._id, status: 'active' });
    return link ? link.parent : null;
  }

  if (user.role === 'admin') {
    return req.query.parentId || req.body.parentId || null;
  }

  return null;
}

/**
 * Check if a child user has an active link to a given parent.
 */
async function hasParentAccess(childId, parentId) {
  const link = await FamilyLink.findOne({
    parent: parentId,
    child: childId,
    status: 'active',
  });
  return !!link;
}

module.exports = { resolveParentId, hasParentAccess };
