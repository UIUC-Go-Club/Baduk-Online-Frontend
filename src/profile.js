import React from 'react'
import { socket, server_url } from "./api";
import { Button, Empty, Descriptions, Collapse, List, Divider, message, Form, Input, Col } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars';
import { Link, Redirect } from 'react-router-dom';

const { Panel } = Collapse;

class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem('username'),
            password: '',
            rank: '',
            role: '',
            past_games: [],
            live_games: [],
            loading: true,
            joinedRoom: false,
            editting: false,
        }
    }
    componentDidMount() {
        // if (this.props.location.state) {
        //     this.setState({
        //         username: this.props.location.state.username
        //     })
        // }
        this.fetchProfileData();
    }

    fetchProfileData = () => {
        const endpoint = server_url + 'user';
        fetch(`${endpoint}/${encodeURIComponent(this.state.username)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
        }).then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                this.setState({
                    loading: false,
                    username: data.username,
                    email: data.email,
                    phone: data.phone,
                    bio: data.bio,
                    gender: data.gender,
                    rank: data.rank,
                    role: data.role,
                    past_games: data.past_games,
                    live_games: data.active_games
                })
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    joinRoom = (room) => () => {
        const room_id = room;
        const role = 'player';
        console.log(`user: ${this.state.username} joined room ${room_id} as ${role}`);
        if (this.state.username === '') {
            message.warning('please login')
            return;
        }
        socket.emit('join_room_player', { username: this.state.username, room_id: room_id });
        message.info(`try to join room ${room_id} as ${role}`)
        this.setState({ joinedRoom: true })
    }

    edit = () => {
        this.setState({
            editting: true
        })
    }

    updateProfile = (value) => {
        const username = this.state.username;
        const endpoint = server_url + 'user';
        const profileData = {
            email: value.email,
            phone: value.phone,
        }
        fetch(`${endpoint}/${encodeURIComponent(username)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            body: JSON.stringify(profileData)
        }).then(response => {
            if (response.status === 204) {
                message.success('Profile updated!');
            }
            this.setState({
                editting: false,
            }, this.fetchProfileData)
        })
            .catch((error) => {
                console.error('update error:', error);
                message.error('update failed');
            });
    };

    render() {
        let { joinedRoom, editting } = this.state;
        if (!this.state.username) {
            return (
                <Empty description={
                    <span>
                        Please login to view your profile
                    </span>
                }>
                    <Link to='/signin'><Button type="primary">Login Now</Button></Link>
                </Empty>
            )
        }
        if (joinedRoom) {
            return (
                <Redirect push to={{ pathname: "/game", state: { username: this.state.username } }} />
            )
        }
        let emailElement, phoneElement;
        if (!editting) {
            emailElement = (<Descriptions.Item label="Email">{this.state.email}</Descriptions.Item>);
            phoneElement = (<Descriptions.Item label="Phone">{this.state.phone}</Descriptions.Item>);
        }
        let emailEdit;
        if (editting) {
            emailEdit = (
                <Col>
                    <Form initialValues={{
                        email: this.state.email,
                        phone: this.state.phone,
                    }}
                        onFinish={this.updateProfile}
                        labelCol={{ span: 5, offset: 2 }}
                        scrollToFirstError
                        layout={'inline'}
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Phone"
                            name="phone"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Update
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>
            )
        }
        return (
            <div>
                <Descriptions title="Profile" bordered extra={<Button type="primary" onClick={this.edit}>Edit</Button>}>
                    <Descriptions.Item label="Username">{this.state.username}</Descriptions.Item>
                    <Descriptions.Item label="Rank">{this.state.rank}</Descriptions.Item>
                    <Descriptions.Item label="MatchCount">{this.state.live_games.length + this.state.past_games.length}</Descriptions.Item>
                    {emailElement}
                    {phoneElement}
                </Descriptions>
                {emailEdit}
                <Divider orientation="left">Matches</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="Live Games" key="1">
                        <Scrollbars autoHide autoHeight autoHeightMax={300}>
                            <List
                                dataSource={this.state.live_games}
                                renderItem={item => (
                                    <List.Item>
                                        Room id: {item.room_id} Between {item.players[0].username} and {item.players[1].username}
                                        <Button onClick={this.joinRoom(item.room_id)}> rejoin</Button>
                                    </List.Item>
                                )}
                            />
                        </Scrollbars>
                    </Panel>
                    <Panel header="Past matches" key="2">
                        <Scrollbars autoHide autoHeight autoHeightMax={300}>
                            <List
                                dataSource={this.state.past_games}
                                renderItem={item => (
                                    <List.Item>
                                        Game Room id: {item.room_id} Between {item.players[0].username} and {item.players[1].username}
                                        <Link to={{
                                            pathname: '/gameReview',
                                            state: {
                                                room_id: item.room_id,
                                                id: item._id
                                            }
                                        }} >
                                            <Button> replay</Button>
                                        </Link>
                                    </List.Item>
                                )}
                            />
                        </Scrollbars>

                    </Panel>
                </Collapse>
            </div>


        )
    }
}

export default Profile