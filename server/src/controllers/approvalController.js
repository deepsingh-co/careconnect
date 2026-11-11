const approvalService = require('../services/approvalService');
const deliveryService = require('../services/deliveryService');

exports.list = async (req, res, next) => {
  try {
    const approvals = await approvalService.listApprovals(req.user, {
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({ success: true, data: { approvals } });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const approval = await approvalService.getApproval(req.user, req.params.id);
    res.json({ success: true, data: { approval } });
  } catch (err) {
    next(err);
  }
};

exports.respond = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    if (!['approve', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approve or decline.' });
    }

    const result = await approvalService.respondToApproval({
      approvalId: req.params.id,
      action,
      reason,
      responder: req.user,
    });

    // Re-read through the safe projection so the OTP hash never leaves the server.
    const approval = await approvalService.getApproval(req.user, req.params.id);
    res.json({
      success: true,
      data: { approval, message: result.childMessage, handoffUrl: result.handoffUrl || null },
    });
  } catch (err) {
    next(err);
  }
};

/** Rotate and return a fresh delivery-partner handoff link. */
exports.createHandoff = async (req, res, next) => {
  try {
    const handoff = await deliveryService.issueHandoffLink(req.user, req.params.id);
    res.json({ success: true, data: handoff });
  } catch (err) {
    next(err);
  }
};
