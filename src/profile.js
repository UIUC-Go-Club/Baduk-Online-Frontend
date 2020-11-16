import React from 'react'
import { socket, server_url } from "./api";
import { Button, Empty, Descriptions, Collapse, List, Divider } from 'antd';
import { Link } from 'react-router-dom';

const { Panel } = Collapse;

const match_data = [
    {
        game_id: '1123',
        opponent: 'Polom'
    },
    {
        game_id: '11',
        opponent: 'Restful'
    }
]
class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.username ? props.username : 'loading',
            email: 'abc@example.com',
            past_games: [],
            live_games: [],
            loading: true
        }
    }
    componentDidMount() {
        this.socketListeners();
        if (this.props.location.state) {
            this.setState({
                name: this.props.location.state.username
            })
        }
        this.fetchProfileData();
    }

    fetchProfileData = () => {
        const endpoint = server_url + 'user/:username';
        fetch(`${endpoint}/${encodeURIComponent(this.state.name)}`, {
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
                    name: data.username,
                    email: data.email,
                    password: data.password,
                    rank: data.rank,
                    past_games: data.past_games,
                    live_games: data.active_games
                })
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    socketListeners() {
        socket.on('profile', (data) => {
            const { name, email, past_games } = data;
            this.setState({
                name,
                email,
                past_games
            })
        })
    }

    render() {
        if (this.state.name === 'loading') {
            return (
                <Empty description={
                    <span>
                        Please login to view your profile
                    </span>
                }>
                    <Link to=''><Button type="primary">Login Now</Button></Link>
                </Empty>
            )
        }
        return (
            <div>
                <Descriptions title="Profile" bordered>
                    <Descriptions.Item label="Username">{this.state.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{this.state.email}</Descriptions.Item>
                    <Descriptions.Item label="MatchCount">{this.state.live_games.length+this.state.past_games.length}</Descriptions.Item>
                </Descriptions>
                <Divider orientation="left">Matches</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="Live Games" key="1">
                        <List
                            dataSource={this.state.live_games}
                            renderItem={item => (
                                <List.Item>
                                    Room id: {item.room_id} 
                                    <Button> rejoin</Button>
                                </List.Item>
                            )}
                        />
                    </Panel>
                    <Panel header="Past matches" key="2">
                    <List
                            dataSource={this.state.past_games}
                            renderItem={item => (
                                <List.Item>
                                    Game id: {item.game_id} 
                                    <Button> replay</Button>
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