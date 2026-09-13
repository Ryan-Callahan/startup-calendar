// noinspection JSIgnoredPromiseFromCall

import React from 'react';
import Popup from "reactjs-popup";
import {Card, Container, Row} from "react-bootstrap";
import TimeUtils from "../calendar/TimeUtils";
import Button from "react-bootstrap/Button";
import {CalendarNotifier} from "../CalendarClient.js";

export function Event({time, date, event, setCalendars}) {

    async function deleteEvent() {
        await fetch(`/api/events/${event._id}`, {
            method: "DELETE"
        });
        setCalendars(await (await fetch("/api/users/calendars")).json());

        //todo send to relevant users
        CalendarNotifier.broadcastEvent("calendar", "update-users", {users: []});
    }

    function getEventCard() {
        return (
            <div className="event-card-container">
                <Card>
                    {event["name"]}
                </Card>
            </div>
        )
    }

    return (
        <Popup
            trigger={
                getEventCard()
            }
            on="click"
            modal
            contentStyle={{width: "400px"}}
        >
            {close => (
                <Container>
                    <Row style={{textDecoration: "underline", fontSize: "14pt"}}>
                        {event.name}
                    </Row>
                    <Row style={{opacity: "70%", fontSize: "9pt"}}>
                        {TimeUtils.getDateAsString(date)} {time}
                    </Row>
                    <Row style={{paddingTop: "5px"}}>
                        {event.description}
                    </Row>
                    <Button type="secondary" onClick={() => {
                        close();
                        deleteEvent();
                    }}>Delete Event</Button>
                </Container>
            )}
        </Popup>
    )
}