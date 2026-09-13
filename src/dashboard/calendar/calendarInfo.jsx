import React from 'react';
import {Col, Container, Form, FormControl, FormLabel, Image, Row} from "react-bootstrap";
import Popup from "reactjs-popup";
import Button from "react-bootstrap/Button";
import {CalendarNotifier} from "../CalendarClient.js";

export function CalendarInfo({calendar, toggleActiveCalendar, activeCalendars, setCalendars}) {
    const [inviteUser, setInviteUser] = React.useState('');
    const [validInvite, setValidInvite] = React.useState(true);
    const [users, setUsers] = React.useState([]);

    async function sendInvite() {
        const response = await fetch('/api/user/calendars', {
            method: "POST",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                calendar_id: calendar._id,
                username: inviteUser
            })
        });

        if (response.status !== 200) {
            setValidInvite(false);
        } else {
            setValidInvite(true);
            setInviteUser('');
            setCalendars(await (await fetch("/api/users/calendars")).json());
        }

        //todo make this send only relevant users
        //make an endpoint that returns all usernames that have that calendar
        CalendarNotifier.broadcastEvent("calendar", "update-users", {users: [inviteUser]});
    }

    async function deleteCalendar() {
        if (activeCalendars.get(calendar._id)) {
            toggleActiveCalendar(calendar._id);
        }
        await fetch(`/api/calendar/${calendar._id}`, {
            method: "DELETE"
        });
        setCalendars(await (await fetch("/api/users/calendars")).json());

        //todo send to all users that have the calendar
        CalendarNotifier.broadcastEvent("calendar", "update-users", {users: []});
    }

    return (
        <Container>
            <Row>
                <Col xs="9">
                    <Form.Check
                        key={"checkbox-" + calendar._id}
                        name={"checkbox-" + calendar._id}
                        type="switch"
                        label={calendar.name}
                        checked={activeCalendars.get(calendar._id)}
                        onChange={() => toggleActiveCalendar(calendar._id)}
                    />
                </Col>
                <Col xs="3">
                    <Popup
                        trigger={
                                <img alt="calendar-info-icon" src="/fluent--calendar-settings-16-regular.svg"
                                     className="calendar-info-button image"/>
                        }
                        modal
                    >
                        {close => (
                        <Container>
                            <Row>
                                <Col xs="10">
                                    <h2>
                                        {calendar.name}
                                    </h2>
                                </Col>
                                <Col xs="2">
                                    <img alt="delete-icon" src="/fluent--delete-12-regular.svg" className="calendar-info-button image" onClick={() => {
                                        deleteCalendar();
                                        close();
                                    }}/>
                                </Col>
                            </Row>
                            {users.length > 0 && (
                                <Row>
                                    Shared with: {users.toString()}
                                </Row>
                            )}
                            <Row>
                                <Form>
                                    <FormControl type="invite" placeholder="Invite user by username" value={inviteUser} onChange={(e) => setInviteUser(e.target.value)}/>
                                    <Button onClick={() => sendInvite()}>Invite</Button>
                                    {!validInvite && <errorMessage>User not found</errorMessage>}
                                    <Button type="secondary" onClick={() => close()}>Close</Button>
                                </Form>
                            </Row>
                        </Container>
                        )}
                    </Popup>
                </Col>
            </Row>
        </Container>
    )
}