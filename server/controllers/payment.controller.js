import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import { razorpay } from "../server.js";
export const getRazorpayApikey = async (req, res, next) => {
    //return razorpay key to client 
    res.status(200).json({
        success: true,
        message: "Razor pay API key",
        key: process.env.RAZORPAY_KEY_ID
    });
}
export const buySubscription = async (req, res, next) => {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('unauthorized,please login again', 404))
    }
    if (user.role == 'ADMIN') {
        return next(new AppError('Admin cannot purchase a subscription', 404))
    }
    //create subscription using razorpay.subscription.create method
    const subscription = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PALN_ID,
        //after created successfully notify to user
        customer_notify: 1
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();
    res.status(200).json({
        success: true,
        message: 'subscribe sucessfully',
        subscription_id: subscription.id
    });
}

export const verifySubscription = async (req, res, next) => {
    const { id } = req.user;
    const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;
    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('Unauthorize please login again'));
    }
    const subscriptionId = user.subscription.id;
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${subscription_id}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        return next(new AppError('payment not done'));
    }
    await Payment.create({
        razorpay_payment_id,
        razorpay_signature,
        razorpay_subscription_id,
    });

    user.subscription.status = 'active';
    await user.save();
    res.status(200).json({
        sucess: true,
        message: 'payment verified sucessfully!'
    });

};

export const cancelSubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id)
        if (!user) {
            return next(new AppError('Unauthorize please login again'));
        }
        if (user.role === 'ADMIN') {
            return next(new AppError('admin can not cancel a subscription', 404))
        }

        const subscriptionId = user.subscription.id;
        const subscription = await razorpay.subscriptions.cancel(
            subscriptionId
        )

        user.subscription.status = subscription.status;

        await user.save();
    } catch (error) {
        return next(new AppError(error.message, 404));
    }       


}


export const allpayment = async (req, res, next) => {
    const {count}=req.query;
    const subscriptions=await razorpay.subscriptions.all({
        count:count ||10,
    });
    res.status(200).json({
        success:true,
        message:'all payments',
        subscriptions
    })
};