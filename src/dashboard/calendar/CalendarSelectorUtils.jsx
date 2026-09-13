import {Form} from "react-bootstrap";
import React from "react";
import {CalendarInfo} from "./calendarInfo";

class CalendarSelectorUtils {
    static isCalendarSelected(calendars) {
        for (const value of calendars.values()) {
            if (value === true) {
                return true
            }
        }
        return false
    }

    static getCalendarBoxes(activeCalendars, userCalendars, setActiveCalendars, setCalendars, setCalendarIsSelected) {

        function toggleActiveCalendar(calendar) {
            const updatedCalendars = new Map(activeCalendars)
            if (activeCalendars.get(calendar) === true) {
                updatedCalendars.set(calendar, false)
            } else {
                updatedCalendars.set(calendar, true)
            }
            setCalendarIsSelected(CalendarSelectorUtils.isCalendarSelected(updatedCalendars))
            setActiveCalendars(updatedCalendars, userCalendars)
        }

        const e = []
        for (const calendar of userCalendars) {
            e.push(
                <CalendarInfo key={calendar._id} calendar={calendar} toggleActiveCalendar={toggleActiveCalendar} activeCalendars={activeCalendars} setCalendars={setCalendars}/>
            )
        }
        return (
            <>{e}</>
        )
    }
}

export default CalendarSelectorUtils