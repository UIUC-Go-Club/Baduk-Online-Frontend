import React from 'react';
import Player from './player'
import Board from '@sabaki/go-board'
import PropTypes from 'prop-types';

class Room extends React.Component{
    constructor(props) {
        super(props);
        this.room_id = props.room_id;
        this.player1 = props.player1;
        this.player2 = props.player2;
        this.board = props.board;
    }
}

Room.defaultProps = {
    room_id: -1,
    player1: new Player(),
    player2: new Player(),
    board: new Board()
}

Room.propTypes = {
    room_id: PropTypes.number.isRequired,
    player1: PropTypes.instanceOf(Player),
    player2: PropTypes.instanceOf(Player),
    board: PropTypes.instanceOf(Board)
}

export default Room;