import React from 'react'
import {socket} from "./api"; 

class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: 'anonymous',
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
            const {name, email, past_games} = data;
            this.setState({
                name,
                email,
                past_games
            })
        })
    }
    
    render() {
        return(
            <div>
                Profile Place Holder
            </div>
        )
    }
}

export default Profile