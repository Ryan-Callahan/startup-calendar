// noinspection JSIgnoredPromiseFromCall

import React from 'react';
import Popup from "reactjs-popup";
import Button from "react-bootstrap/Button";
import {Form, FormControl, FormGroup, FormLabel} from "react-bootstrap";
import TimeUtils from "../calendar/TimeUtils";
import CalendarSelectorUtils from "../calendar/CalendarSelectorUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import {CalendarNotifier} from "../CalendarClient.js";

export function CreateEvent({name, description, time, calendars, setCalendars}) {
    const [eventName, setEventName] = React.useState((name != null) ? name : "");
    const [eventDescription, setEventDescription] = React.useState((description != null) ? description : "");
    const [eventTime, setEventTime] = React.useState((time != null) ? time : new Date())
    const [eventCalendars, setEventCalendars] = React.useState(new Map(calendars.map(calendar => [calendar._id, false])))
    const [isCalendarSelected, setIsCalendarSelected] = React.useState(CalendarSelectorUtils.isCalendarSelected(eventCalendars))

    React.useEffect(() => {
        setEventCalendars(new Map(calendars.map(calendar => [calendar._id, false])))
    }, [])

    async function createEvent() {
        const time = TimeUtils.getEpochToMinute(TimeUtils.getTimezoneTime(eventTime).getTime())

        const response = await fetch("/api/events", {
            method: "POST",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                name: eventName,
                description: eventDescription
            })
        })

        const event = await response.json();
        await fetch("/api/times", {
            method: "POST",
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                time: time,
                event_ids: event._id
            })
        })

        for (const calendar of eventCalendars.keys()) {
            await fetch('/api/calendar/times', {
                method: "POST",
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    _id: calendar,
                    event_times: time
                })
            })
        }

        setCalendars(await (await fetch("/api/users/calendars")).json())

        //todo send to relevant users
        CalendarNotifier.broadcastEvent("calendar", "update-users", {users: []})
    }

    return (
        <Popup
            trigger={
                <Button>Create Event</Button>
            }
            nested
            modal
        >
            {close => (
                <Form>
                    <FormGroup>
                        <FormLabel>
                            Name of Event:
                        </FormLabel>
                        <FormControl type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}/>
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>Description:</FormLabel>
                        <FormControl type="description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}/>
                    </FormGroup>
                    <FormGroup>
                        <DatePicker selected={eventTime} onChange={(date) => setEventTime(date)} showTimeSelect dateFormat="Pp"/>
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>Calendars:</FormLabel>
                        {CalendarSelectorUtils.getCalendarBoxes(eventCalendars, calendars, setEventCalendars, setCalendars, setIsCalendarSelected)}
                    </FormGroup>
                    <FormGroup>
                        <Button variant="primary" onClick={() => {
                            close();
                            createEvent()
                        }} disabled={!eventName || !isCalendarSelected}>Create Event</Button>
                        <Button variant="primary" onClick={() => close()}>Cancel Event</Button>
                    </FormGroup>
                </Form>
            )}
        </Popup>
    )
}