import React from 'react';
import 'antd/dist/antd.css';
import 'rsuite/dist/styles/rsuite-default.css';
import './App.css';
import { Button, Col, Layout, Menu, Row } from 'antd';
import {
    DesktopOutlined,
    UserOutlined,
    HomeOutlined,
    SolutionOutlined,
    SelectOutlined
} from '@ant-design/icons';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import Game from './game.js'
import Profile from './profile'
import SignIn from './signinpage';
import RoomJoin from './roomjoin';
import Signup from './signup';
import GameHall from './gamehall';
import GameReview from './gamereview';



const { Header, Content, Footer, Sider } = Layout;
// const { SubMenu } = Menu;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false,
            username: localStorage.getItem('username'),
            room_id: ''
        }
    }

    componentDidMount() {

    }

    formSubmit = (username, room_id) => {
        console.log(username);
        this.setState({ username, room_id });
    }

    loginSubmit = (username, password) => {
        console.log(`signed in with username: ${username} password: ${password}`);
        this.setState({ username });
    }

    logout = () => {
        console.log('logout');
        localStorage.removeItem('username');
        this.setState({ username: '' })
    }

    onCollapse = collapsed => {
        console.log(collapsed);
        this.setState({ collapsed });
    };

    render() {
        // TODO highlight player
        const { collapsed } = this.state;
        return (
            <Router>
                <Layout style={{ minHeight: '100vh' }}>
                    <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
                        <div className="logo" />
                        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                            <Menu.Item key="Home" icon={<HomeOutlined />}>
                                <Link to=''>
                                    Home
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="signin" icon={<SolutionOutlined />}>
                                <Link to='signin'>
                                    Signin
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="signup" icon={<SolutionOutlined />}>
                                <Link to='signup'>
                                    Signup
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="joinroom" icon={<SelectOutlined />}>
                                <Link to='joinroom'>
                                    Room Join
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="Game" icon={<DesktopOutlined />}>
                                <Link to='game'>
                                    Game
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="User" icon={<UserOutlined />}>
                                <Link to='profile'>
                                    Profile
                                </Link>
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout className="site-layout">
                        <Header className="site-layout-background" style={{ padding: 0 }}>
                            <Row>
                                <Col span={6}>
                                    <h1>{this.state.username!=='' && `     Welcome ${this.state.username}`}</h1>
                                </Col>
                                <Col span={6} offset={12}>
                                    <Link to=''>
                                        <Button size='large' onClick={this.logout}>Logout</Button>
                                    </Link>
                                </Col>
                            </Row>
                        </Header>
                        <Content>
                            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                                <Switch>
                                    <Route exact path="/" render={props => <GameHall cb={this.formSubmit} {...props} />} />
                                    <Route path="/signin" render={props => <SignIn cb={this.formSubmit} {...props} />}></Route>
                                    <Route path="/joinroom" render={props => <RoomJoin cb={this.formSubmit} {...props} />} />
                                    <Route path="/signup" render={props => <Signup cb={this.formSubmit} {...props} />} />
                                    <Route path="/game" render={props => <Game {...props} />} />
                                    <Route path="/profile" render={props => <Profile cb={this.formSubmit} {...props} />} />
                                    <Route path="/gamereview" render={props => <GameReview {...props} />} />
                                </Switch>
                            </div>
                        </Content>
                        <Footer style={{ textAlign: 'center' }}>Baduk Online Go @2020 Created by Ziyang Yu and Xingzhi Liu</Footer>
                    </Layout>
                </Layout>
            </Router>
        );
    }
}
export default App;
