import './App.css';
import { Route } from 'react-router-dom'
import HomePage from './Pages/HomePage';
import ChatPage from './Pages/ChatPage';
import ChatProvider from './Context/ChatProvider';

function App ()
{
  return (
    <div className="App">
      <ChatProvider>
        <Route path='/' component={ HomePage } exact />
        <Route path='/chats' component={ ChatPage } />
      </ChatProvider>
    </div>
  );
}

export default App;
