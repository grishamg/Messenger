const asyncHandler = require( 'express-async-handler' );
// const res = require( 'express/lib/response' );
const User = require( '../models/userModel' );
const generateToken = require( '../config/generateToken' )

const registerUser = asyncHandler( async ( req, res ) =>
{
    // controller for registering a user
    const { name, email, password, pic } = req.body;

    if ( !name || !email || !password )
    {
        res.status( 400 );
        throw new Error( 'Please Enter all the Fields' );
    }

    const userExists = await User.findOne( { email } ); // we are mapping users by email, it means one email can have only one user 

    if ( userExists )
    {
        res.status( 400 );
        throw new Error( 'User already exists' );
    }

    const user = await User.create( {
        name,
        email,
        password,
        pic,
    } );

    if ( user )
    {
        res.status( 201 ).json( {
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken( user._id ),
        } );
    } else
    {
        res.status( 400 );
        throw new Error( 'Failed to Create the User' );
    }

} );

const authUser = asyncHandler( async ( req, res ) =>
{
    // controller for authorizing a user 
    const { email, password } = req.body;

    const user = await User.findOne( { email } );

    if ( user && ( await user.matchPassword( password ) ) )
    {
        res.json( {
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken( user._id ),
        } );
    }
    else
    {
        res.status( 401 );
        throw new Error( 'Invalid Email or Password' );
    }
}
);
n
const allUsers = asyncHandler( async ( req, res ) =>
{
    // still a doubt , how it happens 
    const keyword = req.query.search ? {
        $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
        ]
    } : {};

    const users = await User.find( keyword ).find( { _id: { $ne: req.user._id } } );
    res.send( users );
} );

module.exports = { registerUser, authUser, allUsers };