import crypto from 'crypto';

import asyncHandler from '../middleware/asyncHandler.middleware.js';
import User from '../models/user.model.js';
import AppError from '../utils/error.util.js';
import { razorpay } from '../server.js';
import Payment from '../models/payment.model.js';

export const buySubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);

  if (!user) {
    console.log("No user found");
    return next(new AppError('Unauthorized, please login', 404));
  }

  if (user.role === 'ADMIN') {
    console.log(" Admin tried subscribing");
    return next(new AppError('Admin cannot purchase a subscription', 400));
  }

  try {
    if (!process.env.RAZORPAY_PLAN_ID) {
      console.log("Plan ID is missing in environment");
      return next(new AppError("Razorpay Plan ID not configured", 500));
    }

    console.log("Creating Razorpay subscription...");
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      subscription_id: subscription.id,
    });
  } catch (err) {
    console.error("Razorpay subscription error:", err?.error || err); 
    return next(new AppError(err?.error?.description || err.message || "Something went wrong in subscription", 500));
  }
});

export const verifySubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;


  const user = await User.findById(id);
  const subscriptionId = user.subscription.id;
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(`${razorpay_payment_id}|${subscriptionId}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment not verified, please try again.', 400));
  }

  await Payment.create({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  user.subscription.status = 'active';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
});

export const cancelSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;

  const user = await User.findById(id);

  if (user.role === 'ADMIN') {
    return next(
      new AppError('Admin does not need to cannot cancel subscription', 400)
    );
  }
  const subscriptionId = user.subscription.id;
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId 
    );
    user.subscription.status = subscription.status;
    await user.save();
  } catch (error) {
    
    return next(new AppError(error.error.description, error.statusCode));
  }
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });
  const timeSinceSubscribed = Date.now() - payment.createdAt;
  const refundPeriod = 14 * 24 * 60 * 60 * 1000;

  if (refundPeriod <= timeSinceSubscribed) {
    return next(
      new AppError(
        'Refund period is over, so there will not be any refunds provided.',
        400
      )
    );
  }

  await razorpay.payments.refund(payment.razorpay_payment_id, {
    speed: 'optimum',
  });

  user.subscription.id = undefined;
  user.subscription.status = undefined;

  await user.save();
  await payment.remove();

  
  res.status(200).json({
    success: true,
    message: 'Subscription canceled successfully',
  });
});

export const getRazorpayApiKey = asyncHandler(async (_req, res, _next) => {
  res.status(200).json({
    success: true,
    message: 'Razorpay API key',
    key: process.env.RAZORPAY_KEY_ID,
  });
});


export const allPayments = asyncHandler(async (req, res, _next) => {
  const { count, skip } = req.query;

  const allPayments = await razorpay.subscriptions.all({
    count: count ? count : 10, 
    skip: skip ? skip : 0,
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const finalMonths = {
    January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
  };

  const monthlyWisePayments = allPayments.items.map((payment) => {
    const monthsInNumbers = new Date(payment.start_at * 1000);

    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.map((month) => {
    Object.keys(finalMonths).forEach((objMonth) => {
      if (month === objMonth) {
        finalMonths[month] += 1;
      }
    });
  });

  const monthlySalesRecord = [];

  Object.keys(finalMonths).forEach((monthName) => {
    monthlySalesRecord.push(finalMonths[monthName]);
  });

  res.status(200).json({
    success: true,
    message: 'All payments',
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });
});
