import React from 'react'
import { socket, server_url } from "./api";
import { Button, Empty, Descriptions, Collapse, List, Divider, message } from 'antd';
import { Link, Redirect } from 'react-router-dom';

const { Panel } = Collapse;

class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: props.username ? props.username : 'loading',
            password: '',
            rank: '',
            role: '',
            past_games: [],
            live_games: [],
            loading: true,
            joinedRoom: false,
        }
    }
    componentDidMount() {
        if (this.props.location.state) {
            this.setState({
                username: this.props.location.state.username
            })
        }
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
                    password: data.password,
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
        this.props.cb(this.props.username, room_id);
        message.info(`try to join room ${room_id} as ${role}`)
        this.setState({ joinedRoom: true })
    } 

    render() {
        let {joinedRoom} = this.state;
        if (this.state.username === 'loading') {
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
                <Redirect push to={{pathname: "/game", state: { username: this.state.username }}} />
            )
        }
        return (
            <div>
                <Descriptions title="Profile" bordered>
                    <Descriptions.Item label="Username">{this.state.username}</Descriptions.Item>
                    <Descriptions.Item label="Rank">{this.state.rank}</Descriptions.Item>
                    <Descriptions.Item label="MatchCount">{this.state.live_games.length+this.state.past_games.length}</Descriptions.Item>
                </Descriptions>
                <Divider orientation="left">Matches</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="Live Games" key="1">
                        <List
                            dataSource={this.state.live_games}
                            renderItem={item => (
                                <List.Item>
                                    Room id: {item.room_id} Between {item.players[0].username} and {item.players[1].username}
                                    <Button onClick={this.joinRoom(item.room_id)}> rejoin</Button>
                                </List.Item>
                            )}
                        />
                    </Panel>
                    <Panel header="Past matches" key="2">
                    <List
                            dataSource={this.state.past_games}
                            renderItem={item => (
                                <List.Item>
                                    Game Room id: {item.room_id} Between {item.players[0].username} and {item.players[1].username}   
                                    <Link to={{
                                        pathname: '/gameReview',
                                        state: {
                                            room_id : item.room_id,
                                            id: item._id
                                        }
                                        }} >
                                        <Button> replay</Button>
                                    </Link>
                                </List.Item>
                            )}
                        />
                    </Panel>
                </Collapse>
            </div>


        )
    }
}

export default Profile