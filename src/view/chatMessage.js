import React from 'react'
import PropTypes from 'prop-types';

class ChatMesssage extends React.Component {
    constructor(props) {
        super(props);
        this.message = props.message;
        this.timeSent = props.timeSent;
        this.username = props.username; // sent by
    }

    render() {
        return(
            <div className='chat_message'>
                <p>{this.username} ({this.timeSent}): {this.message}</p>
            </div>
        )
    }
}

ChatMesssage.propType = {
    message: PropTypes.string,
}

ChatMesssage.defaultProps = {
    chats: []
}

export default ChatMesssage