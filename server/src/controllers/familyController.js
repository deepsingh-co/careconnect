const { v4: uuidv4 } = require('uuid');
const FamilyLink = require('../models/FamilyLink');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getMyFamily = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let links;
    if (role === 'parent') {
      links = await FamilyLink.find({ parent: userId }).populate('child', 'name email phone');
    } else {
      links = await FamilyLink.find({ child: userId }).populate('parent', 'name email phone');
    }

    res.json({ success: true, data: { links } });
  } catch (err) {
    next(err);
  }
};

exports.createInvitation = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Only parents can create invitations.' });
    }

    const code = uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await FamilyLink.create({
      parent: req.user._id,
      child: req.user._id, // placeholder — will be replaced on accept
      invitationCode: code,
      invitationExpiresAt: expires,
      status: 'pending',
    });

    // We set child = parent temporarily; on accept, we replace it.
    // A better pattern: store invitations in a separate pending collection.
    // For MVP, keep it simple and document this.

    res.status(201).json({
      success: true,
      message: 'Invitation created. Share this code with your family member.',
      data: { code, expiresAt: expires },
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptInvitation = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Invitation code required.' });

    const link = await FamilyLink.findOne({ invitationCode: code, status: 'pending' });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Invitation not found or already used.' });
    }

    if (link.invitationExpiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'Invitation has expired.' });
    }

    if (link.parent.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot accept your own invitation.' });
    }

    // Prevent duplicate links
    const existing = await FamilyLink.findOne({
      parent: link.parent,
      child: req.user._id,
      status: { $in: ['pending', 'active'] },
    });
    if (existing && existing._id.toString() !== link._id.toString()) {
      return res.status(409).json({ success: false, message: 'Already linked to this parent.' });
    }

    link.child = req.user._id;
    link.status = 'active';
    link.consentGivenAt = new Date();
    link.invitationCode = undefined;
    await link.save();

    // Notify parent
    await Notification.create({
      recipient: link.parent,
      type: 'family_link_accepted',
      title: 'Family member joined',
      body: `${req.user.name} has accepted your invitation and joined CareConnect.`,
      data: { childId: req.user._id },
    });

    res.json({ success: true, message: 'Invitation accepted. Family link is now active.' });
  } catch (err) {
    next(err);
  }
};

exports.updateConsent = async (req, res, next) => {
  try {
    const { linkId, permissions } = req.body;
    const link = await FamilyLink.findById(linkId);

    if (!link) return res.status(404).json({ success: false, message: 'Link not found.' });

    // Only the parent can update permissions
    if (link.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (permissions) link.permissions = { ...link.permissions, ...permissions };
    await link.save();

    res.json({ success: true, message: 'Consent updated.', data: { link } });
  } catch (err) {
    next(err);
  }
};
