const asyncHandler = require( "express-async-handler" );
const Chat = require( "../models/chatModel" );
const User = require( "../models/userModel" );

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected

const accessChat = asyncHandler( async ( req, res ) =>
{
    const { userId } = req.body; 
 
    if ( !userId )
    {
        // if this id does not exist
        console.log( "UserId param not sent with request" );
        return res.sendStatus( 400 );
    }

    var isChat = await Chat.find( {
        // now find the chat, because it exists 
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    } )
        .populate( "users", "-password" )
        .populate( "latestMessage" );

    isChat = await User.populate( isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    } );

    if ( isChat.length > 0 )
    {
        // there is only one object in this array as only 1 chat can exist between these users, that we matched earlier
        // length > 0, so this means chat exists and we dont need to create more
        res.send( isChat[ 0 ] );
    }
    else
    {
        // here we have to create a new chat 
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [ req.user._id, userId ],
            // we are trying to create a chat between userID(the other user i want to chat with )
        };

        try
        {
            const createdChat = await Chat.create( chatData );
            const FullChat = await Chat.findOne( { _id: createdChat._id } ).populate(
                "users",
                "-password"
            );
            res.status( 200 ).send( FullChat );
        } catch ( error )
        {
            res.status( 400 );
            throw new Error( error.message );
        }
    }
} );

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler( async ( req, res ) =>
{
    try
    {
        Chat.find( { users: { $elemMatch: { $eq: req.user._id } } } )
            .populate( "users", "-password" )
            .populate( "groupAdmin", "-password" )
            .populate( "latestMessage" )
            .sort( { updatedAt: -1 } )
            .then( async ( results ) =>
            {
                results = await User.populate( results, {
                    path: "latestMessage.sender",
                    select: "name pic email",
                } );
                res.status( 200 ).send( results );
            } );
    } catch ( error )
    {
        res.status( 400 );
        throw new Error( error.message );
    }
} );

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler( async ( req, res ) =>
{
    if ( !req.body.users || !req.body.name )
    {
        // at starting we need to have the name of the group and name of the contacts to be added in the group, if we dont find any of it , send error message
        return res.status( 400 ).send( { message: "Please Fill all the feilds" } );
    }

    var users = JSON.parse( req.body.users );

    if ( users.length < 2 )
    {
        return res
            .status( 400 )
            .send( "More than 2 users are required to form a group chat" );
    }

    users.push( req.user );

    try
    {
        const groupChat = await Chat.create( {
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        } );

        const fullGroupChat = await Chat.findOne( { _id: groupChat._id } )
            .populate( "users", "-password" )
            .populate( "groupAdmin", "-password" );
            // we have created the chat , now we need to populate it
        res.status( 200 ).json( fullGroupChat );
    } catch ( error )
    {
        res.status( 400 );
        throw new Error( error.message );
    }
} );

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler( async ( req, res ) =>
{
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName: chatName,
        },
        {
            new: true,
        }
    )
        .populate( "users", "-password" )
        .populate( "groupAdmin", "-password" );

    if ( !updatedChat )
    {
        res.status( 404 );
        throw new Error( "Chat Not Found" );
    } else
    {
        res.json( updatedChat );
    }
} );

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler( async ( req, res ) =>
{
    const { chatId, userId } = req.body;

    // check if the requester is admin

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            // push is for putting, we use pull to remove 
            $pull: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate( "users", "-password" )
        .populate( "groupAdmin", "-password" );

    if ( !removed )
    {
        res.status( 404 );
        throw new Error( "Chat Not Found" );
    } else
    {
        res.json( removed );
    }
} );

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected

const addToGroup = asyncHandler( async ( req, res ) =>
{
    const { chatId, userId } = req.body;

    // check if the requester is admin

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate( "users", "-password" )
        .populate( "groupAdmin", "-password" );

    if ( !added )
    {
        res.status( 404 );
        throw new Error( "Chat Not Found" );
    } else
    {
        res.json( added );
    }
} );

module.exports = {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
};