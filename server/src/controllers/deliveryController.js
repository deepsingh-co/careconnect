const deliveryService = require('../services/deliveryService');

/** Public: delivery partner opens the secure handoff link. */
exports.getHandoff = async (req, res, next) => {
  try {
    const handoff = await deliveryService.getHandoffView(req.params.token);
    res.json({ success: true, data: { handoff } });
  } catch (err) {
    next(err);
  }
};

/** Public: delivery partner submits the 4-digit OTP at handover. */
exports.verifyOtp = async (req, res, next) => {
  try {
    const verification = await deliveryService.verifyHandoffOtp(
      req.params.token,
      req.body?.otp,
      { ip: req.ip, userAgent: req.get('user-agent') }
    );
    res.json({ success: true, data: { verification } });
  } catch (err) {
    next(err);
  }
};
