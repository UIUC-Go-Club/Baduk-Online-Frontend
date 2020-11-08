import React from 'react';

import {socket} from "./api";

class SignIn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nickname: '',
            room: ''
        }
    }

    componentDidMount() {
        this.socketListeners();
    }

    socketListeners = () => {
    }

    signin = (nickname, room) => {
        socket.emit('join room', {nickname, room});
    }

    render() {
        return(
            <div>
                SignIn PlaceHolder
            </div>
        )
    }
}

export default SignIn;