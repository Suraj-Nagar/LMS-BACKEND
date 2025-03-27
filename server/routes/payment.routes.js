import { Router } from "express";
import {buySubscription, cancelSubscription, getRazorpayApikey, verifySubscription,allpayment } from "../controllers/payment.controller.js";
import { authorizedRoles, isLoggedIn } from "../middleware/auth.middleware.js";
const router =Router();
router
    .route('/razorpay-key')
    .get(
        isLoggedIn,
        getRazorpayApikey
    );

router
    .route('/subscription')
    .post(
        isLoggedIn,
        buySubscription
    );

router  
    .route('/verify')
    .post(
        isLoggedIn,
        verifySubscription
    );
router
    .route('/unsubscribe')
    .post(
        isLoggedIn,
        cancelSubscription
    );
router
    .route('/')
    .get(
        isLoggedIn,
        authorizedRoles,
        allpayment
    );
    
export default router;
