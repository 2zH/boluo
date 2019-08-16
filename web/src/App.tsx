import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Link, Redirect, Route } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import './App.css';
import { gql } from 'apollo-boost';
import { TOKEN_KEY } from './settings';

interface User {
  id: string;
  nickname: string;
}

function Index() {
  return <h2>Home</h2>;
}

function Register() {
  return <h2>Register</h2>;
}

type InputChangeHandler = React.ChangeEventHandler<HTMLInputElement>;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginFailure, setLoginFailure] = useState(false);
  const userState = useUserState();

  const handleEmail: InputChangeHandler = e => {
    setEmail(e.currentTarget.value);
  };

  const handlePassword: InputChangeHandler = e => {
    setPassword(e.currentTarget.value);
  };

  const setToken = (result: { token: string }) => {
    if (result.token) {
      localStorage.setItem(TOKEN_KEY, result.token);
      location.reload();
    }
  };

  const submitLogin: React.MouseEventHandler = e => {
    e.preventDefault();
    fetch(process.env.LOGIN_URL || '', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'content-type': 'application/json' },
    }).then(response => {
      if (response.status === 401) {
        setLoginFailure(true);
      } else {
        response.json().then(setToken);
      }
    });
  };

  if (isUserLoading(userState)) {
    return null;
  } else if (isLoggedIn(userState)) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <h2>Login</h2>
      <form>
        {loginFailure ? <p>Login Failed</p> : null}
        <p>
          <label htmlFor="email">Email: </label>
          <input type="email" value={email} onChange={handleEmail} />
        </p>
        <p>
          <label htmlFor="password">Password: </label>
          <input type="password" value={password} onChange={handlePassword} />
        </p>
        <p>
          <input type="submit" value="Login" onClick={submitLogin} />
        </p>
      </form>
    </>
  );
}

type UserState = 'guest' | 'loading' | User;

const UserContext = React.createContext<UserState>('guest');

const isUserLoading = (state: UserState): state is 'loading' => state === 'loading';
const isGuest = (state: UserState): state is 'guest' => state === 'guest';
const isLoggedIn = (state: UserState): state is User => state !== 'guest' && state !== 'loading';

const useUserState = () => {
  return useContext(UserContext);
};

const useGetMe = () => {
  const [userState, setUserState] = useState<UserState>('guest');
  const { loading, error, data } = useQuery<{ getMe: User }>(
    gql`
      {
        getMe {
          id
          nickname
        }
      }
    `
  );
  if (loading) {
    if (userState !== 'loading') {
      setUserState('loading');
    }
  } else if (error) {
    if (userState !== 'guest') {
      setUserState('guest');
    }
    localStorage.removeItem(TOKEN_KEY);
  } else if (data) {
    if (userState === 'loading' || userState === 'guest') {
      setUserState(data.getMe);
    }
  }
  return userState;
};

const App: React.FC = () => {
  const userState = useGetMe();

  const handleLogout: React.MouseEventHandler = e => {
    e.preventDefault();
    localStorage.removeItem(TOKEN_KEY);
    location.reload();
  };

  return (
    <UserContext.Provider value={userState}>
      <h1>🍍</h1>
      <Router>
        <div className="App">
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              {isGuest(userState) ? (
                <li>
                  <Link to="/register/">Register</Link>
                </li>
              ) : null}
              {isGuest(userState) ? (
                <li>
                  <Link to="/login/">Login</Link>
                </li>
              ) : null}
              {isLoggedIn(userState) ? (
                <li>
                  <Link to="#" onClick={handleLogout}>
                    Logout
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
          {isLoggedIn(userState) ? <p>Welcome {userState.nickname}</p> : null}
          <Route path="/" exact={true} component={Index} />
          <Route path="/register/" component={Register} />
          <Route path="/login/" component={Login} />
        </div>
      </Router>
    </UserContext.Provider>
  );
};

export default App;
