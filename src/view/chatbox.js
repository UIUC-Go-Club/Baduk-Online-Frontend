import React from 'react'
import PropTypes from 'prop-types';
import ChatMesssage from './chatMessage';
import { Input } from 'antd';
import { List } from 'rsuite';
import { FormInstance } from 'antd/lib/form';
import { socket } from "../api";
import Form from 'antd/lib/form/Form';

class Chatbox extends React.Component {
    constructor(props) {
        super(props);
        this.username = props.username;
        this.room_id = props.room_id;
    }
    formRef = React.createRef();

    /**
     * Send chat message entered to backend
     * @param {Form Object} data data from search box used as chatbox
     */
    sendChat = data => {
        let message = {
            room_id: this.room_id,
            username: this.username,
            message: data.message,
            sentTime: Date.now()
        }
        socket.emit("new message", message);
        this.formRef.current.resetFields();
    }

    render() {
        const chats = this.props.chats;
        return (
            <div>
                <List
                    autoScroll
                    bordered
                    style={{ height: 300 }}
                >
                    {chats.map(({ username, message, timeSent, disabled }, index) => (
                        <List.Item key={message} index={index} disabled={disabled}>
                            {username} : {message}
                        </List.Item>
                    ))}
                </List>
                <Form ref={this.formRef} onFinish={this.sendChat}>
                    <Form.Item
                        name='message'
                        rules={[{required: true,}]}
                    >
                        <Input/>
                    </Form.Item>
                </Form>
                
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