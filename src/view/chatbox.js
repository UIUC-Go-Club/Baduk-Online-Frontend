import React from 'react'
import PropTypes from 'prop-types';
import ChatMesssage from './chatMessage';
import { List, Comment, Input } from 'antd'
import { socket } from "../api";

const { Search } = Input;

class Chatbox extends React.Component {
    constructor(props) {
        super(props);
        this.username = props.username;
        this.room_id = props.room_id;
    }

    sendChat = data => {
        let message = {
            room_id: this.room_id,
            username: this.username,
            message: data,
            sentTime: Date.now()
        }
        socket.emit("new message", message);
    }

    render() {
        return (
            <div>
                <List
                    className="chat-list"
                    itemLayout="horizontal"
                    dataSource={this.props.chats}
                    locale={{emptyText: 'No chat messages yet.'}}
                    renderItem={item => (
                        <li>
                            <Comment
                                author={item.username}
                                content={item.message}
                                datetime={item.timeSent}
                            />
                        </li>
                    )}
                />
                <Search
                    allowClear
                    enterButton="Send"
                    onSearch={this.sendChat}
                />
            </div>
        )
    }
}

Chatbox.propType = {
    chats: PropTypes.arrayOf(PropTypes.instanceOf(ChatMesssage))
}

Chatbox.defaultProps = {
    chats: []
}

export default Chatbox