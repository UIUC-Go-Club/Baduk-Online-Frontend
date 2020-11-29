import React from 'react'
import PropTypes from 'prop-types';
import ChatMesssage from './chatMessage';
import { List, Comment, Input } from 'antd'
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