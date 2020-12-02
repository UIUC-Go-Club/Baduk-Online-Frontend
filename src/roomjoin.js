import React from 'react';
import { Form, Input, Button, Col, Select, message, Radio } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';

import { Link, Redirect } from 'react-router-dom';
import { socket } from "./api";
import { minToMS } from './utils';

const { Option } = Select;

const layout = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 16,
    },
};
const tailLayout = {
    wrapperCol: {
        offset: 8,
        span: 16,
    },
};

class RoomJoin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: localStorage.getItem('username'),
            submitted: false
        }
    }

    formRef = React.createRef();

    componentDidMount() {
        // if (this.props.location.state) {
        //     this.setState({
        //         username: this.props.location.state.username
        //     })
        // }
    }

    componentWillUnmount() {
        // this.props.history.goForward();
    }

    handleSubmit = (values) => {
        console.log('Success:', values);
        const room_id = values.room;
        const { role, type, boardSize, reservedTime, countdown, countdownTime, persistent } = values;
        if (type === 'join') {
            console.log(`user: ${this.state.username} joined room ${room_id} as ${role}`);
            if (!this.state.username) {
                message.warning('please login')
                return;
            }
            if (role === 'player') {
                socket.emit('join_room_player', { username: this.state.username, room_id: room_id });
            } else {
                socket.emit('join_room_bystander', { username: this.state.username, room_id: room_id })
                console.log('bystander join');
            }
            message.info(`try to join room ${room_id} as ${role}`)
        } else if (type === 'host') {
            socket.emit('create room', {
                username: this.state.username,
                room_id: room_id,
                boardSize: boardSize,
                reservedTime: reservedTime,
                countdown: countdown,
                countdownTime: countdownTime,
                persistent: persistent,
            })
            message.info(`try to create room ${room_id}`)
        }
        // this.props.cb(this.props.username, room_id);
        this.setState({ submitted: true })
    }

    onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    }

    onReset = () => {
        this.formRef.current.resetFields();
    };

    onRoleChange = value => {
        switch (value) {
            case 'player':
                this.formRef.current.setFieldsValue({
                    role: 'player',
                });
                return;
            case 'bystander':
                this.formRef.current.setFieldsValue({
                    role: 'bystander',
                });
                return;
            default:
                return;
        }
    }

    onTypeChange = value => {
        switch (value) {
            case 'join':
                this.formRef.current.setFieldsValue({
                    type: 'join',
                });
                return;
            case 'host':
                this.formRef.current.setFieldsValue({
                    type: 'host',
                });
                return;
            default:
                return;
        }
    }

    onBoardSizeChange = value => {
        switch (value) {
            case 9:
                this.formRef.current.setFieldsValue({
                    boardSize: 9,
                });
                return;
            case 13:
                this.formRef.current.setFieldsValue({
                    boardSize: 13,
                });
                return;
            case 19:
                this.formRef.current.setFieldsValue({
                    boardSize: 19,
                });
                return;
            default:
                return;
        }
    }

    onReservedTimeChange = value => {
        switch (value) {
            case minToMS(1):
                this.formRef.current.setFieldsValue({
                    reservedTime: minToMS(1),
                });
                return;
            case minToMS(10):
                this.formRef.current.setFieldsValue({
                    reservedTime: minToMS(10),
                });
                return;
            case minToMS(20):
                this.formRef.current.setFieldsValue({
                    reservedTime: minToMS(20),
                });
                return;
            default:
                return;
        }
    }

    onCountdownChange = value => {
        switch (value) {
            case 1:
                this.formRef.current.setFieldsValue({
                    countdown: 1,
                });
                return;
            case 3:
                this.formRef.current.setFieldsValue({
                    countdown: 3,
                });
                return;
            case 5:
                this.formRef.current.setFieldsValue({
                    countdown: 5,
                });
                return;
            default:
                return;
        }
    }

    onCountdownTimeChange = value => {
        switch (value) {
            case minToMS(0.5):
                this.formRef.current.setFieldsValue({
                    countdownTime: minToMS(0.5),
                });
                return;
            case minToMS(0.75):
                this.formRef.current.setFieldsValue({
                    countdownTime: minToMS(0.75),
                });
                return;
            case minToMS(1):
                this.formRef.current.setFieldsValue({
                    countdownTime: minToMS(1),
                });
                return;
            default:
                return;
        }
    }


    render() {
        const submitted = this.state.submitted;
        if (submitted) {
            return (
                <Redirect push to={{ pathname: "/game", state: { username: this.state.username } }} />
            )
        }
        return (
            <div>
                <Form
                    {...layout}
                    name="basic"
                    onFinish={this.handleSubmit}
                    onFinishFailed={this.onFinishFailed}
                    initialValues={{
                        role: 'player',
                        type: 'join',
                        boardSize: 19,
                        reservedTime: minToMS(10),
                        countdown: 3,
                        countdownTime: minToMS(0.5),
                    }}
                    ref={this.formRef}>
                    <Form.Item
                        label='Type'
                        name='type'
                    >
                        <Radio.Group buttonStyle="solid" onChange={this.onTypeChange}>
                            <Radio.Button value="host">Host</Radio.Button>
                            <Radio.Button value="join">Join</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        label="room id"
                        name="room"
                        rules={[
                            {
                                required: true,
                                message: 'Please input room id!',
                            },
                        ]}>
                        <Col span={6}>
                            <Input
                                size="large"
                                placeholder="Enter game room id"
                                prefix={<DesktopOutlined className="site-form-item-icon" />}
                                allowClear
                            />
                        </Col>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('type') === 'join' ? (
                                <Form.Item
                                    label='role'
                                    name='role'
                                    rules={
                                        [{
                                            required: true,
                                        }]
                                    }>
                                    <Col span={6}>
                                        <Select defaultValue="player" onChange={this.onRoleChange}>
                                            <Option value="player">Player</Option>
                                            <Option value="bystander">Observer</Option>
                                        </Select>
                                    </Col>
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('type') === 'host' ? (
                                <Form.Item
                                    name='boardSize'
                                    label='Board Size'
                                >
                                    <Col span={6}>
                                        <Select defaultValue={19} onChange={this.onBoardSizeChange}>
                                            <Option value={9}>9</Option>
                                            <Option value={13}>13</Option>
                                            <Option value={19}>19</Option>
                                        </Select>
                                    </Col>
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('type') === 'host' ? (
                                <Form.Item
                                    name='reservedTime'
                                    label='Reserved Time'
                                >
                                    <Col span={6}>
                                        <Select defaultValue={minToMS(10)} onChange={this.onReservedTimeChange}>
                                            <Option value={minToMS(1)}> 1 minute</Option>
                                            <Option value={minToMS(10)}>10 minutes</Option>
                                            <Option value={minToMS(20)}>20 minutes</Option>
                                        </Select>
                                    </Col>
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('type') === 'host' ? (
                                <Form.Item
                                    name='countdown'
                                    label='Countdown Chances'
                                >
                                    <Col span={6}>
                                        <Select defaultValue={3} onChange={this.onCountdownChange}>
                                            <Option value={1}>1</Option>
                                            <Option value={3}>3</Option>
                                            <Option value={5}>5</Option>
                                        </Select>
                                    </Col>
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('type') === 'host' ? (
                                <Form.Item
                                    name='countdownTime'
                                    label='Countdown Time'
                                >
                                    <Col span={6}>
                                        <Select defaultValue={minToMS(0.5)} onChange={this.onCountdownTimeChange}>
                                            <Option value={minToMS(0.5)}> 30 seconds</Option>
                                            <Option value={minToMS(0.75)}>45 seconds</Option>
                                            <Option value={minToMS(1)}>60 seconds</Option>
                                        </Select>
                                    </Col>
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('type') === 'join' ? (
                                <Form.Item {...tailLayout}>
                                    <Button type="primary" size='large' htmlType="submit">
                                        Join Room
                                </Button>
                                    <Button htmlType="button" size='large' onClick={this.onReset}>
                                        Reset
                                </Button>
                                </Form.Item>
                            ) : (
                                    <Form.Item {...tailLayout}>
                                        <Button type="primary" size='large' htmlType="submit">
                                            Create Room
                                </Button>
                                        <Button htmlType="button" size='large' onClick={this.onReset}>
                                            Reset
                                </Button>
                                    </Form.Item>
                                );
                        }}
                    </Form.Item>
                </Form>
                <Col span={6} offset={8}>
                    <Link to='/'>
                        <Button htmlType="button" size='large'>
                            Return to Game Hall
                        </Button>
                    </Link>
                </Col>

            </div>
        )
    }
}

export default RoomJoin;