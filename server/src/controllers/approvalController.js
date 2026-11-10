const approvalService = require('../services/approvalService');

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
      data: { approval, message: result.childMessage },
    });
  } catch (err) {
    next(err);
  }
};
