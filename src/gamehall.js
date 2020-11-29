import React from 'react';
import { Button, message, Empty, Popover } from 'antd';
import { TouchableOpacity, View } from 'react-native';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import { Link, Redirect } from 'react-router-dom';
import { socket, server_url } from "./api";
import { startMap, getCurrentBoard } from './utils'

const roomText = (room) => (
    <div>
        <p>Player1: {room.players[0] ? room.players[0].username : 'waiting'}</p>
        <p>Player2: {room.players[1] ? room.players[1].username : 'waiting'}</p>
    </div>
)

/**
 * @param cb callback function used to update parent's username
 * Game Hall Screen, used to show all active games
 */
class GameHall extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: props.username,
            roomJoined: false,
            loading: true,
            gameRooms: [],
        }
    }

    componentDidMount() {
        if (this.props.location.state) {
            this.setState({
                username: this.props.location.state.username
            })
        }
        this.fetchRoomData();
    }

    fetchRoomData = () => {
        const endpoint = server_url + 'room/';
        fetch(`${endpoint}`, {
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
                    gameRooms: data,
                })
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    roomLinkClick = (room_id) => () => {
        const role = 'player';
        console.log(`user: ${this.state.username} joined room ${room_id} as ${role}`);
        if (this.state.username === '') {
            message.warning('please login')
            return;
        }
        console.log(`user: ${this.state.username} joined room ${room_id} as ${role}`);
        if (this.state.username === '') {
            message.warning('please login')
            return;
        }
        socket.emit('join_room_player', { username: this.state.username, room_id: room_id });
        this.props.cb(this.props.username, room_id);
        message.info(`try to join room ${room_id} as ${role}`)
        this.setState({ roomJoined: true })
    }

    render() {
        const { loading, roomJoined, gameRooms, } = this.state;
        const gameRoomLists = gameRooms.map((room) => (
            <Popover 
                title={`Room id: ${room.room_id}`} 
                content={roomText(room)}>
                <TouchableOpacity key={room.room_id} onPress={this.roomLinkClick(room.room_id)} >
                    <Goban vertexSize={13}
                        signMap={room.pastMoves.length === 0 ? startMap(room.boardSize) : getCurrentBoard(room.pastMoves, room.boardSize)}
                        showCoordinates={false} />
                </TouchableOpacity>
            </Popover>
            )
        );
        if (loading) {
            return (
                <Empty description={
                    <span>
                        No active game room found.
                    </span>
                }>
                    <Link to='/createRoom'><Button type="primary">Host new game</Button></Link>
                </Empty>
            )
        }
        if (roomJoined) {
            return (
                <Redirect push to={{ pathname: "/game", state: { username: this.state.username } }} />
            )
        }
        return (
            <View style={{ flex: 1, flexDirection: 'row' }}>
                {gameRoomLists}
            </View>
        );
    }
}

export default GameHall