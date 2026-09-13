import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import {BrowserRouter, NavLink, Route, Routes} from 'react-router-dom';
import {Login} from './login/login';
import {Dashboard} from './dashboard/dashboard';
import {About} from './about/about';
import {CreateAccount} from './login/createAccount';
import {Nav, NavItem} from "react-bootstrap";
import {AuthState} from "./login/authState";
import {Profile} from "./profile/profile";
import {MonsterFact} from "./monster-fact/monsterFact";
import {Error} from "./error/error";

export default function App() {
    const [username, setUsername] = React.useState();
    const currentAuthState = username ? AuthState.Authenticated : AuthState.Unauthenticated;
    const [authState, setAuthState] = React.useState(currentAuthState);

    React.useEffect(() => {
        fetch('/api/auth/username', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }})
            .then((response) => response.json())
            .then(body => {
                if (body) {
                    setUsername(body.username)
                    setAuthState(AuthState.Authenticated)
                } else {
                    setUsername('')
                    setAuthState(AuthState.Unauthenticated)
                }
            });
    }, [])

    return (
        <BrowserRouter>
            <div className="body bg-dark text-light">
                <header className="fixed-top bg-solid border-bottom">
                    <nav className="navbar navbar-dark">
                        <div className="navbar-brand">Schedulizer260</div>
                        <Nav className="nav" variant="pills" defaultActiveKey="">
                            <NavItem className="nav-item">
                                <NavLink className="nav-link link-light" to="">Login</NavLink>
                            </NavItem>
                            {authState === AuthState.Authenticated && (
                                <NavItem className="nav-item">
                                    <NavLink className="nav-link link-light" to="dashboard">Home</NavLink>
                                </NavItem>
                            )}
                            <NavItem className="nav-item">
                                <NavLink className="nav-link link-light" to="about">About</NavLink>
                            </NavItem>
                        </Nav>
                        <Profile username={username}/>
                    </nav>
                </header>

                <Routes>
                    <Route path='/' element={
                        <Login
                            user={username}
                            authState={authState}
                            onAuthChange={(user, authState) => {
                                setAuthState(authState);
                                setUsername(user);
                            }}
                        />
                    } exact/>
                    <Route path='/about' element={<About/>}/>
                    <Route path='/dashboard' element={<Dashboard/>}/>
                    <Route path='/createAccount' element={<CreateAccount/>}/>
                    <Route path='*' element={<NotFound/>}/>
                </Routes>

                <footer className="border-top">
                    <MonsterFact/>
                    <small>Ryan Callahan 2025</small>
                    <div>
                        <a href="https://github.com/Ryan-Callahan/startup/tree/main">Github</a>
                        <a href="https://ryan-callahan.com">Other Sites</a>
                    </div>
                </footer>
            </div>
        </BrowserRouter>
    );
}

function NotFound() {
    return <main className="container-fluid bg-secondary text-center"><div>404: Return to sender. Address unknown.</div><Error/></main>;
}