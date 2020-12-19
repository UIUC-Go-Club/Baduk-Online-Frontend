import React from 'react';
import { Button, message, Empty, Popover } from 'antd';
import { TouchableOpacity, View } from 'react-native';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import { Link, Redirect } from 'react-router-dom';
import { socket, server_url } from "./api";
import { startMap, getCurrentBoard, getBoardVertexSize } from './utils'

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
            username: localStorage.getItem('username'),
            roomJoined: false,
            loading: true,
            gameRooms: [],
        }
    }

    componentDidMount() {
        // if (this.props.location.state) {
        //     this.setState({
        //         username: this.props.location.state.username
        //     })
        // }
        this.fetchRoomData();
    }

    /**
     * fetch the all active game room data from restful api
     */
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

    /**
     * Handle page redirect when a board is clicked, lead user to target game room
     * @param {String} room_id 
     */
    roomLinkClick = (room_id) => () => {
        const role = 'player';
        console.log(`user: ${this.state.username} joined room ${room_id} as ${role}`);
        if (!this.state.username) {
            message.warning('please login')
            return;
        }
        console.log(`user: ${this.state.username} joined room ${room_id} as ${role}`);
        if (this.state.username === '') {
            message.warning('please login')
            return;
        }
        socket.emit('join room player', { username: this.state.username, room_id: room_id });
        this.props.cb(this.props.username, room_id);
        message.info(`try to join room ${room_id} as ${role}`)
        this.setState({ roomJoined: true })
    }

    render() {
        const { loading, roomJoined, gameRooms, } = this.state;
        const gameRoomLists = gameRooms.map((room) => (
            <Popover 
                key={room.room_id}
                title={`Room id: ${room.room_id}`} 
                content={roomText(room)}>
                <TouchableOpacity key={room.room_id} onPress={this.roomLinkClick(room.room_id)} >
                    <Goban vertexSize={getBoardVertexSize(room.boardSize)}
                        signMap={!room.currentBoardSignedMap ? startMap(room.boardSize) : JSON.parse(room.currentBoardSignedMap)}
                        showCoordinates={false} 
                        style={{marginRight: 10, marginBottom: 10, flexWrap: 'wrap'}}/>
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
                    <Link to='/joinroom'><Button type="primary">Host new game</Button></Link>
                </Empty>
            )
        }
        if (roomJoined) {
            return (
                <Redirect push to={{ pathname: "/game", state: { username: this.state.username } }} />
            )
        }
        return (
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                {gameRoomLists}
            </View>
        );
    }
}

export default GameHall