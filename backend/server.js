const express = require( 'express' );
const { chats } = require( './data/data' );
const dotenv = require( 'dotenv' );
const connectDB = require( './config/db' );
const colors = require( 'colors' );
const { notFound, errorHandler } = require( './middleware/errorMiddleware' )
dotenv.config();
connectDB();
const app = express();
const userRoutes = require( './routes/userRoutes' )
const chatRoutes = require( './routes/chatRoutes' )

app.use( express.json() ); // to accept json data 

app.get( '/', ( req, res ) =>
{
    res.send( "API IS running" )
} );

app.use( '/api/user', userRoutes )
app.use( '/api/chat', chatRoutes )

app.use( notFound )
app.use( errorHandler )


const PORT = process.env.PORT || 5000;

app.listen( PORT, console.log( `Server started on port ${ PORT }`.yellow.bold ) )