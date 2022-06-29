const express = require( 'express' )
const router = express.Router();
const { protect } = require( "../middleware/authMiddleware" );
const { registerUser, authUser, allUsers } = require( '../controllers/userControllers' )
router.route( '/' ).post( registerUser ).get( protect, allUsers );
router.route( '/login' ).post( authUser )

module.exports = router;