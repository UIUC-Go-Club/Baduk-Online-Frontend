import React from 'react'
import { socket } from "./api";
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
            live_games: []
        }
    }
    componentDidMount() {
        this.socketListeners();
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
                    <Descriptions.Item label="MatchCount">Total matches placeholder</Descriptions.Item>
                </Descriptions>
                <Divider orientation="left">Matches</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="Live Games" key="1">
                        <List
                            dataSource={match_data}
                            renderItem={item => (
                                <List.Item>
                                    Game id: {item.game_id}  Match time: {item.opponent}
                                    <Button> replay</Button>
                                </List.Item>
                            )}
                        />
                    </Panel>
                    <Panel header="Past matches" key="2" disabled>
                        <p>placeholder</p>
                    </Panel>
                </Collapse>
            </div>


        )
    }
}

export default Profile