const authController = require('../controllers/authControllers');
const router = require('express').Router();

router.post('/signup', authController.signupController);
router.post('/login', authController.loginController);
router.get('/refresh', authController.refreshAccessTokenController);
router.post('/logout', authController.logoutController);

module.exports = router;
