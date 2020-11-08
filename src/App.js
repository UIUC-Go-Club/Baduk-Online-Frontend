import React from 'react';
import 'antd/dist/antd.css';
import './App.css';
import { Layout, Menu } from 'antd';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import Game from './game.js'
import Profile from './profile'

const { Header, Content, Footer, Sider } = Layout;
// const { SubMenu } = Menu;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false,
        }
    }

    componentDidMount() {

    }

    onCollapse = collapsed => {
        console.log(collapsed);
        this.setState({ collapsed });
    };

    render() {
        const { collapsed } = this.state;
        return (
            <Router>
                <Layout style={{ minHeight: '100vh' }}>
                    <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
                        <div className="logo" />
                        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                            <Menu.Item key="Home" icon={<HomeOutlined />}>
                                <Link to=''>
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
                        <Header className="site-layout-background" style={{ padding: 0 }} />
                        <Content>
                            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                            <Switch>
                                <Route exact path="/">
                                    <Game />
                                </Route>
                                <Route path="/profile">
                                    <Profile />
                                </Route>
                            </Switch>
                            </div>
                        </Content>
                        <Footer style={{ textAlign: 'center' }}>Baduk Online Go @2020 Created by Ziyang Yu</Footer>
                    </Layout>
                </Layout>
            </Router>
        );
    }
}
export default App;
